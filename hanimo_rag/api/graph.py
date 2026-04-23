"""Graph data endpoints."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from hanimo_rag.api.auth import require_api_key

router = APIRouter(prefix="/api", tags=["graph"])


@router.get("/graph", summary="Get knowledge graph")
async def get_graph(
    namespace: str = Query("default", description="Graph namespace to query"),
    _: str = Depends(require_api_key),
):
    """Get all graph nodes and edges for visualization.
    
    Returns the complete knowledge graph structure. Use with a graph visualization library
    like react-force-graph or d3-force.
    
    **Node types:** person, org, concept, location, event, document  
    **Edge properties:** relation_type, weight (higher = stronger relationship)
    """
    from hanimo_rag.core.graph_store import get_graph_data
    data = await get_graph_data(namespace=namespace)
    return data


@router.get("/graph/node/{node_id}", summary="Get node details")
async def get_node(
    node_id: str,
    namespace: str = Query("default", description="Graph namespace"),
    _: str = Depends(require_api_key),
):
    """Get a single node with its properties and all connected neighbors (1-hop)."""
    from hanimo_rag.core.graph_store import get_neighbors
    from hanimo_rag.db import fetchrow

    node = await fetchrow("SELECT * FROM hanimo_rag_graph_nodes WHERE id = $1::uuid", node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    neighbors = await get_neighbors(node_id=node_id, namespace=namespace)
    return {"node": dict(node), "neighbors": neighbors}
