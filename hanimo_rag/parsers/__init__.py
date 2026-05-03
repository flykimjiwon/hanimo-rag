"""File parsers for HanimoRAG."""
from __future__ import annotations

from pathlib import Path

from hanimo_rag.parsers.base import ParsedDocument

_EXTENSION_MAP: dict[str, str] = {
    ".txt": "text",
    ".log": "text",
    ".csv": "text",
    ".tsv": "text",
    ".json": "text",
    ".xml": "text",
    ".html": "text",
    ".htm": "text",
    ".md": "markdown",
    ".markdown": "markdown",
    ".mdx": "markdown",
    ".pdf": "pdf",
    ".py": "text",
    ".js": "text",
    ".ts": "text",
    ".jsx": "text",
    ".tsx": "text",
    ".java": "text",
    ".go": "text",
    ".rs": "text",
    ".c": "text",
    ".cpp": "text",
    ".h": "text",
    ".hpp": "text",
    ".rb": "text",
    ".php": "text",
    ".sh": "text",
    ".yaml": "text",
    ".yml": "text",
    ".toml": "text",
    ".ini": "text",
    ".cfg": "text",
    ".env": "text",
    ".sql": "text",
    ".r": "text",
    ".swift": "text",
    ".kt": "text",
    ".scala": "text",
}


def parse_file(path: str) -> ParsedDocument:
    """Parse a file by auto-detecting its type from extension."""
    p = Path(path)
    ext = p.suffix.lower()
    parser_type = _EXTENSION_MAP.get(ext, "text")

    if parser_type == "text":
        from hanimo_rag.parsers.text import TextParser
        return TextParser().parse(path)
    elif parser_type == "markdown":
        from hanimo_rag.parsers.markdown import MarkdownParser
        return MarkdownParser().parse(path)
    elif parser_type == "pdf":
        from hanimo_rag.parsers.pdf import PdfParser
        return PdfParser().parse(path)
    else:
        from hanimo_rag.parsers.text import TextParser
        return TextParser().parse(path)
