"""Markdown parser with frontmatter extraction."""
from __future__ import annotations

import re
from pathlib import Path

from hanimo_rag.parsers.base import ParsedDocument
from hanimo_rag.parsers.text import TextParser

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


class MarkdownParser:
    """Parse markdown files, extracting YAML frontmatter as metadata."""

    def __init__(self) -> None:
        self._text_parser = TextParser()

    def parse(self, path: str) -> ParsedDocument:
        doc = self._text_parser.parse(path)
        text = doc.text
        metadata = dict(doc.metadata)

        # Extract frontmatter
        match = _FRONTMATTER_RE.match(text)
        if match:
            frontmatter_raw = match.group(1)
            metadata["frontmatter"] = _parse_simple_yaml(frontmatter_raw)
            # Remove frontmatter from body text
            text = text[match.end() :].strip()

        # Extract title from first heading
        title_match = re.match(r"^#\s+(.+)$", text, re.MULTILINE)
        if title_match:
            metadata["title"] = title_match.group(1).strip()

        return ParsedDocument(
            text=text,
            metadata=metadata,
        )


def _parse_simple_yaml(raw: str) -> dict[str, str]:
    """Minimal YAML-like key:value parser (no dependency on PyYAML)."""
    result: dict[str, str] = {}
    for line in raw.strip().splitlines():
        line = line.strip()
        if ":" in line and not line.startswith("#"):
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip().strip("\"'")
            if key:
                result[key] = value
    return result
