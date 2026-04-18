/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  History, 
  Award, 
  Play, 
  Pause, 
  RotateCcw, 
  MessageSquare,
  Droplets,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback, useRef } from "react";

// --- Types ---

interface BrushLog {
  id: string;
  timestamp: number;
  duration: number; // in seconds
}

interface UserStats {
  streak: number;
  lastBrush: number | null;
  history: BrushLog[];
}

// --- AI Service ---

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const generateBrushReminder = async (streak: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a sassy, slightly judgmental, but ultimately caring electric toothbrush named "Bristle". 
      The user has a current streak of ${streak} days of brushing their teeth twice a day.
      Send them a short, witty message (max 20 words) "messaging" them to brush their teeth right now.
      If the streak is high, be slightly more impressed. If it's low (0 or 1), be a bit more "disappointed" but encouraging.
      Use emojis.`,
    });
    return response.text?.trim() || "Your teeth are waiting! Don't let the plaque win today. 🪥";
  } catch (error) {
    console.error("Failed to generate AI reminder:", error);
    return "Time for a rinse and scrub! Your future self will thank you. 🦷✨";
  }
};

// --- Components ---

export default function App() {
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem("brushbuddy_stats");
    if (saved) return JSON.parse(saved);
    return { streak: 0, lastBrush: null, history: [] };
  });

  const [isBrushing, setIsBrushing] = useState(false);
  const [timer, setTimer] = useState(120); // 2 minutes (120s)
  const [aiMessage, setAiMessage] = useState<string>("Hey there! Ready to make those teeth shine? ✨");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem("brushbuddy_stats", JSON.stringify(stats));
  }, [stats]);

  // Timer logic
  useEffect(() => {
    if (isBrushing && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0 && isBrushing) {
      handleBrushComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBrushing, timer]);

  const handleBrushComplete = () => {
    setIsBrushing(false);
    const now = Date.now();
    
    // Simple streak logic: if brushed in the last 24h, increment or keep
    // For simplicity: just count days
    const isNewDay = !stats.lastBrush || new Date(now).getUTCDate() !== new Date(stats.lastBrush).getUTCDate();
    
    const newLog: BrushLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      duration: 120 - timer
    };

    setStats(prev => ({
      ...prev,
      streak: isNewDay ? prev.streak + 1 : prev.streak,
      lastBrush: now,
      history: [newLog, ...prev.history].slice(0, 20) // Keep last 20
    }));

    setTimer(120);
    setAiMessage("WOW! You actually did it. I'm almost proud of you. 🦷💎");
  };

  const startBrushing = () => setIsBrushing(true);
  const stopBrushing = () => setIsBrushing(false);
  const resetTimer = () => {
    setIsBrushing(false);
    setTimer(120);
  };

  const fetchNewReminder = async () => {
    setIsAiLoading(true);
    const msg = await generateBrushReminder(stats.streak);
    setAiMessage(msg);
    setIsAiLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto font-serif">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex justify-between items-center mb-12"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sage-dark rounded-full text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-normal tracking-tight text-sage-dark">BrushBuddy</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-text-muted hover:text-sage-dark transition-colors"
          >
            <History className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-sand shadow-sm">
            <Award className="w-4 h-4 text-earth-brown" />
            <span className="text-sm font-sans font-semibold text-text-main tracking-wide uppercase">{stats.streak}d Streak</span>
          </div>
        </div>
      </motion.header>

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col gap-10">
        
        {/* Timer Card */}
        <motion.div 
          layout
          className="bg-white rounded-[32px] p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-sand-muted relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Droplets className="w-40 h-40 text-sage-light" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <span className="text-xs font-sans font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Brushing Session</span>
            <div className="text-8xl md:text-9xl font-normal text-sage-dark tabular-nums mb-10 leading-none">
              {formatTime(timer)}
            </div>

            <div className="flex gap-6">
              {!isBrushing ? (
                <button 
                  onClick={startBrushing}
                  className="flex items-center gap-2 px-10 py-4 bg-earth-brown hover:bg-[#8d6745] text-white rounded-full font-sans text-sm font-bold transition-all shadow-lg shadow-earth-brown/20 active:scale-95 uppercase tracking-widest"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start
                </button>
              ) : (
                <button 
                  onClick={stopBrushing}
                  className="flex items-center gap-2 px-10 py-4 bg-sage-dark hover:bg-black/70 text-white rounded-full font-sans text-sm font-bold transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  Pause
                </button>
              )}
              
              <button 
                onClick={resetTimer}
                className="p-4 bg-cream hover:bg-sand/20 text-text-muted rounded-full border border-sand/50 transition-all"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5 text-sand" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* AI Reminder Box */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-sand-muted rounded-2xl p-8 flex gap-5 items-start shadow-sm"
        >
          <div className="p-3 bg-cream rounded-full text-earth-brown shrink-0 border border-sand/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-sans font-bold text-sage-dark uppercase tracking-widest">Bristle's Insight</span>
              <button 
                onClick={fetchNewReminder}
                disabled={isAiLoading}
                className="text-[10px] font-sans uppercase font-bold text-earth-brown hover:underline disabled:opacity-50"
              >
                {isAiLoading ? "Consulting..." : "Refresh Message"}
              </button>
            </div>
            <p className="text-text-main text-lg leading-relaxed italic opacity-90">
              "{aiMessage}"
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-sand-muted shadow-sm">
            <div className="flex items-center gap-2 text-text-muted mb-3">
              <Calendar className="w-4 h-4 text-sand" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest">Last Clean</span>
            </div>
            <div className="text-xl font-normal text-text-main">
              {stats.lastBrush ? new Date(stats.lastBrush).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-sand-muted shadow-sm">
            <div className="flex items-center gap-2 text-text-muted mb-3">
              <CheckCircle2 className="w-4 h-4 text-sand" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest">Total Logs</span>
            </div>
            <div className="text-xl font-normal text-text-main">
              {stats.history.length}
            </div>
          </div>
        </div>

        {/* History Modal Overlay */}
        <AnimatePresence>
          {showHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="absolute inset-0 bg-sage-dark/40 backdrop-blur-[2px]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-cream w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden relative z-10 border border-sand"
              >
                <div className="p-8 border-b border-sand/30 flex justify-between items-center bg-white">
                  <h3 className="text-2xl font-normal text-sage-dark">Session Logs</h3>
                  <button onClick={() => setShowHistory(false)} className="text-text-muted hover:text-earth-brown transition-colors">
                    <RotateCcw className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                  {stats.history.length === 0 ? (
                    <div className="text-center py-12 text-text-muted italic">
                      No sessions recorded yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {stats.history.map((log) => (
                        <div key={log.id} className="flex justify-between items-center p-5 bg-white rounded-xl border border-sand-muted">
                          <div>
                            <div className="font-normal text-text-main text-lg">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs font-sans text-text-muted uppercase tracking-wider">
                               {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                            </div>
                          </div>
                          <div className="text-sage-dark font-sans font-bold text-sm">
                            {formatTime(log.duration)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      <footer className="mt-16 text-center">
        <p className="text-[10px] text-text-muted font-sans font-bold uppercase tracking-[0.3em]">
          Refined care by Nature & AI
        </p>
      </footer>
    </div>
  );
}
