"""Base parser types."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ParsedDocument:
    """Result of parsing a file."""

    text: str
    metadata: dict = field(default_factory=dict)
    pages: list[str] = field(default_factory=list)

    @property
    def page_count(self) -> int:
        return len(self.pages) if self.pages else (1 if self.text else 0)
