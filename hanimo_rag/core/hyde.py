from __future__ import annotations

from hanimo_rag.core.llm import LLMBase

HYDE_PROMPT = """Write a short, factual paragraph (3-5 sentences) that would directly answer the following question. Write as if you are quoting from a reference document. Do not add disclaimers or qualifications.

Question: {query}

Passage:"""


async def hyde_transform(query: str, llm: LLMBase) -> str:
    try:
        result = await llm.generate(HYDE_PROMPT.format(query=query))
        return result.strip() if result.strip() else query
    except Exception:
        return query
