from datetime import datetime, timezone

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
    
    def store_share(self, share_data: bytes):
        """Store encrypted share"""
        self.share = share_data
        self.status = "HOLDING_SHARE"
        return True
    
    def release_share(self):
        """Release share for reconstruction"""
        if self.share:
            share = self.share
            return share
        return None
    
    def destroy_share(self):
        """Destroy the share (auto-destruct)"""
        self.share = None
        self.status = "READY"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "region": self.region,
            "status": self.status,
            "has_share": self.share is not None,
            "last_heartbeat": self.last_heartbeat.isoformat()
        }
