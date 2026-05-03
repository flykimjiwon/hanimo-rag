"""HanimoRAG CLI."""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="hanimo_rag",
        description="HanimoRAG v2 — Agentic LiteRAG engine",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")

    subparsers = parser.add_subparsers(dest="command")

    # ── index ──
    idx = subparsers.add_parser("index", help="Index files or directories")
    idx.add_argument("path", help="File or directory to index")
    idx.add_argument("--model", default="qwen2.5:7b", help="LLM model (default: qwen2.5:7b)")
    idx.add_argument("--store", default="./hanimo_rag_data", help="Store path (default: ./hanimo_rag_data)")
    idx.add_argument("--store-type", default="json", choices=["json", "sqlite"], help="Store type")
    idx.add_argument("--chunk-size", type=int, default=512, help="Chunk size in chars")
    idx.add_argument("--chunk-overlap", type=int, default=50, help="Chunk overlap in chars")

    # ── search ──
    srch = subparsers.add_parser("search", help="Search indexed documents")
    srch.add_argument("query", help="Search query")
    srch.add_argument("--model", default="qwen2.5:7b", help="LLM model")
    srch.add_argument("--store", default="./hanimo_rag_data", help="Store path")
    srch.add_argument("--store-type", default="json", choices=["json", "sqlite"], help="Store type")
    srch.add_argument("--top-k", type=int, default=5, help="Number of results")
    srch.add_argument("--max-rounds", type=int, default=3, help="Max search rounds")

    # ── ask ──
    ask = subparsers.add_parser("ask", help="Ask a question (search + generate)")
    ask.add_argument("question", help="Question to ask")
    ask.add_argument("--model", default="qwen2.5:7b", help="LLM model")
    ask.add_argument("--store", default="./hanimo_rag_data", help="Store path")
    ask.add_argument("--store-type", default="json", choices=["json", "sqlite"], help="Store type")
    ask.add_argument("--top-k", type=int, default=5, help="Number of context chunks")

    # ── status ──
    stat = subparsers.add_parser("status", help="Show index statistics")
    stat.add_argument("--store", default="./hanimo_rag_data", help="Store path")
    stat.add_argument("--store-type", default="json", choices=["json", "sqlite"], help="Store type")

    # ── serve ──
    srv = subparsers.add_parser("serve", help="Start API server (requires [server] extra)")
    srv.add_argument("--model", default="qwen2.5:7b", help="LLM model")
    srv.add_argument("--store", default="./hanimo_rag_data", help="Store path")
    srv.add_argument("--store-type", default="json", choices=["json", "sqlite"], help="Store type")
    srv.add_argument("--host", default="0.0.0.0", help="Server host")
    srv.add_argument("--port", type=int, default=8000, help="Server port")

    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG, format="%(name)s %(levelname)s: %(message)s")
    else:
        logging.basicConfig(level=logging.INFO, format="%(message)s")

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "status":
        _cmd_status(args)
    elif args.command == "index":
        _cmd_index(args)
    elif args.command == "search":
        _cmd_search(args)
    elif args.command == "ask":
        _cmd_ask(args)
    elif args.command == "serve":
        _cmd_serve(args)


def _cmd_status(args: argparse.Namespace) -> None:
    from hanimo_rag.config import Config
    from hanimo_rag.store import create_store

    config = Config(store_path=args.store, store_type=args.store_type)
    store = create_store(config)
    stats = store.get_stats()
    print(json.dumps(stats, indent=2))


def _cmd_index(args: argparse.Namespace) -> None:
    from hanimo_rag import HanimoRAG

    rag = HanimoRAG(model=args.model, store_path=args.store, store_type=args.store_type)
    result = asyncio.run(rag.index(args.path, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap))
    print(f"Indexed {result['indexed']} file(s):")
    for f in result["files"]:
        status = f.get("status", "unknown")
        chunks = f.get("chunks", 0)
        source = f.get("source", "?")
        print(f"  {source}: {chunks} chunks ({status})")


def _cmd_search(args: argparse.Namespace) -> None:
    from hanimo_rag import HanimoRAG

    rag = HanimoRAG(model=args.model, store_path=args.store, store_type=args.store_type)
    results = asyncio.run(rag.search(args.query, top_k=args.top_k, max_rounds=args.max_rounds))

    if not results:
        print("No results found.")
        return

    for i, r in enumerate(results, 1):
        print(f"\n{'='*60}")
        print(f"Result {i} [{r.get('category', '?')}] from {r.get('source', '?')}")
        print(f"Summary: {r.get('summary', 'N/A')}")
        print(f"{'-'*60}")
        content = r.get("content", "")
        print(content[:500] + ("..." if len(content) > 500 else ""))


def _cmd_ask(args: argparse.Namespace) -> None:
    from hanimo_rag import HanimoRAG

    rag = HanimoRAG(model=args.model, store_path=args.store, store_type=args.store_type)
    answer = asyncio.run(rag.ask(args.question, top_k=args.top_k))
    print(answer)


def _cmd_serve(args: argparse.Namespace) -> None:
    try:
        from hanimo_rag.server import create_app
    except ImportError:
        print("Server requires FastAPI and uvicorn. Install with:")
        print("  pip install hanimo_rag[server]")
        sys.exit(1)

    import uvicorn

    app = create_app(model=args.model, store_path=args.store, store_type=args.store_type)
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
