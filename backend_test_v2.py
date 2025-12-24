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

    def test_biometric_steps(self) -> bool:
        """Test all 3 biometric steps"""
        if not self.session_id:
            self.log_test("Biometric Steps", False, "No session ID available")
            return False
            
        try:
            all_steps_passed = True
            
            # Step 1: Fingerprint
            step1_payload = {
                "step": 1,
                "data": {"type": "webauthn", "entropy": [1, 2, 3, 4, 5]},
                "duration_ms": 10000,
                "liveness_verified": True
            }
            
            response1 = requests.post(
                f"{self.base_url}/session/{self.session_id}/biometric-step",
                json=step1_payload,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            step1_success = (response1.status_code == 200 and 
                           response1.json().get("step") == 1 and
                           response1.json().get("step_name") == "fingerprint")
            
            # Step 2: Face
            step2_payload = {
                "step": 2,
                "data": {"type": "face_liveness", "blinks_detected": 2},
                "duration_ms": 10000,
                "liveness_verified": True
            }
            
            response2 = requests.post(
                f"{self.base_url}/session/{self.session_id}/biometric-step",
                json=step2_payload,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            step2_success = (response2.status_code == 200 and 
                           response2.json().get("step") == 2 and
                           response2.json().get("step_name") == "face")
            
            # Step 3: Heartbeat
            step3_payload = {
                "step": 3,
                "data": {"type": "heartbeat_ppg", "heart_rate": 75},
                "duration_ms": 10000,
                "liveness_verified": True
            }
            
            response3 = requests.post(
                f"{self.base_url}/session/{self.session_id}/biometric-step",
                json=step3_payload,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            step3_success = (response3.status_code == 200 and 
                           response3.json().get("step") == 3 and
                           response3.json().get("step_name") == "heartbeat")
            
            all_steps_passed = step1_success and step2_success and step3_success
            
            self.log_test(
                "Biometric Steps (1: Fingerprint, 2: Face, 3: Heartbeat)",
                all_steps_passed,
                f"Step1: {step1_success}, Step2: {step2_success}, Step3: {step3_success}",
                {
                    "step1_response": response1.json() if step1_success else response1.text,
                    "step2_response": response2.json() if step2_success else response2.text,
                    "step3_response": response3.json() if step3_success else response3.text
                }
            )
            return all_steps_passed
            
        except Exception as e:
            self.log_test("Biometric Steps", False, f"Error: {str(e)}")
            return False

    def test_complete_enrollment(self) -> bool:
        """Test enrollment completion and User ID generation"""
        if not self.session_id:
            self.log_test("Complete Enrollment", False, "No session ID available")
            return False
            
        try:
            payload = {
                "session_id": self.session_id,
                "fingerprint_data": {"type": "webauthn", "entropy": [1, 2, 3, 4, 5]},
                "face_data": {"type": "face_liveness", "blinks_detected": 2},
                "heartbeat_data": {"type": "heartbeat_ppg", "heart_rate": 75}
            }
            
            response = requests.post(
                f"{self.base_url}/session/{self.session_id}/complete-enrollment",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=20
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_keys = ["status", "user_id", "public_key", "algorithm", "guardians"]
                has_keys = all(key in data for key in required_keys)
                
                if has_keys:
                    user_id = data.get("user_id", "")
                    # Check User ID format: BPS-XXXX-XXXX-XXXX
                    user_id_valid = (user_id.startswith("BPS-") and 
                                   len(user_id.split("-")) == 4 and
                                   len(user_id) >= 16)  # BPS-XXXX-XXXX-XXXX (at least 16 chars)
                    
                    guardians_info = data.get("guardians", {})
                    guardians_valid = (guardians_info.get("total") == 7 and
                                     guardians_info.get("holding_shares") == 7 and
                                     guardians_info.get("threshold") == 5)
                    
                    success = user_id_valid and guardians_valid
                else:
                    success = False
                
            self.log_test(
                "Complete Enrollment (User ID Generation)",
                success,
                f"Status: {response.status_code}, User ID: {data.get('user_id', 'N/A') if success else 'N/A'}",
                response.json() if success else response.text
            )
            return success
            
        except Exception as e:
            self.log_test("Complete Enrollment", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests"""
        print("🚀 Starting BioPass Swarm v2.0 Backend API Tests")
        print(f"📡 Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Core v2.0 tests
        self.test_api_root()
        self.test_guardians_status()
        self.test_session_create()
        self.test_apps_list()
        self.test_biometric_steps()
        self.test_complete_enrollment()
        
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
    tester = BioPassSwarmTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open("/app/test_reports/backend_test_v2_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    # Return appropriate exit code
    return 0 if results["passed_tests"] == results["total_tests"] else 1

if __name__ == "__main__":
    sys.exit(main())