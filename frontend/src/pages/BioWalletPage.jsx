import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import {
  Wallet,
  Key,
  Copy,
  Download,
  QrCode,
  Shield,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Fingerprint,
  Users,
  Cpu,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

export default function BioWalletPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [showKeys, setShowKeys] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [walletStats, setWalletStats] = useState({
    guardians_holding: 7,
    threshold: 5,
    last_auth: null,
    security_score: 98,
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("biopass_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchWalletDetails(storedUserId);
    }
  }, []);

  const fetchWalletDetails = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/wallet/${id}`);
      if (response.data) {
        setPublicKey(response.data.public_key);
        setWalletStats(response.data.stats);
      }
    } catch (error) {
      console.error("Fetch wallet error:", error);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadKeys = () => {
    const keyData = {
      user_id: userId,
      public_key: publicKey,
      algorithm: "CRYSTALS-Kyber-1024",
      exported_at: new Date().toISOString(),
      warning: "KEEP THIS FILE SECURE. Your Bio Key is your identity.",
    };

    const blob = new Blob([JSON.stringify(keyData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biopass_wallet_${userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Wallet keys exported!");
  };

  const generateQRData = () => {
    return JSON.stringify({
      type: "BIOPASS_WALLET",
      user_id: userId,
      public_key: publicKey?.substring(0, 32) + "...",
      version: "2.0",
    });
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="biopass-bg" />

      <div className="biopass-container py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-slate-400 hover:text-cyan-400"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-400/30 flex items-center justify-center border border-cyan-400/50">
              <Wallet className="w-10 h-10 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-heading text-white mb-2" data-testid="wallet-title">
            Bio Wallet
          </h1>
          <p className="text-slate-400 text-sm">
            Your Quantum-Safe Identity Keys
          </p>
        </motion.div>

        {/* Security Score */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading text-slate-300">Security Score</h3>
            <span className="text-2xl font-heading text-green-400">
              {walletStats.security_score}%
            </span>
          </div>
          <Progress value={walletStats.security_score} className="h-2 bg-white/10" />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Weak</span>
            <span>Strong</span>
            <span>Maximum</span>
          </div>
        </motion.div>

        {/* User ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 mb-6 border border-cyan-400/30"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading text-slate-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              Your Bio Key (User ID)
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(userId, "Bio Key")}
                className="h-8 w-8 text-cyan-400 hover:bg-cyan-400/10"
                data-testid="copy-userid-btn"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQRModal(true)}
                className="h-8 w-8 text-cyan-400 hover:bg-cyan-400/10"
                data-testid="qr-btn"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-4 font-mono text-lg text-cyan-400 text-center break-all">
            {userId || "Complete enrollment to get your Bio Key"}
          </div>

          <p className="text-xs text-slate-500 mt-3 text-center">
            This is your unique quantum-protected identity. Keep it safe!
          </p>
        </motion.div>

        {/* Public Key Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              Public Key (Shareable)
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKeys(!showKeys)}
                className="h-8 w-8 text-slate-400 hover:bg-white/10"
              >
                {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(publicKey, "Public Key")}
                className="h-8 w-8 text-green-400 hover:bg-green-400/10"
                data-testid="copy-pubkey-btn"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-4 font-mono text-sm text-green-400 break-all">
            {showKeys
              ? publicKey || "No public key available"
              : "••••••••••••••••••••••••••••••••"}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              CRYSTALS-Kyber-1024
            </span>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
              Post-Quantum Safe
            </span>
          </div>
        </motion.div>

        {/* Wallet Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-xl font-heading text-white">{walletStats.guardians_holding}</p>
            <p className="text-xs text-slate-500">Guardians Holding</p>
          </div>

          <div className="glass-card rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-xl font-heading text-white">{walletStats.threshold}/7</p>
            <p className="text-xs text-slate-500">Threshold</p>
          </div>

          <div className="glass-card rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-xl font-heading text-white">8s</p>
            <p className="text-xs text-slate-500">Auto-Destruct</p>
          </div>

          <div className="glass-card rounded-xl p-4 text-center">
            <Cpu className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-xl font-heading text-white">256-bit</p>
            <p className="text-xs text-slate-500">Encryption</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Button
            onClick={downloadKeys}
            className="w-full btn-primary font-heading rounded-full py-6"
            data-testid="export-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Wallet Keys
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 rounded-full py-6"
          >
            <Fingerprint className="w-4 h-4 mr-2" />
            Re-Verify Biometrics
          </Button>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-400 mb-1">Important Security Notice</h4>
              <p className="text-xs text-slate-400">
                Your Bio Key is your identity. Never share it with anyone. If you lose your Bio Key, 
                you can recover your account using your registered email and completing fresh biometric enrollment.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-slate-500">
            All Rights Reserved ©️ SoftTechX
          </p>
        </motion.div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="bg-[#0A0A1A] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-cyan-400 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Bio Wallet QR Code
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Scan to import your wallet on another device
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white p-4 rounded-xl mx-auto">
            {/* Simulated QR Code */}
            <div className="w-48 h-48 bg-[#0A0A1A] rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-8 gap-1 p-2">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 ${Math.random() > 0.5 ? "bg-cyan-400" : "bg-transparent"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center mt-2">
            Valid for 5 minutes
          </p>

          <Button
            onClick={() => setShowQRModal(false)}
            className="w-full bg-cyan-400 text-black hover:bg-cyan-300 mt-4"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
