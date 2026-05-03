"""Abstract base for LLM providers."""
from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class LLMBase(ABC):
    """Base class for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, system: str = "") -> str:
        """Generate a text completion."""
        ...

    async def generate_json(self, prompt: str, system: str = "", retries: int = 2) -> dict | list:
        """Generate and parse JSON. Retries on parse failure."""
        last_error: Exception | None = None

        for attempt in range(retries):
            raw = await self.generate(prompt, system=system)
            try:
                return _extract_json(raw)
            except (json.JSONDecodeError, ValueError) as exc:
                last_error = exc
                logger.warning(
                    "JSON parse failed (attempt %d/%d): %s — raw: %s",
                    attempt + 1,
                    retries,
                    exc,
                    raw[:300],
                )
                # On retry, append a hint to the prompt
                if attempt < retries - 1:
                    prompt = (
                        prompt
                        + "\n\nIMPORTANT: Your previous response was not valid JSON. "
                        "Output ONLY a valid JSON object, no markdown fences or extra text."
                    )

        logger.error("JSON generation failed after %d attempts: %s", retries, last_error)
        return {}


def _extract_json(text: str) -> dict | list:
    """Extract JSON from text that may contain markdown fences or surrounding prose."""
    text = text.strip()

    # Try direct parse first
    try:
        parsed = json.loads(text)
        if isinstance(parsed, (dict, list)):
            return parsed
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    if "```" in text:
        # Find content between first ``` and last ```
        start = text.index("```")
        end = text.rindex("```")
        if start != end:
            inner = text[start + 3 : end].strip()
            # Remove language tag (e.g., "json")
            if inner.startswith("json"):
                inner = inner[4:].strip()
            try:
                parsed = json.loads(inner)
                if isinstance(parsed, (dict, list)):
                    return parsed
            except json.JSONDecodeError:
                pass

    # Try to find JSON object or array boundaries
    for open_char, close_char in [("{", "}"), ("[", "]")]:
        first = text.find(open_char)
        last = text.rfind(close_char)
        if first != -1 and last > first:
            candidate = text[first : last + 1]
            try:
                result = json.loads(candidate)
                if isinstance(result, (dict, list)):
                    return result
            except json.JSONDecodeError:
                continue

    raise ValueError(f"Could not extract JSON from: {text[:200]}")
