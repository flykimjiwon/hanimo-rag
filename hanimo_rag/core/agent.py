"""Agentic search loop — multi-round retrieval with LLM routing."""
from __future__ import annotations

import logging

from hanimo_rag.core.judge import Judge
from hanimo_rag.core.router import Router
from hanimo_rag.llm.base import LLMBase
from hanimo_rag.store.base import StoreBase

logger = logging.getLogger(__name__)


class AgenticSearch:
    """Multi-round search: parse query -> lookup -> judge -> expand -> repeat."""

    def __init__(self, llm: LLMBase, store: StoreBase) -> None:
        self.router = Router(llm)
        self.judge = Judge(llm)
        self.store = store

    async def search(
        self,
        query: str,
        top_k: int = 5,
        max_rounds: int = 3,
    ) -> list[dict]:
        """Run agentic search loop.

        Returns list of dicts with keys: id, source, content, summary, category.
        """
        parsed = await self.router.parse_query(query)
        all_relevant: list[dict] = []
        seen_ids: set[str] = set()
        used_keys: set[str] = set()

        for round_num in range(max_rounds):
            current_keys = parsed["keys"]
            if not current_keys:
                logger.info("No more keys to search (round %d)", round_num + 1)
                break

            logger.info(
                "Search round %d/%d — keys: %s",
                round_num + 1,
                max_rounds,
                current_keys,
            )

            # Lookup candidates from store
            category = parsed.get("category")
            if category == "any":
                category = None

            candidates = self.store.lookup(
                keys=current_keys,
                category=category,
                limit=20,
            )

            # Filter out already-seen chunks
            new_candidates = [c for c in candidates if c.id not in seen_ids]

            if not new_candidates:
                logger.info("No new candidates found in round %d", round_num + 1)
            else:
                # LLM judges relevance
                relevant_chunks = await self.judge.filter(query, new_candidates)

                for chunk in relevant_chunks:
                    if chunk.id not in seen_ids:
                        seen_ids.add(chunk.id)
                        all_relevant.append({
                            "id": chunk.id,
                            "source": chunk.source,
                            "content": chunk.content,
                            "summary": chunk.summary,
                            "category": chunk.category,
                        })

                logger.info(
                    "Round %d: %d candidates -> %d relevant (total: %d)",
                    round_num + 1,
                    len(new_candidates),
                    len(relevant_chunks),
                    len(all_relevant),
                )

            # Check if we have enough
            if len(all_relevant) >= top_k:
                break

            # Expand keys for next round
            used_keys.update(current_keys)
            new_keys = await self.router.expand_keys(query, list(used_keys))
            parsed["keys"] = [k for k in new_keys if k not in used_keys]

            if not parsed["keys"]:
                logger.info("No new expanded keys available")
                break

        return all_relevant[:top_k]
