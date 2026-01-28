"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
    Layers, 
    Zap, 
    Search,
    BrainCircuit,
    ArrowUpRight,
    Terminal,
    ScanLine,
    Activity
} from "lucide-react";
import { useState, useEffect } from "react";

// --- Sub-Components for Holographic Visuals ---

const ScannerVisual = () => {
    // Generate some random "nodes" for the map visualization
    const nodes = Array.from({ length: 20 }).map((_, i) => ({
        top: `${Math.random() * 80 + 10}%`,
        left: `${Math.random() * 80 + 10}%`,
        delay: Math.random() * 2
    }));

    return (
        <div className="absolute inset-0 overflow-hidden">
             {/* Map Background grid */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
             
             {/* Active Nodes (Data Points) */}
             {nodes.map((node, i) => (
                 <motion.div 
                    key={i}
                    style={{ top: node.top, left: node.left }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: node.delay }}
                    className="absolute w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_2px_rgba(99,102,241,0.5)] z-0"
                 />
             ))}

             {/* Scanning Beam */}
             <div className="absolute inset-0 z-10 pointer-events-none">
                 <motion.div 
                    className="absolute inset-y-0 w-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-[2px] shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                    animate={{ left: ["0%", "100%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 />
                 {/* Trailing fade */}
                 <motion.div 
                    className="absolute inset-y-0 w-40 bg-gradient-to-l from-indigo-500/10 to-transparent"
                    animate={{ left: ["-10%", "90%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 />
             </div>
        </div>
    );
};

const TerminalVisual = () => {
    const [logs, setLogs] = useState([
        "> Init Diagnostic Protocol...",
        "> Scanning Audio Stream...",
        "> Detected: Missed Greeting",
        "> Analyzing Sentiment...",
        "> FATAL ERROR: DNC Violation",
        "> Flagging for Review...",
        "> Protocol Complete."
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLogs(prev => [...prev.slice(1), prev[0]]);
        }, 1200); // Slower for readability
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute top-0 right-0 bottom-0 w-full md:w-3/5 p-6 font-mono text-xs text-neutral-500/80 dark:text-muted-foreground/60 flex flex-col justify-center overflow-hidden pointer-events-none mask-linear-fade-left opacity-25 md:opacity-100 transition-opacity">
            {logs.map((log, i) => (
                <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                        "mb-2 truncate", 
                        log.includes("FATAL") ? "text-red-500/90 font-bold" : 
                        log.includes("Detected") ? "text-amber-500/80" : ""
                    )}
                >
                    {log}
                </motion.div>
            ))}
        </div>
    );
};

const PulseVisual = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center -translate-y-4">
            <svg viewBox="0 0 100 50" className="w-full h-2/3 stroke-emerald-500/50 fill-none stroke-[2] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <path d="M0 25 H 10 L 15 5 L 20 45 L 25 25 H 40 L 45 10 L 50 40 L 55 25 H 70 L 75 15 L 80 35 L 85 25 H 100" />
            </svg>
            <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white dark:from-[#0A0A0A] dark:via-transparent dark:to-[#0A0A0A]"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
};


// --- Main Bento Grid ---

const FeatureCard = ({ className, children, visuals, noPadding = false }: { className?: string; children: React.ReactNode; visuals?: React.ReactNode; noPadding?: boolean }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className={cn(
            "relative group overflow-hidden rounded-3xl bg-white dark:bg-[#080808] border border-neutral-200 dark:border-white/[0.08] hover:border-black/5 dark:hover:border-white/[0.15] transition-all duration-500 shadow-sm dark:shadow-2xl",
            className
        )}
    >
        <div className="absolute inset-0 z-0">{visuals}</div>
        
        {/* Content Overlay */}
        <div className={cn(
            "relative z-10 w-full h-full flex flex-col justify-between", 
            noPadding ? "" : "p-8",
            visuals ? "bg-gradient-to-b from-white/90 via-white/60 to-white/90 dark:from-[#0A0A0A]/90 dark:via-[#0A0A0A]/60 dark:to-[#0A0A0A]/90" : ""
        )}>
            {children}
        </div>

        {/* Highlight Borders */}
        <div className="absolute inset-0 border border-black/5 dark:border-white/[0.05] rounded-3xl pointer-events-none" />
    </motion.div>
);

