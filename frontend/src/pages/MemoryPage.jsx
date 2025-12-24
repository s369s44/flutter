import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Database,
  Shield,
  Users,
  Clock,
  Search,
  ArrowLeft,
  Zap,
  Activity,
  Lock,
  Eye,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

export default function MemoryPage() {
  const navigate = useNavigate();
  const [ultraMemory, setUltraMemory] = useState([]);
  const [coordinatorMemory, setCoordinatorMemory] = useState([]);
  const [guardianMemories, setGuardianMemories] = useState({});
  const [memoryStats, setMemoryStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const categoryIcons = {
    system: Zap,
    security: Shield,
    biometric: Activity,
    access: Lock,
    vault: Database,
  };

  const categoryColors = {
    system: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30",
    security: "bg-red-400/20 text-red-400 border-red-400/30",
    biometric: "bg-purple-400/20 text-purple-400 border-purple-400/30",
    access: "bg-green-400/20 text-green-400 border-green-400/30",
    vault: "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
  };

  useEffect(() => {
    fetchAllMemories();
  }, []);

  const fetchAllMemories = async () => {
    try {
      setLoading(true);
      
      // Fetch ultra memory
      const ultraRes = await axios.get(`${API_URL}/memory/ultra?limit=100`);
      setUltraMemory(ultraRes.data.memories);

      // Fetch coordinator memory
      const coordRes = await axios.get(`${API_URL}/memory/coordinator?limit=100`);
      setCoordinatorMemory(coordRes.data.memories);

      // Fetch all agents memory
      const allRes = await axios.get(`${API_URL}/memory/all-agents`);
      setGuardianMemories(allRes.data.data.guardians);

      // Fetch stats
      const statsRes = await axios.get(`${API_URL}/memory/stats`);
      setMemoryStats(statsRes.data);

    } catch (error) {
      console.error("Failed to fetch memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const filteredUltraMemory = selectedCategory === "all" 
    ? ultraMemory 
    : ultraMemory.filter(m => m.category === selectedCategory);

  return (
    <div className="min-h-screen relative">
      <div className="biopass-bg" />

      <div className="biopass-container py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-slate-400 hover:text-cyan-400"
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
              <Brain className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-heading text-white mb-2">
            Agent Memory System
          </h1>
          <p className="text-slate-400 text-sm">
            Central memory store & individual agent memories
          </p>
        </motion.div>

        {/* Stats Cards */}
        {memoryStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4 mb-6"
          >
            <div className="glass-card rounded-xl p-4 text-center">
              <Database className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-heading text-white">
                {memoryStats.ultra_memory.total}
              </p>
              <p className="text-xs text-slate-500">Ultra Memories</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-heading text-white">
                {memoryStats.coordinator.total}
              </p>
              <p className="text-xs text-slate-500">Coordinator</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-heading text-white">
                {memoryStats.guardians.reduce((sum, g) => sum + g.memory_count, 0)}
              </p>
              <p className="text-xs text-slate-500">Guardian Memories</p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="ultra" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
            <TabsTrigger value="ultra" className="data-[state=active]:bg-cyan-400/20">
              <Database className="w-4 h-4 mr-2" />
              Ultra Memory
            </TabsTrigger>
            <TabsTrigger value="coordinator" className="data-[state=active]:bg-purple-400/20">
              <Brain className="w-4 h-4 mr-2" />
              Coordinator
            </TabsTrigger>
            <TabsTrigger value="guardians" className="data-[state=active]:bg-green-400/20">
              <Users className="w-4 h-4 mr-2" />
              Guardians
            </TabsTrigger>
          </TabsList>

          {/* Ultra Memory Tab */}
          <TabsContent value="ultra" className="mt-6">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {["all", "system", "security", "biometric", "access", "vault"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    selectedCategory === cat
                      ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/50"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredUltraMemory.map((memory, index) => {
                  const Icon = categoryIcons[memory.category] || Activity;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[memory.category]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${categoryColors[memory.category]}`}>
                              {memory.category}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTimestamp(memory.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-white">{memory.event}</p>
                          {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              {JSON.stringify(memory.metadata)}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Coordinator Memory Tab */}
          <TabsContent value="coordinator" className="mt-6">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {coordinatorMemory.map((memory, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(memory.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-white mb-1">{memory.description}</p>
                    <Badge className="bg-purple-400/20 text-purple-400 text-xs">
                      {memory.event_type}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Guardians Memory Tab */}
          <TabsContent value="guardians" className="mt-6">
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {Object.entries(guardianMemories).map(([guardianName, memories], gIndex) => (
                  <div key={guardianName} className="border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-heading mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      {guardianName}
                      <Badge className="bg-green-400/20 text-green-400 text-xs ml-auto">
                        {memories.length} memories
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {memories.slice(0, 5).map((memory, mIndex) => (
                        <div key={mIndex} className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">
                            {formatTimestamp(memory.timestamp)}
                          </p>
                          <p className="text-sm text-white">{memory.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            All Rights Reserved ©️SoftTechX Ltd
          </p>
        </div>
      </div>
    </div>
  );
}
