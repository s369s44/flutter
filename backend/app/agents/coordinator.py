from .guardian import GuardianAgent

class CoordinatorAgent:
    """Main brain that orchestrates the entire BioPass Swarm"""
    
    def __init__(self):
        self.id = "coordinator-main"
        self.name = "Coordinator"
        self.status = "READY"
        self.guardians = [GuardianAgent(i) for i in range(7)]
        self.threshold = 5  # 5-of-7 threshold
        self.key_lifetime = 8  # Key destroyed after 8 seconds
    
    def get_all_guardians_status(self):
        return [g.to_dict() for g in self.guardians]
    
    def distribute_shares(self, shares: list):
        """Distribute shares to guardians"""
        for i, share in enumerate(shares):
            self.guardians[i].store_share(share)
        self.status = "SHARES_DISTRIBUTED"
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
        return collected if len(collected) >= min_shares else None
    
    def destroy_all_shares(self):
        """Destroy all shares across guardians"""
        for guardian in self.guardians:
            guardian.destroy_share()
        self.status = "READY"

coordinator = CoordinatorAgent()
