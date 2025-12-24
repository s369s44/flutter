from .guardian import GuardianAgent
from datetime import datetime, timezone
from typing import List, Dict, Any

class CoordinatorAgent:
    """Main brain that orchestrates the entire BioPass Swarm"""
    
    def __init__(self):
        self.id = "coordinator-main"
        self.name = "Coordinator"
        self.status = "READY"
        self.guardians = [GuardianAgent(i) for i in range(7)]
        self.threshold = 5  # 5-of-7 threshold
        self.key_lifetime = 8  # Key destroyed after 8 seconds
        self.memory: List[Dict[str, Any]] = []  # Coordinator's memory
        self.ultra_memory: List[Dict[str, Any]] = []  # Central ultra memory store
        self.memory_capacity = 5000  # Higher capacity for main coordinator
    
    def get_all_guardians_status(self):
        return [g.to_dict() for g in self.guardians]
    
    def distribute_shares(self, shares: list):
        """Distribute shares to guardians"""
        for i, share in enumerate(shares):
            self.guardians[i].store_share(share)
        self.status = "SHARES_DISTRIBUTED"
        self.add_memory("shares_distributed", f"Distributed {len(shares)} shares to guardians")
        self.add_ultra_memory("system", "Key shares distributed across 7 guardians", 
                             {"shares_count": len(shares), "threshold": self.threshold})
        return True
    
    def collect_shares(self, min_shares: int = 5):
        """Collect minimum required shares for reconstruction"""
        collected = []
        for guardian in self.guardians:
            share = guardian.release_share()
            if share:
                collected.append((guardian.share_index, share))
            if len(collected) >= min_shares:
                break
        
        if len(collected) >= min_shares:
            self.add_memory("shares_collected", f"Collected {len(collected)} shares for reconstruction")
            self.add_ultra_memory("security", f"Key reconstruction: {len(collected)} shares collected", 
                                 {"collected": len(collected), "required": min_shares})
        
        return collected if len(collected) >= min_shares else None
    
    def destroy_all_shares(self):
        """Destroy all shares across guardians"""
        for guardian in self.guardians:
            guardian.destroy_share()
        self.status = "READY"
        self.add_memory("shares_destroyed", "All guardian shares auto-destructed")
        self.add_ultra_memory("security", "Auto-destruct completed: All shares destroyed", 
                             {"lifetime_seconds": self.key_lifetime})
    
    def add_memory(self, event_type: str, description: str, metadata: Dict = None):
        """Add memory to coordinator"""
        memory_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "description": description,
            "metadata": metadata or {},
            "agent": "Coordinator"
        }
        self.memory.append(memory_entry)
        
        if len(self.memory) > self.memory_capacity:
            self.memory = self.memory[-self.memory_capacity:]
        
        return memory_entry
    
    def add_ultra_memory(self, category: str, event: str, metadata: Dict = None):
        """Add to central ultra memory store - most important system events"""
        ultra_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "category": category,  # system, security, biometric, access, vault
            "event": event,
            "metadata": metadata or {},
            "importance": "high"
        }
        self.ultra_memory.append(ultra_entry)
        
        # Ultra memory has no limit - stores everything important
        return ultra_entry
    
    def get_memories(self, limit: int = 100) -> List[Dict]:
        """Get coordinator memories"""
        return self.memory[-limit:]
    
    def get_ultra_memory(self, category: str = None, limit: int = 100) -> List[Dict]:
        """Get ultra memory entries, optionally filtered by category"""
        if category:
            filtered = [m for m in self.ultra_memory if m['category'] == category]
            return filtered[-limit:]
        return self.ultra_memory[-limit:]
    
    def get_all_agent_memories(self) -> Dict[str, List[Dict]]:
        """Get memories from all agents including coordinator"""
        all_memories = {
            "coordinator": self.get_memories(50),
            "guardians": {}
        }
        
        for guardian in self.guardians:
            all_memories["guardians"][guardian.name] = guardian.get_memories(30)
        
        return all_memories

coordinator = CoordinatorAgent()
