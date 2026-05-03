"""Storage backends for HanimoRAG."""
from __future__ import annotations

from hanimo_rag.config import Config
from hanimo_rag.store.base import StoreBase


def create_store(config: Config) -> StoreBase:
    """Factory: create a store from config."""
    store_type = config.store_type.lower()

    if store_type == "json":
        from hanimo_rag.store.json_store import JsonStore
        return JsonStore(config.store_path)
    elif store_type == "sqlite":
        from hanimo_rag.store.sqlite_store import SqliteStore
        return SqliteStore(config.store_path)
    else:
        raise ValueError(f"Unknown store type: {store_type!r}. Use 'json' or 'sqlite'.")
