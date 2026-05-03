"""Recursive text chunker."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TextChunk:
    """A chunk of text with position info."""

    text: str
    start: int
    end: int
    index: int


# Separator hierarchy: split by largest units first
_DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", ", ", " ", ""]


def chunk_text(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    separators: list[str] | None = None,
) -> list[TextChunk]:
    """Split text into overlapping chunks using recursive separator hierarchy."""
    if not text.strip():
        return []

    if separators is None:
        separators = _DEFAULT_SEPARATORS

    raw_splits = _recursive_split(text, chunk_size, separators)
    return _merge_with_overlap(raw_splits, chunk_size, chunk_overlap)


def _recursive_split(
    text: str,
    chunk_size: int,
    separators: list[str],
) -> list[str]:
    """Recursively split text using separator hierarchy."""
    if len(text) <= chunk_size:
        return [text] if text.strip() else []

    if not separators:
        # Last resort: hard split by characters
        pieces = []
        for i in range(0, len(text), chunk_size):
            piece = text[i : i + chunk_size]
            if piece.strip():
                pieces.append(piece)
        return pieces

    separator = separators[0]
    remaining_separators = separators[1:]

    if not separator:
        # Empty separator = character-level split
        pieces = []
        for i in range(0, len(text), chunk_size):
            piece = text[i : i + chunk_size]
            if piece.strip():
                pieces.append(piece)
        return pieces

    parts = text.split(separator)
    results: list[str] = []
    current = ""

    for part in parts:
        candidate = f"{current}{separator}{part}" if current else part

        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current.strip():
                results.append(current)
            # If this single part is too big, recursively split it
            if len(part) > chunk_size:
                sub_parts = _recursive_split(part, chunk_size, remaining_separators)
                results.extend(sub_parts)
                current = ""
            else:
                current = part

    if current.strip():
        results.append(current)

    return results


def _merge_with_overlap(
    splits: list[str],
    chunk_size: int,
    overlap: int,
) -> list[TextChunk]:
    """Merge splits into chunks with overlap."""
    if not splits:
        return []

    chunks: list[TextChunk] = []
    position = 0

    for i, text in enumerate(splits):
        # Add overlap from previous chunk
        if i > 0 and overlap > 0:
            prev_text = splits[i - 1]
            overlap_text = prev_text[-overlap:] if len(prev_text) > overlap else prev_text
            text_with_overlap = overlap_text + text
            start = max(0, position - len(overlap_text))
        else:
            text_with_overlap = text
            start = position

        # Trim if too long
        if len(text_with_overlap) > chunk_size:
            text_with_overlap = text_with_overlap[:chunk_size]

        chunks.append(
            TextChunk(
                text=text_with_overlap.strip(),
                start=start,
                end=start + len(text_with_overlap),
                index=i,
            )
        )

        position += len(text)

    # Filter out empty chunks
    return [c for c in chunks if c.text]
