"""PDF parser (optional dependency)."""
from __future__ import annotations

import logging
from pathlib import Path

from hanimo_rag.parsers.base import ParsedDocument

logger = logging.getLogger(__name__)


class PdfParser:
    """Parse PDF files. Requires pypdf or pdfplumber (install with `pip install hanimo_rag[pdf]`)."""

    def parse(self, path: str) -> ParsedDocument:
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"File not found: {path}")

        # Try pdfplumber first (better table extraction)
        try:
            return self._parse_pdfplumber(p)
        except ImportError:
            pass

        # Fall back to pypdf
        try:
            return self._parse_pypdf(p)
        except ImportError:
            raise ImportError(
                "PDF parsing requires pypdf or pdfplumber. "
                "Install with: pip install hanimo_rag[pdf]"
            )

    def _parse_pdfplumber(self, path: Path) -> ParsedDocument:
        import pdfplumber

        pages: list[str] = []
        with pdfplumber.open(str(path)) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                if text.strip():
                    pages.append(text)

        full_text = "\n\n".join(pages)
        return ParsedDocument(
            text=full_text,
            metadata={
                "source": str(path),
                "filename": path.name,
                "page_count": len(pages),
                "parser": "pdfplumber",
            },
            pages=pages,
        )

    def _parse_pypdf(self, path: Path) -> ParsedDocument:
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        pages: list[str] = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                pages.append(text)

        full_text = "\n\n".join(pages)
        return ParsedDocument(
            text=full_text,
            metadata={
                "source": str(path),
                "filename": path.name,
                "page_count": len(pages),
                "parser": "pypdf",
            },
            pages=pages,
        )
