import { useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Shield,
  Zap,
  Eye,
  Lock,
  Globe,
  Smartphone,
  Cpu,
  Users,
  Star,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Bell,
  Sparkles,
  Target,
  TrendingUp,
  Mic,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";

export default function UpdatesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Updates" },
    { id: "security", label: "Security" },
    { id: "features", label: "Features" },
    { id: "coming", label: "Coming Soon" },
  ];

  const updates = [
    {
      id: 1,
      category: "features",
      version: "v2.2",
      title: "Voice Biometric Lock/Unlock",
      description: "Unlock apps, vault, and device using your unique voice signature. Advanced voiceprint authentication with anti-spoofing.",
      status: "coming",
      date: "Q1 2026",
      icon: Mic,
      color: "cyan",
    },
    {
      id: 2,
      category: "security",
      version: "v2.1",
      title: "Ultra HD Quantum Encryption",
      description: "Enhanced CRYSTALS-Kyber-2048 encryption with improved lattice-based security. 50% stronger against quantum attacks.",
      status: "coming",
      date: "Q1 2026",
      icon: Shield,
      color: "purple",
    },
    {
      id: 2,
      category: "features",
      version: "v2.0.5",
      title: "Hardware Security Module (HSM) Support",
      description: "Enterprise-grade hardware security integration for maximum key protection.",
      status: "coming",
      date: "Feb 2026",
      icon: Cpu,
      color: "purple",
    },
    {
      id: 3,
      category: "security",
      version: "v2.0.4",
      title: "Advanced Anti-Deepfake AI",
      description: "Neural network-powered deepfake detection with 99.9% accuracy for face liveness verification.",
      status: "coming",
      date: "Jan 2026",
      icon: Eye,
      color: "green",
    },
    {
      id: 4,
      category: "features",
      version: "v2.0.3",
      title: "Multi-Device Sync",
      description: "Securely sync your BioPass across multiple devices using encrypted Guardian shares.",
      status: "coming",
      date: "Jan 2026",
      icon: Smartphone,
      color: "yellow",
    },
    {
      id: 5,
      category: "security",
      version: "v2.0.2",
      title: "Trusted Contacts Recovery",
      description: "Designate 2-3 trusted contacts to hold emergency recovery shares. Social recovery for your identity.",
      status: "coming",
      date: "Dec 2025",
      icon: Users,
      color: "pink",
    },
    {
      id: 6,
      category: "features",
      version: "v2.0.1",
      title: "Biometric Payment Integration",
      description: "Pay with your biometrics. No cards, no passwords. Just you.",
      status: "planned",
      date: "Q2 2026",
      icon: Zap,
      color: "orange",
    },
    {
      id: 7,
      category: "security",
      version: "v2.0",
      title: "7 Guardian Architecture",
      description: "Distributed security with 7 Guardian agents and 5-of-7 Shamir threshold. Now live!",
      status: "live",
      date: "Dec 2025",
      icon: Shield,
      color: "cyan",
    },
    {
      id: 8,
      category: "features",
      version: "v2.0",
      title: "App Lock Manager",
      description: "Lock individual apps with biometric protection. Now available!",
      status: "live",
      date: "Dec 2025",
      icon: Lock,
      color: "green",
    },
  ];

  const futureRoadmap = [
    {
      phase: "Phase 1 - Q1 2026",
      title: "Ultra HD Encryption Suite",
      items: [
        "CRYSTALS-Kyber-2048 upgrade",
        "Dilithium-8 signatures",
        "12-of-15 Guardian network",
        "Neural liveness detection v2",
      ],
    },
    {
      phase: "Phase 2 - Q2 2026",
      title: "Enterprise Security",
      items: [
        "HSM integration",
        "FIDO2/WebAuthn enterprise",
        "SOC2 compliance",
        "Audit logging dashboard",
      ],
    },
    {
      phase: "Phase 3 - Q3 2026",
      title: "Decentralized Identity",
      items: [
        "Blockchain-anchored identity",
        "Zero-knowledge proofs",
        "Cross-chain authentication",
        "DID integration",
      ],
    },
    {
      phase: "Phase 4 - Q4 2026",
      title: "Global Expansion",
      items: [
        "100+ country support",
        "Government ID verification",
        "Healthcare integration",
        "Financial services APIs",
      ],
    },
  ];

  const filteredUpdates =
    selectedCategory === "all"
      ? updates
      : updates.filter((u) => u.category === selectedCategory || u.status === selectedCategory);

  const statusColors = {
    live: "bg-green-500/20 text-green-400 border-green-500/30",
    coming: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    planned: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  const iconColors = {
    cyan: "text-cyan-400 bg-cyan-400/20",
    purple: "text-purple-400 bg-purple-400/20",
    green: "text-green-400 bg-green-400/20",
    yellow: "text-yellow-400 bg-yellow-400/20",
    pink: "text-pink-400 bg-pink-400/20",
    orange: "text-orange-400 bg-orange-400/20",
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-400/30 flex items-center justify-center border border-cyan-400/50">
              <Rocket className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-heading text-white mb-2" data-testid="updates-title">
            Updates & Roadmap
          </h1>
          <p className="text-slate-400 text-sm">
            Ultra HD Advanced Encryption Security - Future Plans
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedCategory === cat.id
                  ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/50"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Updates List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-12"
        >
          {filteredUpdates.map((update, index) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    iconColors[update.color]
                  }`}
                >
                  <update.icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-500">{update.version}</span>
                    <Badge className={`text-xs ${statusColors[update.status]}`}>
                      {update.status === "live" ? "LIVE" : update.status === "coming" ? "COMING SOON" : "PLANNED"}
                    </Badge>
                  </div>

                  <h3 className="font-heading text-white mb-1">{update.title}</h3>
                  <p className="text-sm text-slate-400 mb-2">{update.description}</p>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {update.date}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Future Roadmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-heading text-cyan-400 mb-6 flex items-center gap-2 justify-center">
            <Target className="w-5 h-5" />
            Future Plans - Ultra HD Encryption Roadmap
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {futureRoadmap.map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs text-cyan-400">{phase.phase}</p>
                    <h3 className="font-heading text-white text-sm">{phase.title}</h3>
                  </div>
                </div>

                <ul className="space-y-2">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-slate-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 glass-card rounded-2xl p-6 text-center border border-cyan-400/30"
        >
          <Bell className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
          <h3 className="font-heading text-white text-lg mb-2">Stay Updated</h3>
          <p className="text-sm text-slate-400 mb-4">
            Get notified when new security features are released
          </p>
          <Button className="btn-primary font-heading rounded-full px-8">
            <Sparkles className="w-4 h-4 mr-2" />
            Enable Notifications
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <div className="text-center">
            <p className="text-2xl font-heading text-cyan-400">15+</p>
            <p className="text-xs text-slate-500">Upcoming Features</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading text-green-400">99.9%</p>
            <p className="text-xs text-slate-500">Security Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading text-purple-400">2026</p>
            <p className="text-xs text-slate-500">Ultra HD Release</p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-slate-500">
            © 2025 SoftTechX Ltd. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
