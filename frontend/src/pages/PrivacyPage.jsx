import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Database,
  Server,
  Globe,
  Users,
  Key,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "data", label: "Data Collection", icon: Database },
    { id: "security", label: "Security", icon: Lock },
    { id: "biometric", label: "Biometric Data", icon: Fingerprint },
    { id: "rights", label: "Your Rights", icon: Users },
    { id: "contact", label: "Contact", icon: Mail },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="biopass-bg" />

      <div className="biopass-container py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-slate-400 hover:text-cyan-400"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-heading text-white mb-2" data-testid="privacy-title">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm">
            Last updated: December 2025
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-3 mb-8 flex-wrap"
        >
          <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-400 px-3 py-2 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            GDPR Compliant
          </div>
          <div className="flex items-center gap-2 text-xs bg-cyan-500/10 text-cyan-400 px-3 py-2 rounded-full">
            <Lock className="w-4 h-4" />
            End-to-End Encrypted
          </div>
          <div className="flex items-center gap-2 text-xs bg-purple-500/10 text-purple-400 px-3 py-2 rounded-full">
            <Server className="w-4 h-4" />
            On-Device Processing
          </div>
        </motion.div>

        {/* Navigation Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                activeSection === section.id
                  ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/50"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 max-w-3xl mx-auto"
        >
          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-cyan-400 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Overview
              </h2>
              
              <p className="text-slate-300 leading-relaxed">
                At BioPass Swarm, your privacy is our top priority. We've built our system from the ground up with a "privacy-first" approach, ensuring your biometric data and personal information remain secure and under your control.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Zero Cloud Storage
                  </h3>
                  <p className="text-sm text-slate-400">
                    Your biometric data never leaves your device. All processing happens locally.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    Quantum-Safe Encryption
                  </h3>
                  <p className="text-sm text-slate-400">
                    CRYSTALS-Kyber + Dilithium post-quantum cryptography protects your data.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Distributed Security
                  </h3>
                  <p className="text-sm text-slate-400">
                    7 Guardian agents with 5-of-7 threshold ensure no single point of failure.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-yellow-400" />
                    Full Transparency
                  </h3>
                  <p className="text-sm text-slate-400">
                    You control exactly what data is collected and can revoke permissions anytime.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data Collection Section */}
          {activeSection === "data" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-cyan-400 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Collection
              </h2>

              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h3 className="font-medium text-green-400 mb-2">What We Collect (Minimal)</h3>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      Email address (for account recovery only)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      Encrypted session data (stored locally)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      App lock preferences (stored locally)
                    </li>
                  </ul>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h3 className="font-medium text-red-400 mb-2">What We NEVER Collect</h3>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Raw biometric data (fingerprints, face images, heartbeat)
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Your private encryption keys
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Location data or device identifiers
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      Content of your locked apps or files
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === "security" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-cyan-400 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security Measures
              </h2>

              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="encryption" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-cyan-400">
                    Post-Quantum Encryption
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400">
                    We use CRYSTALS-Kyber-1024 for key encapsulation and CRYSTALS-Dilithium-5 for digital signatures. These algorithms are designed to be secure against both classical and quantum computer attacks, following NIST post-quantum cryptography standards.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shamir" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-cyan-400">
                    Shamir's Secret Sharing (5-of-7)
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400">
                    Your private key is split into 7 encrypted shares distributed across Guardian agents. At least 5 shares are required to reconstruct the key, ensuring no single point of failure and resistance to compromise.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="auto-destruct" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-cyan-400">
                    8-Second Auto-Destruct
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400">
                    After authentication, your reconstructed key is automatically destroyed within 8 seconds. This ensures that even if your device is compromised, the key cannot be extracted.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="liveness" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-cyan-400">
                    Anti-Deepfake Liveness Detection
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400">
                    Our face verification requires real-time liveness detection including blink detection and movement analysis. Pre-recorded videos, photos, and deepfakes cannot bypass this security layer.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Biometric Data Section */}
          {activeSection === "biometric" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-cyan-400 flex items-center gap-2">
                <Fingerprint className="w-5 h-5" />
                Biometric Data Handling
              </h2>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-cyan-400 mb-2">Our Core Promise</h3>
                <p className="text-slate-300">
                  Your biometric data (fingerprints, face scans, heartbeat patterns) is <strong>NEVER</strong> stored, transmitted, or shared. It is only used to generate a one-time cryptographic entropy seed that is immediately discarded.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-400 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Capture</h3>
                    <p className="text-sm text-slate-400">Biometric data is captured for exactly 10 seconds per step.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Process</h3>
                    <p className="text-sm text-slate-400">Entropy is extracted and immediately hashed using SHA3-512.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Destroy</h3>
                    <p className="text-sm text-slate-400">Raw biometric data is immediately destroyed. Only the hash remains.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Distribute</h3>
                    <p className="text-sm text-slate-400">Derived key is split across 7 Guardians. No single entity has your full key.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Your Rights Section */}
          {activeSection === "rights" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-cyan-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Rights
              </h2>

              <p className="text-slate-300">
                Under GDPR and other privacy regulations, you have the following rights:
              </p>

              <div className="grid gap-4">
                {[
                  { title: "Right to Access", desc: "View all data associated with your account" },
                  { title: "Right to Rectification", desc: "Correct any inaccurate personal data" },
                  { title: "Right to Erasure", desc: "Delete your account and all associated data" },
                  { title: "Right to Portability", desc: "Export your data in a machine-readable format" },
                  { title: "Right to Withdraw Consent", desc: "Revoke permissions at any time" },
                  { title: "Right to Object", desc: "Object to processing of your data" },
                ].map((right, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-white">{right.title}</h3>
                      <p className="text-sm text-slate-400">{right.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Section */}
          {activeSection === "contact" && (
            <div className="space-y-6">
              <h2 className="text-xl font-heading text-cyan-400 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Us
              </h2>

              <p className="text-slate-300">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2">Data Protection Officer</h3>
                  <p className="text-slate-400">privacy@softtechx.com</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2">General Inquiries</h3>
                  <p className="text-slate-400">support@biopassswarm.com</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-2">Mailing Address</h3>
                  <p className="text-slate-400">
                    SoftTechX Ltd.<br />
                    Data Protection Department<br />
                    Privacy Compliance Office
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
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
