#!/usr/bin/env python3
"""
BioPass Swarm v2.0 Backend API Testing Suite
Tests Multi-Agent Guardian architecture and biometric features
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class BioPassSwarmTester:
    def __init__(self, base_url: str = "https://swarm-auth.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def test_api_root(self) -> bool:
        """Test API root endpoint - should show v2.0 Multi-Agent Architecture"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["message", "status", "guardians", "threshold", "encryption"]
                has_keys = all(key in data for key in expected_keys)
                success = (has_keys and 
                          "Multi-Agent Architecture" in data.get("message", "") and
                          data.get("guardians") == 7 and
                          data.get("threshold") == "5-of-7")
                
            self.log_test(
                "API Root Endpoint (v2.0)", 
                success,
                f"Status: {response.status_code}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("API Root Endpoint (v2.0)", False, f"Error: {str(e)}")
            return False

    def test_guardians_status(self) -> bool:
        """Test guardians status endpoint - should return 7 guardians + coordinator"""
        try:
            response = requests.get(f"{self.base_url}/guardians/status", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["coordinator", "guardians", "system_ready"]
                has_keys = all(key in data for key in required_keys)
                
                if has_keys:
                    # Check coordinator
                    coordinator = data.get("coordinator", {})
                    coord_valid = (coordinator.get("name") == "Coordinator" and
                                 coordinator.get("threshold") == "5-of-7")
                    
                    # Check guardians
                    guardians = data.get("guardians", [])
                    guardians_valid = len(guardians) == 7
                    
                    if guardians_valid:
                        # Check guardian names and regions
                        expected_names = ["Guardian-Alpha", "Guardian-Beta", "Guardian-Gamma", 
                                        "Guardian-Delta", "Guardian-Epsilon", "Guardian-Zeta", "Guardian-Eta"]
                        expected_regions = ["North", "South", "East", "West", "Central", "Pacific", "Atlantic"]
                        
                        actual_names = [g.get("name") for g in guardians]
                        actual_regions = [g.get("region") for g in guardians]
                        
                        names_match = set(actual_names) == set(expected_names)
                        regions_match = set(actual_regions) == set(expected_regions)
                        
                        guardians_valid = names_match and regions_match
                    
                    success = coord_valid and guardians_valid
                else:
                    success = False
                
            self.log_test(
                "Guardians Status (7 Guardians + Coordinator)",
                success,
                f"Status: {response.status_code}, Guardians: {len(data.get('guardians', []))}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Guardians Status", False, f"Error: {str(e)}")
            return False
    def test_session_create(self) -> bool:
        """Test session creation"""
        try:
            payload = {
                "device_type": "web",
                "region": "USA",
                "language": "English"
            }
            
            response = requests.post(
                f"{self.base_url}/session/create",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["session_id", "device_type", "guardians_ready", "threshold", "encryption"]
                has_keys = all(key in data for key in required_keys)
                
                if has_keys:
                    self.session_id = data["session_id"]
                    success = (data["guardians_ready"] == 7 and
                             data["threshold"] == "5-of-7" and
                             "CRYSTALS-Kyber-1024" in data["encryption"])
                else:
                    success = False
                    
            self.log_test(
                "Session Creation",
                success,
                f"Status: {response.status_code}, Session ID: {self.session_id}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Session Creation", False, f"Error: {str(e)}")
            return False

    def test_apps_list(self) -> bool:
        """Test apps list endpoint"""
        try:
            response = requests.get(f"{self.base_url}/apps/list", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["apps", "categories"]
                has_keys = all(key in data for key in required_keys)
                
                if has_keys:
                    apps = data.get("apps", [])
                    categories = data.get("categories", [])
                    
                    # Check if we have apps and categories
                    success = (len(apps) > 0 and len(categories) > 0)
                    
                    if success:
                        # Check app structure
                        first_app = apps[0] if apps else {}
                        app_keys = ["app_id", "app_name", "category", "icon"]
                        success = all(key in first_app for key in app_keys)
                else:
                    success = False
                
            self.log_test(
                "Apps List",
                success,
                f"Status: {response.status_code}, Apps: {len(data.get('apps', []))}, Categories: {len(data.get('categories', []))}",
                {"apps_count": len(data.get("apps", [])), "categories": data.get("categories", [])} if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Apps List", False, f"Error: {str(e)}")
            return False
        """Test getting session details"""
        if not self.session_id:
            self.log_test("Get Session", False, "No session ID available")
            return False
            
        try:
            response = requests.get(
                f"{self.base_url}/session/{self.session_id}",
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["id", "device_type", "region", "webauthn_status", "camera_status"]
                success = all(key in data for key in required_keys)
                
            self.log_test(
                "Get Session",
                success,
                f"Status: {response.status_code}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Get Session", False, f"Error: {str(e)}")
            return False

    def test_permissions_update(self) -> bool:
        """Test updating session permissions"""
        if not self.session_id:
            self.log_test("Update Permissions", False, "No session ID available")
            return False
            
        try:
            payload = {
                "webauthn_status": True,
                "camera_status": True
            }
            
            response = requests.patch(
                f"{self.base_url}/session/{self.session_id}/permissions",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("status") == "updated" and "permissions" in data
                
            self.log_test(
                "Update Permissions",
                success,
                f"Status: {response.status_code}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Update Permissions", False, f"Error: {str(e)}")
            return False

    def test_step_update(self) -> bool:
        """Test updating enrollment step"""
        if not self.session_id:
            self.log_test("Update Step", False, "No session ID available")
            return False
            
        try:
            payload = {
                "step": 1,
                "status": "completed",
                "data": {"test": "webauthn_completed"}
            }
            
            response = requests.post(
                f"{self.base_url}/session/{self.session_id}/step",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("status") == "updated" and data.get("step") == 1
                
            self.log_test(
                "Update Step",
                success,
                f"Status: {response.status_code}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Update Step", False, f"Error: {str(e)}")
            return False

    def test_quantum_challenge(self) -> bool:
        """Test quantum-resistant challenge generation"""
        try:
            payload = {
                "challenge_type": "biometric_enrollment",
                "difficulty_level": "high"
            }
            
            response = requests.post(
                f"{self.base_url}/quantum-challenge",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["challenge", "public_key", "signature", "algorithm"]
                success = all(key in data for key in required_keys)
                
                if success:
                    success = "CRYSTALS-Dilithium-5" in data.get("algorithm", "")
                    
            self.log_test(
                "Quantum Challenge",
                success,
                f"Status: {response.status_code}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Quantum Challenge", False, f"Error: {str(e)}")
            return False

    def test_chat_endpoint(self) -> bool:
        """Test chat with Claude Sonnet 4.5"""
        try:
            payload = {
                "message": "What is BioPass Swarm?",
                "session_id": self.session_id or "test_session"
            }
            
            response = requests.post(
                f"{self.base_url}/chat",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["response", "session_id"]
                success = all(key in data for key in required_keys)
                
                if success:
                    # Check if response contains relevant content
                    response_text = data.get("response", "").lower()
                    success = len(response_text) > 10 and any(
                        keyword in response_text 
                        for keyword in ["biopass", "biometric", "authentication", "security"]
                    )
                    
            self.log_test(
                "Chat Endpoint (Claude)",
                success,
                f"Status: {response.status_code}",
                {"response_length": len(data.get("response", "")) if success else 0}
            )
            return success
            
        except Exception as e:
            self.log_test("Chat Endpoint (Claude)", False, f"Error: {str(e)}")
            return False

    def test_recovery_email(self) -> bool:
        """Test recovery email setting"""
        if not self.session_id:
            self.log_test("Recovery Email", False, "No session ID available")
            return False
            
        try:
            payload = {
                "session_id": self.session_id,
                "email": "test@biopass.com"
            }
            
            response = requests.post(
                f"{self.base_url}/recovery-email",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = data.get("status") == "saved" and data.get("email") == "test@biopass.com"
                
            self.log_test(
                "Recovery Email",
                success,
                f"Status: {response.status_code}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Recovery Email", False, f"Error: {str(e)}")
            return False

    def test_external_status(self) -> bool:
        """Test external BioPass API status"""
        try:
            response = requests.get(
                f"{self.base_url}/external/status",
                timeout=15
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Accept both connected and unavailable as valid responses
                success = "status" in data and data["status"] in ["connected", "unavailable"]
                
            self.log_test(
                "External API Status",
                success,
                f"Status: {response.status_code}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("External API Status", False, f"Error: {str(e)}")
            return False

    def test_external_privacy_policy(self) -> bool:
        """Test external privacy policy endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/external/privacy-policy",
                timeout=15
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "policy" in data and len(data["policy"]) > 10
                
            self.log_test(
                "External Privacy Policy",
                success,
                f"Status: {response.status_code}",
                {"policy_length": len(data.get("policy", "")) if success else 0}
            )
            return success
            
        except Exception as e:
            self.log_test("External Privacy Policy", False, f"Error: {str(e)}")
            return False

    def test_external_usage_guide(self) -> bool:
        """Test external usage guide endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/external/usage-guide",
                timeout=15
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "guide" in data and len(data["guide"]) > 10
                
            self.log_test(
                "External Usage Guide",
                success,
                f"Status: {response.status_code}",
                {"guide_length": len(data.get("guide", "")) if success else 0}
            )
            return success
            
        except Exception as e:
            self.log_test("External Usage Guide", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests"""
        print("🚀 Starting BioPass Swarm Backend API Tests")
        print(f"📡 Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Core API tests
        self.test_api_root()
        self.test_session_create()
        self.test_session_get()
        self.test_permissions_update()
        self.test_step_update()
        self.test_quantum_challenge()
        self.test_chat_endpoint()
        self.test_recovery_email()
        
        # External API tests
        self.test_external_status()
        self.test_external_privacy_policy()
        self.test_external_usage_guide()
        
        # Summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
        else:
            print("⚠️  Some tests failed. Check details above.")
            
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": success_rate,
            "test_results": self.test_results,
            "session_id": self.session_id
        }

def main():
    """Main test execution"""
    tester = BioPassAPITester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open("/app/test_reports/backend_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    # Return appropriate exit code
    return 0 if results["passed_tests"] == results["total_tests"] else 1

if __name__ == "__main__":
    sys.exit(main())