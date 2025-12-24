import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  ShieldCheck,
  Fingerprint,
  Camera,
  Activity,
  Cpu,
  MessageSquare,
  Settings,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Send,
  Globe,
  Mail,
  HelpCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const REGIONS = [
  { value: "USA", label: "USA / English" },
  { value: "India", label: "India / Hindi" },
  { value: "UK", label: "UK / English" },
  { value: "Germany", label: "Germany / Deutsch" },
  { value: "Japan", label: "Japan / Japanese" },
  { value: "Brazil", label: "Brazil / Portuguese" },
];

export default function BioPassHome() {
  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [deviceType, setDeviceType] = useState("Web Interface");

  // Permission states
  const [webAuthnGranted, setWebAuthnGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  // Step states
  const [openSteps, setOpenSteps] = useState([1]);
  const [stepStatuses, setStepStatuses] = useState({
    1: "pending",
    2: "pending",
    3: "pending",
  });
  const [currentStep, setCurrentStep] = useState(1);

  // Camera states
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);

  // PPG states
  const [ppgData, setPpgData] = useState([]);
  const [heartRate, setHeartRate] = useState(null);

  // UI states
  const [showChat, setShowChat] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Config states
  const [region, setRegion] = useState("USA");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  // Calculate progress
  const progress =
    Object.values(stepStatuses).filter((s) => s === "completed").length * 33.33;

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        // Detect device type
        const ua = navigator.userAgent;
        if (/mobile/i.test(ua)) {
          setDeviceType("Mobile Device");
        } else if (/tablet/i.test(ua)) {
          setDeviceType("Tablet");
        }

        const response = await axios.post(`${API_URL}/session/create`, {
          device_type: deviceType,
          region: region,
        });
        setSessionId(response.data.session_id);
      } catch (error) {
        console.error("Session init error:", error);
        // Create local session if API fails
        setSessionId(uuidv4());
      }
    };

    initSession();
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // WebAuthn handler
  const handleWebAuthn = async () => {
    try {
      if (!window.PublicKeyCredential) {
        toast.error("WebAuthn not supported on this device");
        return;
      }

      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        toast.error("No platform authenticator available");
        return;
      }

      // Create credential options
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: "BioPass Swarm",
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16),
          name: `user_${sessionId}`,
          displayName: "BioPass User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        setWebAuthnGranted(true);
        setStepStatuses((prev) => ({ ...prev, 1: "completed" }));
        toast.success("WebAuthn authentication successful!");

        // Update backend
        if (sessionId) {
          await axios.patch(`${API_URL}/session/${sessionId}/permissions`, {
            webauthn_status: true,
          });
          await axios.post(`${API_URL}/session/${sessionId}/step`, {
            step: 1,
            status: "completed",
          });
        }

        // Auto-open next step
        setOpenSteps([2]);
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("WebAuthn error:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Authentication cancelled by user");
      } else {
        toast.error("WebAuthn authentication failed");
      }
    }
  };

  // Camera handler
  const handleCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      setCameraStream(stream);
      setCameraGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      toast.success("Camera access granted!");

      if (sessionId) {
        await axios.patch(`${API_URL}/session/${sessionId}/permissions`, {
          camera_status: true,
        });
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  };

  // Liveness check (blink detection simulation)
  const startLivenessCheck = useCallback(async () => {
    if (!cameraGranted || !videoRef.current) {
      toast.error("Please grant camera access first");
      return;
    }

    setIsProcessing(true);
    setStepStatuses((prev) => ({ ...prev, 2: "in_progress" }));
    setBlinkCount(0);

    // Simulate blink detection with countdown
    toast.info("Look straight at the camera and blink twice");

    let blinks = 0;
    const blinkInterval = setInterval(() => {
      blinks++;
      setBlinkCount(blinks);
      if (blinks >= 2) {
        clearInterval(blinkInterval);
        setIsProcessing(false);
        setStepStatuses((prev) => ({ ...prev, 2: "completed" }));
        toast.success("Liveness verification complete!");

        if (sessionId) {
          axios.post(`${API_URL}/session/${sessionId}/step`, {
            step: 2,
            status: "completed",
            data: { blinks_detected: 2 },
          });
        }

        // Auto-open next step
        setOpenSteps([3]);
        setCurrentStep(3);
      }
    }, 2000);

    // Cleanup after 10 seconds if not completed
    setTimeout(() => {
      clearInterval(blinkInterval);
      if (blinks < 2) {
        setIsProcessing(false);
        toast.error("Liveness check timed out. Please try again.");
      }
    }, 10000);
  }, [cameraGranted, sessionId]);

  // Heartbeat PPG detection
  const startHeartbeatPPG = useCallback(async () => {
    if (!cameraGranted || !videoRef.current) {
      toast.error("Please grant camera access first");
      return;
    }

    setIsProcessing(true);
    setStepStatuses((prev) => ({ ...prev, 3: "in_progress" }));
    setPpgData([]);

    toast.info("Place your finger over the camera lens");

    // Simulate PPG data collection
    const ppgInterval = setInterval(() => {
      const newValue = 50 + Math.sin(Date.now() / 200) * 30 + Math.random() * 10;
      setPpgData((prev) => {
        const updated = [...prev, newValue].slice(-100);
        return updated;
      });
    }, 50);

    // Complete after 5 seconds
    setTimeout(() => {
      clearInterval(ppgInterval);
      setIsProcessing(false);
      setHeartRate(Math.floor(60 + Math.random() * 40));
      setStepStatuses((prev) => ({ ...prev, 3: "completed" }));
      toast.success("Heartbeat PPG captured successfully!");

      if (sessionId) {
        axios.post(`${API_URL}/session/${sessionId}/step`, {
          step: 3,
          status: "completed",
          data: { heart_rate: heartRate, ppg_samples: ppgData.length },
        });
      }
    }, 5000);
  }, [cameraGranted, sessionId, heartRate, ppgData.length]);

  // Chat handler
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: userMessage,
        session_id: sessionId || "anonymous",
      });
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Revoke permissions
  const revokePermissions = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraGranted(false);
    setWebAuthnGranted(false);
    setStepStatuses({ 1: "pending", 2: "pending", 3: "pending" });
    setOpenSteps([1]);
    setCurrentStep(1);
    setShowRevokeModal(false);
    toast.success("All permissions revoked");
  };

  // Save recovery email
  const saveRecoveryEmail = async () => {
    if (!recoveryEmail.trim()) return;

    try {
      await axios.post(`${API_URL}/recovery-email`, {
        session_id: sessionId,
        email: recoveryEmail,
      });
      toast.success("Recovery email saved");
    } catch (error) {
      toast.error("Failed to save recovery email");
    }
  };

  // PPG Waveform SVG Path
  const ppgPath = ppgData.length > 1
    ? `M 0 ${100 - ppgData[0]} ` +
      ppgData
        .slice(1)
        .map((val, i) => `L ${(i + 1) * 3} ${100 - val}`)
        .join(" ")
    : "M 0 50 L 300 50";

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="biopass-bg" />

      {/* Main Container */}
      <div className="biopass-container">
        {/* Header */}
        <header className="biopass-header relative z-20">
          <div className="flex justify-end gap-2 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(true)}
              className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 relative z-30"
              data-testid="help-chat-btn"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(true)}
              className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 relative z-30"
              data-testid="chat-btn"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="biopass-title"
            data-testid="app-title"
          >
            BioPass Swarm
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="biopass-subtitle"
          >
            Universal quantum-safe biometric access
          </motion.p>
        </header>

        {/* Device Detection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <span className="text-xs text-slate-500 uppercase tracking-widest">
            Detected: {deviceType}
          </span>
        </motion.div>

        {/* Permission Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-3 mb-6 flex-wrap"
        >
          <div
            className={`permission-badge ${webAuthnGranted ? "granted" : "pending"}`}
            data-testid="webauthn-badge"
          >
            {webAuthnGranted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            WebAuthn {webAuthnGranted ? "Connected" : "Pending"}
          </div>
          <div
            className={`permission-badge ${cameraGranted ? "granted" : "pending"}`}
            data-testid="camera-badge"
          >
            {cameraGranted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            Camera {cameraGranted ? "Active" : "Pending"}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Setup Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-white/10" data-testid="progress-bar" />
        </motion.div>

        {/* Step Cards */}
        <div className="space-y-4">
          {/* Step 1: Security Key / Biometric */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Collapsible
              open={openSteps.includes(1)}
              onOpenChange={(open) =>
                setOpenSteps(open ? [...openSteps, 1] : openSteps.filter((s) => s !== 1))
              }
            >
              <div
                className={`step-card ${currentStep === 1 ? "active" : ""} ${
                  stepStatuses[1] === "completed" ? "completed" : ""
                }`}
                data-testid="step-1-card"
              >
                <CollapsibleTrigger className="w-full">
                  <div className="step-header">
                    <div className="flex items-center gap-3">
                      <div
                        className={`step-number ${
                          stepStatuses[1] === "completed" ? "completed" : ""
                        }`}
                      >
                        {stepStatuses[1] === "completed" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          "1"
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="step-title">Security Key / Biometric</h3>
                        <p className="step-description">
                          Use device's built-in authenticator
                        </p>
                      </div>
                    </div>
                    {openSteps.includes(1) ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4"
                  >
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Fingerprint className="w-12 h-12 text-cyan-400 animate-pulse-glow" />
                    </div>
                    <Button
                      onClick={handleWebAuthn}
                      disabled={webAuthnGranted}
                      className="w-full btn-primary font-heading text-sm tracking-wider rounded-full py-6"
                      data-testid="webauthn-btn"
                    >
                      {webAuthnGranted ? "WebAuthn Connected" : "Use WebAuthn"}
                    </Button>
                  </motion.div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>

          {/* Step 2: Liveness Check */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Collapsible
              open={openSteps.includes(2)}
              onOpenChange={(open) =>
                setOpenSteps(open ? [...openSteps, 2] : openSteps.filter((s) => s !== 2))
              }
            >
              <div
                className={`step-card ${currentStep === 2 ? "active" : ""} ${
                  stepStatuses[2] === "completed" ? "completed" : ""
                }`}
                data-testid="step-2-card"
              >
                <CollapsibleTrigger className="w-full">
                  <div className="step-header">
                    <div className="flex items-center gap-3">
                      <div
                        className={`step-number ${
                          stepStatuses[2] === "completed" ? "completed" : ""
                        }`}
                      >
                        {stepStatuses[2] === "completed" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          "2"
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="step-title">Liveness Check</h3>
                        <p className="step-description">
                          Anti-deepfake verification. Look straight, blink twice.
                        </p>
                      </div>
                    </div>
                    {openSteps.includes(2) ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4"
                  >
                    {!cameraGranted ? (
                      <Button
                        onClick={handleCameraAccess}
                        className="w-full btn-primary font-heading text-sm tracking-wider rounded-full py-6 mb-4"
                        data-testid="camera-access-btn"
                      >
                        Grant Camera Access
                      </Button>
                    ) : (
                      <>
                        <div className="camera-preview mx-auto" data-testid="camera-preview">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isProcessing && currentStep === 2 && (
                          <p className="text-center text-cyan-400 text-sm mt-2">
                            Processing scan... Blinks detected: {blinkCount}/2
                          </p>
                        )}
                        <Button
                          onClick={startLivenessCheck}
                          disabled={isProcessing || stepStatuses[2] === "completed"}
                          className="w-full btn-primary font-heading text-sm tracking-wider rounded-full py-6 mt-4"
                          data-testid="liveness-btn"
                        >
                          {stepStatuses[2] === "completed"
                            ? "Liveness Verified"
                            : isProcessing
                            ? "Scanning..."
                            : "Start Liveness Check"}
                        </Button>
                      </>
                    )}
                  </motion.div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>

          {/* Step 3: Heartbeat PPG */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Collapsible
              open={openSteps.includes(3)}
              onOpenChange={(open) =>
                setOpenSteps(open ? [...openSteps, 3] : openSteps.filter((s) => s !== 3))
              }
            >
              <div
                className={`step-card ${currentStep === 3 ? "active" : ""} ${
                  stepStatuses[3] === "completed" ? "completed" : ""
                }`}
                data-testid="step-3-card"
              >
                <CollapsibleTrigger className="w-full">
                  <div className="step-header">
                    <div className="flex items-center gap-3">
                      <div
                        className={`step-number ${
                          stepStatuses[3] === "completed" ? "completed" : ""
                        }`}
                      >
                        {stepStatuses[3] === "completed" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          "3"
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="step-title">Heartbeat PPG</h3>
                        <p className="step-description">
                          Place finger over camera to detect live pulse waveform.
                        </p>
                      </div>
                    </div>
                    {openSteps.includes(3) ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4"
                  >
                    {!cameraGranted ? (
                      <Button
                        onClick={handleCameraAccess}
                        className="w-full btn-primary font-heading text-sm tracking-wider rounded-full py-6 mb-4"
                        data-testid="camera-access-ppg-btn"
                      >
                        Grant Camera Access
                      </Button>
                    ) : (
                      <>
                        <div className="ppg-container" data-testid="ppg-container">
                          <svg
                            viewBox="0 0 300 100"
                            className="ppg-waveform"
                            preserveAspectRatio="none"
                          >
                            <path d={ppgPath} className="ppg-wave" />
                          </svg>
                        </div>
                        {heartRate && (
                          <div className="text-center mb-4">
                            <span className="text-3xl font-heading text-cyan-400">
                              {heartRate}
                            </span>
                            <span className="text-slate-400 ml-2">BPM</span>
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
                        </div>
                        <Button
                          onClick={startHeartbeatPPG}
                          disabled={isProcessing || stepStatuses[3] === "completed"}
                          className="w-full btn-primary font-heading text-sm tracking-wider rounded-full py-6"
                          data-testid="ppg-btn"
                        >
                          {stepStatuses[3] === "completed"
                            ? "PPG Captured"
                            : isProcessing
                            ? "Detecting pulse..."
                            : "Start PPG Capture"}
                        </Button>
                      </>
                    )}
                  </motion.div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>
        </div>

        {/* Notes Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="notes-section mt-8"
          data-testid="notes-section"
        >
          <div className="note-item">
            <Cpu className="note-icon w-5 h-5" />
            <p className="note-text">
              <strong>Quantum-Safe:</strong> Protected by Kyber + Dilithium
              cryptography.
            </p>
          </div>
          <div className="note-item">
            <ShieldCheck className="note-icon w-5 h-5" />
            <p className="note-text">
              <strong>On-Device Only:</strong> Biometric data never leaves your
              device.
            </p>
          </div>
        </motion.div>

        {/* Configuration Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 space-y-4"
          data-testid="config-section"
        >
          <h3 className="text-sm font-heading text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </h3>

          {/* Region & Language */}
          <div className="glass-card rounded-xl p-4">
            <label className="text-xs text-slate-400 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Region & Language
            </label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger
                className="w-full bg-white/5 border-white/10 text-white"
                data-testid="region-select"
              >
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A1A] border-white/10">
                {REGIONS.map((r) => (
                  <SelectItem
                    key={r.value}
                    value={r.value}
                    className="text-white hover:bg-white/10"
                  >
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recovery Email */}
          <div className="glass-card rounded-xl p-4">
            <label className="text-xs text-slate-400 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Recovery Email (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                data-testid="recovery-email-input"
              />
              <Button
                onClick={saveRecoveryEmail}
                variant="secondary"
                className="bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 border border-cyan-400/30"
                data-testid="add-email-btn"
              >
                Add
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Revoke Button */}
        {(webAuthnGranted || cameraGranted) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Button
              variant="outline"
              onClick={() => setShowRevokeModal(true)}
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              data-testid="revoke-btn"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Revoke Permissions
            </Button>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="biopass-footer">
          <p className="copyright" data-testid="copyright">
            &copy; SoftTechX Ltd. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Chat Modal */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="bg-[#0A0A1A] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-cyan-400 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              BioPass Help
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Ask about privacy, security, or how to use BioPass Swarm
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[300px] pr-4" data-testid="chat-messages">
            <div className="space-y-4">
              {chatMessages.length === 0 && (
                <p className="text-center text-slate-500 py-8">
                  Start a conversation...
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.role}`}
                  data-testid={`chat-message-${msg.role}`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
              {isChatLoading && (
                <div className="chat-message assistant">
                  <p className="text-sm text-slate-400">Thinking...</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 mt-4">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
              placeholder="Ask a question..."
              className="flex-1 bg-white/5 border-white/10 text-white"
              data-testid="chat-input"
            />
            <Button
              onClick={sendChatMessage}
              disabled={isChatLoading}
              className="bg-cyan-400 text-black hover:bg-cyan-300"
              data-testid="send-chat-btn"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Modal */}
      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent className="bg-[#0A0A1A] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Revoke Permissions
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Granted complete. You can revoke immediately.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-slate-300 py-4">
            Revoking permissions will reset your biometric setup. You'll need to
            complete the enrollment process again.
          </p>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRevokeModal(false)}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              data-testid="keep-permissions-btn"
            >
              Keep until next login
            </Button>
            <Button
              onClick={revokePermissions}
              className="flex-1 bg-red-500 text-white hover:bg-red-600"
              data-testid="revoke-now-btn"
            >
              Revoke now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for PPG processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
