"""Database module for hanimo_rag.

Provides asyncpg connection pool management and schema initialization.
"""

from hanimo_rag.db.connection import (
    get_pool,
    close_pool,
    init_schema,
    execute,
    fetch,
    fetchrow,
    fetchval,
)

__all__ = [
    "get_pool",
    "close_pool",
    "init_schema",
    "execute",
    "fetch",
    "fetchrow",
    "fetchval",
]
