from fastapi import APIRouter, HTTPException
from typing import Optional, List
from ..agents.coordinator import coordinator
from pydantic import BaseModel

router = APIRouter(prefix="/memory", tags=["memory"])

class MemoryEntry(BaseModel):
    category: str
    event: str
    metadata: dict = {}

@router.get("/ultra")
async def get_ultra_memory(category: Optional[str] = None, limit: int = 100):
    """Get ultra memory - central store of all important system events"""
    memories = coordinator.get_ultra_memory(category=category, limit=limit)
    
    return {
        "total": len(coordinator.ultra_memory),
        "returned": len(memories),
        "category": category,
        "memories": memories
    }

@router.post("/ultra")
async def add_ultra_memory(entry: MemoryEntry):
    """Add entry to ultra memory"""
    memory = coordinator.add_ultra_memory(
        category=entry.category,
        event=entry.event,
        metadata=entry.metadata
    )
    return {"status": "success", "memory": memory}

@router.get("/coordinator")
async def get_coordinator_memory(limit: int = 100):
    """Get coordinator's personal memory"""
    memories = coordinator.get_memories(limit=limit)
    
    return {
        "agent": "Coordinator",
        "total_memories": len(coordinator.memory),
        "returned": len(memories),
        "memories": memories
    }

@router.get("/guardian/{guardian_name}")
async def get_guardian_memory(guardian_name: str, limit: int = 50):
    """Get a specific guardian's memory"""
    # Find guardian by name
    guardian = None
    for g in coordinator.guardians:
        if g.name.lower() == f"guardian-{guardian_name.lower()}" or guardian_name.lower() in g.name.lower():
            guardian = g
            break
    
    if not guardian:
        raise HTTPException(status_code=404, detail=f"Guardian {guardian_name} not found")
    
    memories = guardian.get_memories(limit=limit)
    
    return {
        "agent": guardian.name,
        "region": guardian.region,
        "status": guardian.status,
        "total_memories": len(guardian.memory),
        "returned": len(memories),
        "memories": memories
    }

@router.get("/all-agents")
async def get_all_agents_memory():
    """Get memories from all agents (coordinator + all guardians)"""
    all_memories = coordinator.get_all_agent_memories()
    
    return {
        "coordinator_memories": len(all_memories["coordinator"]),
        "guardians_count": len(all_memories["guardians"]),
        "data": all_memories
    }

@router.get("/stats")
async def get_memory_stats():
    """Get memory statistics across all agents"""
    stats = {
        "ultra_memory": {
            "total": len(coordinator.ultra_memory),
            "capacity": "unlimited",
            "categories": {}
        },
        "coordinator": {
            "total": len(coordinator.memory),
            "capacity": coordinator.memory_capacity
        },
        "guardians": []
    }
    
    # Count categories in ultra memory
    for memory in coordinator.ultra_memory:
        category = memory.get("category", "unknown")
        stats["ultra_memory"]["categories"][category] = stats["ultra_memory"]["categories"].get(category, 0) + 1
    
    # Guardian stats
    for guardian in coordinator.guardians:
        stats["guardians"].append({
            "name": guardian.name,
            "region": guardian.region,
            "memory_count": len(guardian.memory),
            "capacity": guardian.memory_capacity
        })
    
    return stats

@router.delete("/clear/{agent_name}")
async def clear_agent_memory(agent_name: str):
    """Clear memory for a specific agent (use with caution)"""
    if agent_name.lower() == "coordinator":
        coordinator.memory = []
        return {"status": "success", "message": "Coordinator memory cleared"}
    
    # Find and clear guardian memory
    for guardian in coordinator.guardians:
        if agent_name.lower() in guardian.name.lower():
            guardian.clear_memories()
            return {"status": "success", "message": f"{guardian.name} memory cleared"}
    
    raise HTTPException(status_code=404, detail=f"Agent {agent_name} not found")

@router.get("/search")
async def search_memory(query: str, agent: Optional[str] = None, limit: int = 50):
    """Search through memories"""
    results = []
    
    if agent is None or agent.lower() == "all":
        # Search all memories
        all_memories = coordinator.get_all_agent_memories()
        
        # Search coordinator
        for mem in all_memories["coordinator"]:
            if query.lower() in str(mem).lower():
                results.append({"agent": "Coordinator", "memory": mem})
        
        # Search guardians
        for guardian_name, memories in all_memories["guardians"].items():
            for mem in memories:
                if query.lower() in str(mem).lower():
                    results.append({"agent": guardian_name, "memory": mem})
    
    return {
        "query": query,
        "results_count": len(results),
        "results": results[:limit]
    }
