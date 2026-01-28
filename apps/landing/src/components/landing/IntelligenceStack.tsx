"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BrainCircuit, ShieldCheck } from "lucide-react";

export const IntelligenceStack = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    // Default viewing angle
    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["25deg", "-5deg"]); // Tilted up slightly by default
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-25deg", "25deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative w-full h-full bg-neutral-900 dark:bg-[#080808] border border-neutral-800 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center perspective-[1200px] group/container"
        >
             {/* --- HOLOGRAPHIC CHAMBER ENVIRONMENT --- */}
             
             {/* 1. Volumetric Light Beam */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
             
             {/* 2. Perimeter Grid (Walls) */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(circle_at_center,transparent_20%,black_100%)] opacity-20" />

             {/* 3. Tech Corners */}
             <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
             <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
             <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
             <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-lg" />

             {/* 4. Status Indicators */}
             <div className="absolute top-8 left-16 flex gap-2">
                 <div className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400">SYS_ONLINE</div>
                 <div className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400 animate-pulse">MONITORING</div>
             </div>


             {/* --- LAYER 1: AUDIO FOUNDATION (BACK & TOP) --- */}
             <motion.div 
                style={{ translateZ: -60, translateY: -80, rotateX: "10deg" }}
                className="absolute w-64 h-64 border border-white/5 rounded-3xl bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-colors duration-500 hover:border-indigo-500/30 group/l1"
             >
                 {/* Connection Line Down */}
                 <div className="absolute top-full left-1/2 w-[1px] h-24 bg-gradient-to-b from-indigo-500/50 to-transparent -translate-x-1/2 origin-top rotate-x-45" />

                 <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="flex gap-1 items-end h-16">
                          {[...Array(16)].map((_, i) => (
                              <motion.div 
                                key={i}
                                animate={{ height: [10, 50, 15] }}
                                transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                                className="w-2 bg-indigo-500 rounded-full"
                              />
                          ))}
                      </div>
                 </div>
                 <div className="absolute top-3 left-5 text-[10px] font-mono text-white/30 group-hover/l1:text-indigo-400 transition-colors">Input L1 // RAW_AUDIO</div>
             </motion.div>

             {/* --- LAYER 2: INTELLIGENCE ENGINE (MIDDLE) --- */}
             <motion.div 
                style={{ translateZ: 20, translateY: 0 }}
                className="absolute w-56 h-56 border border-indigo-500/30 rounded-3xl bg-indigo-950/10 backdrop-blur-md flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-10"
             >
                  {/* Orbiting Satellites */}
                  <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,1)] -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,1)] -translate-x-1/2 translate-y-1/2" />
                  </div>
                  <div className="absolute inset-0 animate-[spin_12s_linear_infinite_reverse] w-[130%] h-[130%] -left-[15%] -top-[15%] border border-dashed border-white/5 rounded-full" />

                  {/* Neural Grid */}
                  <div className="absolute inset-0 grid grid-cols-4 gap-4 p-8 opacity-50">
                      {[...Array(16)].map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                  </div>
                  {/* Central Processor */}
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] relative backdrop-blur-sm">
                       <BrainCircuit className="w-8 h-8 text-indigo-300" />
                  </div>
                  <div className="absolute bottom-3 right-5 text-[10px] font-mono text-indigo-300">Analysis L2 // NEURAL</div>
             </motion.div>

             {/* --- LAYER 3: VERIFIED ASSURANCE (FRONT & BOTTOM) --- */}
             <motion.div 
                style={{ translateZ: 100, translateY: 80, rotateX: "-10deg" }}
                className="absolute w-48 h-48 border border-emerald-500/30 rounded-3xl bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_20px_80px_rgba(0,0,0,0.8)] z-20"
             >
                  {/* Connection Line Up */}
                  <div className="absolute bottom-full left-1/2 w-[1px] h-24 bg-gradient-to-t from-emerald-500/50 to-transparent -translate-x-1/2 origin-bottom rotate-x-45" />

                  <div className="bg-emerald-500/20 p-4 rounded-full mb-3 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                       <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white tracking-widest uppercase">Verified</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-1">100% COVERAGE</div>
                  
                  <div className="absolute -inset-[1px] border border-emerald-500/20 rounded-3xl" />
                  <div className="absolute bottom-3 left-0 right-0 text-center text-[9px] font-mono text-emerald-500/50">Output L3 // AUDIT_LOG</div>
             </motion.div>
             
        </motion.div>
    );
};
