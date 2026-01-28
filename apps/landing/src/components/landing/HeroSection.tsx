"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandBarTicker } from "./CommandBarTicker";
import { ArrowRight, PlayCircle, Zap, ShieldCheck } from "lucide-react";
import { CosmicButton } from "./CosmicButton";
import { DemoVideoDialog } from "./DemoVideoDialog";
import { DashboardMockup } from "./DashboardMockup";

export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // 1. Scroll Bug Fix: Delayed opacity fade (starts fading at 600px, done by 900px)
  const opacity = useTransform(scrollY, [600, 900], [1, 0]);
  
  // 2. Holographic Parallax: Different speeds for different layers
  const rotateX = useTransform(scrollY, [0, 600], [20, 0]); 
  const scale = useTransform(scrollY, [0, 600], [0.9, 1]); // Tighter scale range
  const yBase = useTransform(scrollY, [0, 600], [0, 50]);   
  const yMid = useTransform(scrollY, [0, 600], [-30, -80]); 
  const yTop = useTransform(scrollY, [0, 600], [-60, -120]); 

  return (
    <section ref={containerRef} className="relative min-h-[140vh] flex flex-col items-center pt-32 overflow-hidden bg-white dark:bg-black perspective-2000">
      
      {/* --- Star-Gate Grid Floor (Subtler) --- */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden mix-blend-color-dodge">
          <div className="absolute w-[200%] h-[150%] left-[-50%] bottom-[-20%] bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] animate-grid-flow" 
               style={{ transform: "rotateX(80deg)" }}
          />
      </div>

      {/* --- Ambient Glow (Precision) --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[180px] rounded-full mix-blend-screen pointer-events-none z-0 opacity-60" />

      {/* --- Hero Content --- */}
      <div className="z-10 container px-4 sm:px-6 flex flex-col items-center text-center space-y-10 mb-24">
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge variant="outline" className="bg-black/5 dark:bg-white/[0.03] border-black/10 dark:border-white/[0.08] text-neutral-800 dark:text-primary-foreground/80 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-black/10 dark:hover:bg-white/[0.08] transition-colors cursor-default backdrop-blur-md">
            AI-Powered Call Audits
          </Badge>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <CommandBarTicker />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-neutral-900 dark:text-white max-w-6xl z-10"
        >
          Audit 100% of calls. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-500 dark:from-white dark:via-white dark:to-white/40">Zero human bias.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg md:text-xl text-neutral-600 dark:text-muted-foreground/80 max-w-2xl leading-relaxed z-10 font-light tracking-wide"
        >
          Deep diagnostics, fatal error detection, and actionable training insights at market-shattering speeds. The future of QA is automated.
        </motion.p>




        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4, duration: 0.8 }}
           className="flex flex-col sm:flex-row gap-6 items-center z-10"
        >
          <CosmicButton>
            <span className="flex items-center gap-2">
              Start Free Pilot
              <ArrowRight className="w-5 h-5" />
            </span>
          </CosmicButton>
          
          <DemoVideoDialog />
        </motion.div>
      </div>

      {/* --- Holographic Deconstruction (Crystal Monolith) --- */}
      <motion.div
        style={{ opacity, rotateX, scale }}
        className="relative mx-auto w-full max-w-[1200px] aspect-[16/9] perspective-2000 z-20 group px-4 md:px-0"
      >
        <div className="relative w-full h-full transform-style-3d">
            
            {/* LAYER 1: Base Glass Panel (Obsidian Glass) */}


            {/* LAYER 1: Base Glass Panel (Obsidian Glass) */}
            <motion.div 
                style={{ y: yBase }}
                className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-none"
            >
                 {/* Desktop View (Standard) */}
                 <div className="hidden md:block w-full h-full">
                    <DashboardMockup />
                 </div>

                 {/* Mobile View (Scaled Down Desktop Mockup) 
                     Renders at 250% size to force desktop layout, then scales down 0.4x to fit */}
                 <div className="md:hidden w-[250%] h-[250%] origin-top-left transform scale-[0.4]">
                    <DashboardMockup />
                 </div>
            </motion.div>

            {/* LAYER 2: Floating Data Cards (Crystal Pills) */}
            <motion.div 
                style={{ y: yMid }}
                className="absolute top-[20%] -right-16 w-80 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl p-5 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.8)] z-20 hidden md:block hover:border-black/10 dark:hover:border-white/20 transition-colors duration-300"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500 border border-red-500/20"><ShieldCheck className="w-5 h-5"/></div>
                    <div className="text-neutral-900 dark:text-white font-medium tracking-tight">Fatal Error Detected</div>
                </div>
                <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full mb-3 overflow-hidden">
                    <div className="bg-red-500 h-full w-2/3 rounded-full" />
                </div>
                <p className="text-xs text-neutral-500 dark:text-muted-foreground leading-relaxed">Agent missed mandatory verification disclosure in Step 3.</p>
            </motion.div>

            <motion.div 
                 style={{ y: yMid }}
                 className="absolute bottom-[20%] -left-16 w-72 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl p-5 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.8)] z-20 hidden md:block hover:border-black/10 dark:hover:border-white/20 transition-colors duration-300"
            >
                 <div className="flex justify-between items-end mb-3">
                     <span className="text-neutral-500 dark:text-muted-foreground text-sm font-medium">Audit Score</span>
                     <span className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tighter">98.5%</span>
                 </div>
                 <div className="flex gap-1.5 h-10 items-end">
                     {[20,30,40,35,50,45,60,55,70,65,80,75,90,85,100].map((h,i) => (
                         <div key={i} className="flex-1 bg-emerald-500 rounded-t-[1px]" style={{ height: `${h}%`, opacity: i/15 + 0.3 }} />
                     ))}
                 </div>
            </motion.div>

            {/* LAYER 3: Holographic Floating Pills (Luminous) */}
            <motion.div 
                style={{ y: yTop }}
                className="absolute -top-6 left-[40%] px-6 py-3 bg-white/80 dark:bg-[#0A0A0A] text-neutral-900 dark:text-white rounded-full shadow-lg dark:shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)] z-30 font-semibold border border-neutral-200 dark:border-white/[0.08] hidden md:flex items-center gap-3 backdrop-blur-2xl hover:scale-105 transition-transform duration-300"
            >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Live Analysis Active
            </motion.div>

        </div>
      </motion.div>

    </section>
  );
};
