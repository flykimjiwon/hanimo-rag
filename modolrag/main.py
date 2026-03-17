"""FastAPI application for ModolRAG."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from modolrag.api.middleware import setup_middleware
from modolrag.api import ingest, search, graph, admin, collections, generate, apps

tags_metadata = [
    {
        "name": "documents",
        "description": "Document ingestion and management. Upload files, track processing status, and manage your document library.",
    },
    {
        "name": "search",
        "description": "Hybrid search across your documents. Combines vector similarity, full-text keyword matching, and knowledge graph traversal with RRF fusion.",
    },
    {
        "name": "graph",
        "description": "Knowledge graph visualization and exploration. Browse entities, relationships, and graph structure extracted from your documents.",
    },
    {
        "name": "admin",
        "description": "System administration. Health checks, configuration management, and runtime settings.",
    },
    {
        "name": "collections",
        "description": "Document collections. Group documents into searchable sets — search specific collections instead of all documents.",
    },
    {
        "name": "generate",
        "description": "RAG generation. Retrieve context from documents and generate answers with an LLM. Supports streaming via SSE.",
    },
    {
        "name": "apps",
        "description": "App Builder. Create custom LLM endpoints by selecting documents, configuring prompts, and generating dedicated chat APIs.",
    },
]

app = FastAPI(
    title="ModolRAG",
    summary="PostgreSQL-native Hybrid RAG Engine",
    description="""
ModolRAG is a lightweight RAG engine that runs entirely on PostgreSQL.

## Features
- **Hybrid Search**: Vector (pgvector) + Full-Text (tsvector) + Knowledge Graph (CTE) → RRF Fusion
- **6 Document Parsers**: PDF, DOCX, XLSX, PPTX, Markdown, Plain Text
- **Embedding Providers**: Ollama (local) + OpenAI (API)
- **Knowledge Graph**: Automatic entity/relationship extraction with 2-hop traversal

## Authentication
All endpoints (except `/health`) require an `X-API-Key` header.  
If no API keys are configured (`MODOLRAG_API_KEYS` is empty), all requests are allowed.

## Dashboard
A React SPA dashboard is available at [`/dashboard`](/dashboard) for visual document management, search testing, and graph exploration.
""",
    version="0.1.0",
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Setup middleware (CORS, etc.)
setup_middleware(app)

# Register routers
app.include_router(admin.router)
app.include_router(ingest.router)
app.include_router(search.router)
app.include_router(graph.router)
app.include_router(collections.router)
app.include_router(generate.router)
app.include_router(apps.router)

# Mount dashboard static files if they exist
static_dir = Path(__file__).parent / "static"
if static_dir.exists() and any(static_dir.iterdir()):
    app.mount("/dashboard", StaticFiles(directory=str(static_dir), html=True), name="dashboard")
