"""Query analysis and keyword expansion via LLM."""
from __future__ import annotations

from hanimo_rag.llm.base import LLMBase

SYSTEM_PROMPT = (
    "You are a search query analyzer. Extract search parameters from user queries. "
    "Always output valid JSON."
)

PARSE_PROMPT = """Analyze this search query and extract search parameters.

Query: {query}

Output JSON only:
{{
  "keys": ["keyword1", "keyword2", ...],
  "intent": "question|lookup|comparison|how-to|debug|other",
  "category": "tutorial|reference|api|concept|troubleshooting|config|example|other|any"
}}"""

EXPAND_PROMPT = """The search for query "{query}" with keys {current_keys} found insufficient results.
Suggest alternative or expanded search keywords (synonyms, related terms, broader/narrower terms).

Output JSON only:
{{
  "expanded_keys": ["alt1", "alt2", ...]
}}"""


class Router:
    """Parse queries and expand search keys using LLM."""

    def __init__(self, llm: LLMBase) -> None:
        self.llm = llm

    async def parse_query(self, query: str) -> dict:
        """Parse a user query into structured search parameters."""
        prompt = PARSE_PROMPT.format(query=query)
        result = await self.llm.generate_json(prompt, system=SYSTEM_PROMPT)

        # Validate and provide defaults
        keys = result.get("keys", [])
        if not keys:
            # Fallback: split query into keywords
            keys = [w for w in query.lower().split() if len(w) > 2]

        return {
            "keys": keys,
            "intent": result.get("intent", "other"),
            "category": result.get("category", "any"),
        }

    async def expand_keys(self, query: str, current_keys: list[str]) -> list[str]:
        """Generate expanded/alternative search keywords."""
        prompt = EXPAND_PROMPT.format(
            query=query,
            current_keys=current_keys,
        )
        result = await self.llm.generate_json(prompt, system=SYSTEM_PROMPT)

        expanded = result.get("expanded_keys", [])
        if not expanded:
            return []

        return [str(k) for k in expanded if k]
