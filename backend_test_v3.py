#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class BioPassV3Tester:
    def __init__(self, base_url="https://jovial-hugle.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and "BioPass Swarm API" in data.get("message", ""):
                self.log_result("API Root Endpoint", True, f"Status: {response.status_code}", data)
                return True
            else:
                self.log_result("API Root Endpoint", False, f"Status: {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("API Root Endpoint", False, f"Error: {str(e)}")
            return False

    def test_auth_signup(self):
        """Test user signup"""
        test_email = f"test_v3_{datetime.now().strftime('%H%M%S')}@biopass.test"
        test_password = "TestPass123!"
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/signup",
                json={"email": test_email, "password": test_password},
                timeout=10
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and data.get("success"):
                self.log_result("Auth Signup", True, f"Email: {test_email}", data)
                return test_email, test_password
            else:
                self.log_result("Auth Signup", False, f"Status: {response.status_code}", data)
                return None, None
        except Exception as e:
            self.log_result("Auth Signup", False, f"Error: {str(e)}")
            return None, None

    def test_auth_signin(self, email, password):
        """Test user signin"""
        try:
            response = requests.post(
                f"{self.base_url}/auth/signin",
                json={"email": email, "password": password},
                timeout=10
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and data.get("success"):
                self.token = data.get("token")
                self.user_id = data.get("user_id")
                self.log_result("Auth Signin", True, f"Token received", {"has_token": bool(self.token)})
                return True
            else:
                self.log_result("Auth Signin", False, f"Status: {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Auth Signin", False, f"Error: {str(e)}")
            return False

    def test_biokey_signin(self):
        """Test Bio Key only signin"""
        # Use a mock Bio Key for testing
        mock_bio_key = "BPS-TEST-1234-5678"
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/biokey-signin",
                json={"bio_key": mock_bio_key},
                timeout=10
            )
            
            # This should fail with 401 since the Bio Key doesn't exist
            # But we're testing the endpoint functionality
            expected_status = 401
            success = response.status_code == expected_status
            data = response.json() if response.status_code in [200, 401] else {}
            
            self.log_result("Bio Key Signin", success, f"Expected 401 for invalid key, got {response.status_code}", data)
            return success
        except Exception as e:
            self.log_result("Bio Key Signin", False, f"Error: {str(e)}")
            return False

    def test_permissions_status(self):
        """Test permissions status endpoint"""
        try:
            response = requests.get(f"{self.base_url}/permissions/status", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                # Check for expected fields
                has_encryption = "encryption" in data
                has_guardians = "guardians" in data
                has_security_features = "security_features" in data
                
                all_fields_present = has_encryption and has_guardians and has_security_features
                self.log_result("Permissions Status", all_fields_present, 
                              f"Fields present: encryption={has_encryption}, guardians={has_guardians}, security_features={has_security_features}", 
                              data)
                return all_fields_present
            else:
                self.log_result("Permissions Status", False, f"Status: {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Permissions Status", False, f"Error: {str(e)}")
            return False

    def test_wallet_endpoint(self):
        """Test wallet endpoint"""
        # Use a mock user ID for testing
        mock_user_id = "BPS-TEST-1234-5678"
        
        try:
            response = requests.get(f"{self.base_url}/wallet/{mock_user_id}", timeout=10)
            
            # This should return 404 since the user doesn't exist
            # But we're testing the endpoint functionality
            expected_status = 404
            success = response.status_code == expected_status
            data = response.json() if response.status_code in [200, 404] else {}
            
            self.log_result("Wallet Endpoint", success, f"Expected 404 for non-existent user, got {response.status_code}", data)
            return success
        except Exception as e:
            self.log_result("Wallet Endpoint", False, f"Error: {str(e)}")
            return False

    def test_guardians_status(self):
        """Test guardians status endpoint"""
        try:
            response = requests.get(f"{self.base_url}/guardians/status", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                # Check for 7 guardians
                guardians = data.get("guardians", [])
                has_7_guardians = len(guardians) == 7
                has_coordinator = "coordinator" in data
                
                all_good = has_7_guardians and has_coordinator
                self.log_result("Guardians Status", all_good, 
                              f"Guardians count: {len(guardians)}, Has coordinator: {has_coordinator}", 
                              {"guardian_count": len(guardians), "has_coordinator": has_coordinator})
                return all_good
            else:
                self.log_result("Guardians Status", False, f"Status: {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Guardians Status", False, f"Error: {str(e)}")
            return False

    def test_session_creation(self):
        """Test session creation"""
        try:
            response = requests.post(
                f"{self.base_url}/session/create",
                json={"device_type": "web", "region": "USA", "language": "English"},
                timeout=10
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and "session_id" in data:
                self.log_result("Session Creation", True, f"Session ID: {data.get('session_id')[:8]}...", 
                              {"has_session_id": True, "guardians_ready": data.get("guardians_ready")})
                return True
            else:
                self.log_result("Session Creation", False, f"Status: {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Session Creation", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all v3.0 tests"""
        print("🚀 Starting BioPass Swarm v3.0 Backend Tests")
        print("=" * 50)
        
        # Core API tests
        self.test_api_root()
        self.test_guardians_status()
        self.test_session_creation()
        self.test_permissions_status()
        
        # Auth tests (new in v3.0)
        email, password = self.test_auth_signup()
        if email and password:
            self.test_auth_signin(email, password)
        
        self.test_biokey_signin()
        self.test_wallet_endpoint()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Save results
        results_data = {
            "test_run": "BioPass Swarm v3.0 Backend Tests",
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "success_rate": f"{(self.tests_passed/self.tests_run)*100:.1f}%"
            },
            "results": self.results
        }
        
        with open("/app/test_reports/backend_test_v3_results.json", "w") as f:
            json.dump(results_data, f, indent=2)
        
        return self.tests_passed == self.tests_run

def main():
    tester = BioPassV3Tester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())