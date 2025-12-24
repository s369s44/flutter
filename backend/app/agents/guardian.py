from datetime import datetime, timezone
from typing import List, Dict, Any

class GuardianAgent:
    """Represents a Guardian agent that holds a share of the private key"""
    
    GUARDIAN_NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta"]
    GUARDIAN_REGIONS = ["North", "South", "East", "West", "Central", "Pacific", "Atlantic"]
    
    def __init__(self, index: int):
        self.id = f"guardian-{self.GUARDIAN_NAMES[index].lower()}"
        self.name = f"Guardian-{self.GUARDIAN_NAMES[index]}"
        self.region = self.GUARDIAN_REGIONS[index]
        self.status = "READY"
        self.share = None
        self.share_index = index + 1
        self.last_heartbeat = datetime.now(timezone.utc)
        self.memory: List[Dict[str, Any]] = []  # Agent's memory storage
        self.memory_capacity = 1000  # Max memories
    
    def store_share(self, share_data: bytes):
        """Store encrypted share"""
        self.share = share_data
        self.status = "HOLDING_SHARE"
        self.add_memory("share_stored", f"Stored encrypted share for key reconstruction")
        return True
    
    def release_share(self):
        """Release share for reconstruction"""
        if self.share:
            share = self.share
            self.add_memory("share_released", f"Released share for key reconstruction")
            return share
        return None
    
    def destroy_share(self):
        """Destroy the share (auto-destruct)"""
        self.share = None
        self.status = "READY"
        self.add_memory("share_destroyed", f"Share auto-destructed after 8 seconds")
    
    def add_memory(self, event_type: str, description: str, metadata: Dict = None):
        """Add a memory entry to this guardian"""
        memory_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "description": description,
            "metadata": metadata or {},
            "guardian": self.name
        }
        self.memory.append(memory_entry)
        
        # Keep only last N memories
        if len(self.memory) > self.memory_capacity:
            self.memory = self.memory[-self.memory_capacity:]
        
        return memory_entry
    
    def get_memories(self, limit: int = 50) -> List[Dict]:
        """Retrieve recent memories"""
        return self.memory[-limit:]
    
    def clear_memories(self):
        """Clear all memories"""
        self.memory = []
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "region": self.region,
            "status": self.status,
            "has_share": self.share is not None,
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "memory_count": len(self.memory)
        }