export const FeaturesSection = () => {
    return (
        <section className="relative py-32 z-10 bg-white dark:bg-black">
            <div className="container px-4 sm:px-6">
            
            {/* Section Header */}
            <div className="text-center mb-24 max-w-3xl mx-auto space-y-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/[0.05] border border-indigo-500/[0.1] text-xs font-medium text-indigo-300 mb-4"
                >
                    <ScanLine className="w-3 h-3" />
                    <span>Holographic Analysis Engine</span>
                </motion.div>
                
                <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white tracking-tighter">
                    Designed for <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-800 to-neutral-400 dark:from-white dark:to-white/50">100% Visibility.</span>
                </h2>
                
                <p className="text-lg text-neutral-600 dark:text-muted-foreground/90 font-light max-w-xl mx-auto">
                    Stop guessing. Deploy an autonomous observation layer across your entire operation.
                </p>
            </div>

            {/* Holographic Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[650px] mb-6">
                
                {/* 1. The Scanner (Coverage) - 6x6 */}
                <FeatureCard className="md:col-span-8 md:row-span-4" visuals={<ScannerVisual />}>
                    <div className="flex items-start justify-between">
                         <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 backdrop-blur-md">
                             <Layers className="w-6 h-6" />
                         </div>
                         
                         {/* Live Counter Badge */}
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-xs font-mono text-white dark:text-white/80">LIVE MONITORING</span>
                         </div>
                    </div>
                    <div className="mt-auto">
                        <h3 className="text-3xl font-semibold text-neutral-900 dark:text-white mb-2">Omniscient Coverage</h3>
                        <p className="text-neutral-600 dark:text-muted-foreground text-sm max-w-md leading-relaxed">
                            Replace random sampling with absolute certainty. AssureQAi audits 100% of calls, detecting every misstep and compliance risk in real-time.
                        </p>
                    </div>
                </FeatureCard>

                {/* 2. The Pulse (Speed) - 2x3 */}
                <FeatureCard className="md:col-span-4 md:row-span-2" visuals={<PulseVisual />}>
                    <div className="flex items-start justify-between">
                         <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 backdrop-blur-md">
                             <Zap className="w-6 h-6" />
                         </div>
                    </div>
                    <div className="mt-auto">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Zero Latency</h3>
                        <p className="text-neutral-600 dark:text-muted-foreground text-xs">
                           Insights delivered in milliseconds.
                        </p>
                    </div>
                </FeatureCard>

                {/* 3. The Terminal (Diagnostics) - 4x3 */}
                <FeatureCard className="md:col-span-4 md:row-span-2" visuals={<TerminalVisual />}>
                    <div className="flex items-start justify-between relative z-20">
                         <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 backdrop-blur-md">
                             <Terminal className="w-6 h-6" />
                         </div>
                    </div>
                    <div className="mt-auto relative z-20 max-w-[60%]">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Deep Diagnostics</h3>
                        <p className="text-neutral-600 dark:text-muted-foreground text-xs leading-relaxed">
                             Fatal error detection & Root Cause Analysis.
                        </p>
                    </div>
                </FeatureCard>
                
            </div>
            
            {/* Bottom Row - Redesigned Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                 <FeatureCard className="group hover:bg-white/[0.02]" noPadding>
                     <div className="p-6 flex flex-col h-full justify-between">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 shrink-0">
                                 <BrainCircuit className="w-5 h-5" />
                             </div>
                             <span className="text-lg font-medium text-neutral-900 dark:text-white">Smart TNIs</span>
                        </div>
                         <p className="text-neutral-600 dark:text-muted-foreground/70 text-sm leading-relaxed mb-4">
                            Auto-correlate defects to customized training needs.
                        </p>
                        <div className="w-full h-1 bg-neutral-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-purple-500" 
                                initial={{ width: "0%" }}
                                whileInView={{ width: "70%" }}
                                transition={{ duration: 1.5 }}
                            />
                        </div>
                     </div>
                 </FeatureCard>

                 <FeatureCard className="group hover:bg-white/[0.02]" noPadding>
                    <div className="p-6 flex flex-col h-full justify-between">
                         <div className="flex items-center gap-4 mb-4">
                             <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400 shrink-0">
                                 <Activity className="w-5 h-5" />
                             </div>
                             <span className="text-lg font-medium text-neutral-900 dark:text-white">Sentiment AI</span>
                         </div>
                         <p className="text-neutral-600 dark:text-muted-foreground/70 text-sm leading-relaxed mb-4">
                            Track customer emotion shifts call-by-call.
                        </p>
                        {/* Fake Waveform */}
                        <div className="flex items-end gap-1 h-4">
                            {[40, 70, 30, 80, 50, 90, 40, 60, 30, 70].map((h, i) => (
                                <div key={i} className="flex-1 bg-orange-500/40 rounded-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                     </div>
                 </FeatureCard>

                 <FeatureCard className="group hover:bg-white/[0.02]" noPadding>
                     <div className="p-6 flex flex-col h-full justify-between">
                         <div className="flex justify-between items-start mb-2">
                             <div className="text-sm text-muted-foreground font-medium">ROI Calculator</div>
                             <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] rounded uppercase font-bold tracking-wider">
                                 Verified
                             </div>
                         </div>
                         <div className="flex items-baseline gap-1">
                             <span className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tighter">₹2</span>
                             <span className="text-sm text-muted-foreground uppercase">/ Call</span>
                         </div>
                         <p className="text-neutral-500 dark:text-muted-foreground/50 text-xs mt-2">
                             Significantly lower than manual audit costs.
                         </p>
                     </div>
                 </FeatureCard>

            </div>

            </div>
        </section>
    );
};
