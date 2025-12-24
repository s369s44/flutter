import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Fingerprint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Key,
  RefreshCw,
  UserPlus,
  LogIn,
  Cpu,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bioKey, setBioKey] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetBioKey, setResetBioKey] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Check if user has existing bio key
  useEffect(() => {
    const storedBioKey = localStorage.getItem("biopass_user_id");
    if (storedBioKey) {
      setBioKey(storedBioKey);
    }
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/signin`, {
        email,
        password,
        bio_key: bioKey || undefined,
      });

      if (response.data.success) {
        localStorage.setItem("biopass_token", response.data.token);
        localStorage.setItem("biopass_user_id", response.data.user_id);
        toast.success("Welcome back! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        email,
        password,
      });

      if (response.data.success) {
        toast.success("Account created! Please complete biometric enrollment.");
        localStorage.setItem("biopass_temp_token", response.data.temp_token);
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBioKeySignIn = async () => {
    if (!bioKey) {
      toast.error("Please enter your Bio Key");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/biokey-signin`, {
        bio_key: bioKey,
      });

      if (response.data.success) {
        localStorage.setItem("biopass_token", response.data.token);
        localStorage.setItem("biopass_user_id", response.data.user_id);
        toast.success("Bio Key verified! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Bio Key verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetBioKey) {
      toast.error("Bio Key is required for password reset");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email: resetEmail,
        bio_key: resetBioKey,
        new_password: newPassword,
      });

      if (response.data.success) {
        toast.success("Password reset successful! Please sign in.");
        setShowResetModal(false);
        setActiveTab("signin");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="biopass-bg" />

      <div className="biopass-container py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="biopass-title text-3xl md:text-4xl" data-testid="auth-title">
            BioPass Swarm
          </h1>
          <p className="biopass-subtitle text-xs mt-2">
            Quantum-Safe Authentication
          </p>
        </motion.div>

        {/* Security Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2 mb-6 flex-wrap"
        >
          <div className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
            <Cpu className="w-3 h-3" />
            <span>Quantum-Safe</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">
            <Users className="w-3 h-3" />
            <span>7 Guardians</span>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 max-w-md mx-auto"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-6">
              <TabsTrigger
                value="signin"
                className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400"
                data-testid="signin-tab"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400"
                data-testid="signup-tab"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 bg-white/5 border-white/10 text-white"
                      required
                      data-testid="signin-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white"
                      required
                      data-testid="signin-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Bio Key (Optional - for enhanced security)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="text"
                      value={bioKey}
                      onChange={(e) => setBioKey(e.target.value)}
                      placeholder="BPS-XXXX-XXXX-XXXX"
                      className="pl-10 bg-white/5 border-white/10 text-white font-mono"
                      data-testid="signin-biokey"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary font-heading rounded-full py-6"
                  data-testid="signin-btn"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {/* Bio Key Only Sign In */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0A0A1A] px-2 text-slate-500">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBioKeySignIn}
                  disabled={isLoading || !bioKey}
                  className="w-full border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 rounded-full py-6"
                  data-testid="biokey-signin-btn"
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Sign In with Bio Key Only
                </Button>

                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="w-full text-sm text-slate-400 hover:text-cyan-400 transition-colors mt-4"
                  data-testid="forgot-password-btn"
                >
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  Forgot Password? Reset with Bio Key
                </button>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 bg-white/5 border-white/10 text-white"
                      required
                      data-testid="signup-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white"
                      required
                      data-testid="signup-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="pl-10 bg-white/5 border-white/10 text-white"
                      required
                      data-testid="signup-confirm-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary font-heading rounded-full py-6"
                  data-testid="signup-btn"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  By signing up, you agree to our{" "}
                  <a href="/privacy" className="text-cyan-400 hover:underline">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-cyan-400 hover:underline">
                    Terms of Service
                  </a>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-slate-500 mb-3">Trusted by security-conscious users worldwide</p>
          <div className="flex justify-center gap-6 text-slate-600">
            <div className="text-center">
              <p className="text-lg font-heading text-cyan-400">100K+</p>
              <p className="text-xs">Users Protected</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-heading text-green-400">0</p>
              <p className="text-xs">Data Breaches</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-heading text-purple-400">256-bit</p>
              <p className="text-xs">Encryption</p>
            </div>
          </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex justify-center gap-4 text-xs text-slate-500"
        >
          <a href="/privacy" className="hover:text-cyan-400 transition-colors">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="/privacy" className="hover:text-cyan-400 transition-colors">
            Terms of Service
          </a>
          <span>•</span>
          <a href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </a>
        </motion.div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-heading text-cyan-400 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Reset Password with Bio Key
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Your Bio Key is required to reset your password. This ensures only you can change your credentials.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-white/5 border-white/10 text-white"
                  required
                  data-testid="reset-email"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Your Bio Key</label>
                <Input
                  type="text"
                  value={resetBioKey}
                  onChange={(e) => setResetBioKey(e.target.value)}
                  placeholder="BPS-XXXX-XXXX-XXXX"
                  className="bg-white/5 border-white/10 text-white font-mono"
                  required
                  data-testid="reset-biokey"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="bg-white/5 border-white/10 text-white"
                  required
                  data-testid="reset-new-password"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cyan-400 text-black hover:bg-cyan-300"
                  data-testid="reset-submit-btn"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
