"""Plain text parser with encoding detection."""
from __future__ import annotations

import logging
from pathlib import Path

from hanimo_rag.parsers.base import ParsedDocument

logger = logging.getLogger(__name__)

# Encodings to try in order
_ENCODINGS = ["utf-8", "utf-8-sig", "euc-kr", "cp949", "latin-1", "ascii"]


class TextParser:
    """Parse plain text files with encoding auto-detection."""

    def parse(self, path: str) -> ParsedDocument:
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"File not found: {path}")

        text = self._read_with_fallback(p)
        return ParsedDocument(
            text=text,
            metadata={
                "source": str(p),
                "filename": p.name,
                "extension": p.suffix,
                "size_bytes": p.stat().st_size,
            },
        )

    def _read_with_fallback(self, path: Path) -> str:
        """Try multiple encodings to read the file."""
        for encoding in _ENCODINGS:
            try:
                return path.read_text(encoding=encoding)
            except (UnicodeDecodeError, UnicodeError):
                continue

        # Last resort: read as bytes and decode with replacement
        logger.warning("Could not detect encoding for %s; using replacement chars", path)
        raw = path.read_bytes()
        return raw.decode("utf-8", errors="replace")
