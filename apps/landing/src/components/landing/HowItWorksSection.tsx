"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Database, Settings2, Play, BarChart3, TrendingUp } from "lucide-react";

const STEPS = [
    {
        title: "Connect Data Sources",
        description: "Upload call recordings + metadata, or integrate via API/SFTP.",
        icon: Database,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    },
    {
        title: "Configure Framework",
        description: "Set parameters, weights, fatal flags, and pass/fail logic.",
        icon: Settings2,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20"
    },
    {
        title: "Run Automations",
        description: "100% coverage or rule-based sampling. Automated queues by campaign.",
        icon: Play,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20"
    },
    {
        title: "Analyze Insights",
        description: "View defect trends, fatal incidents, and parameter-level breakdowns.",
        icon: BarChart3,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20"
    },
    {
        title: "Act & Improve",
        description: "Push TNIs to coaching, track closures, and monitor improvement trends.",
        icon: TrendingUp,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    }
];

export const HowItWorksSection = () => {
    return (
        <section className="py-24 container px-4 relative z-10">
            <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tighter">
                     From Chaos to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">Clarity.</span>
                 </h2>
                 <p className="text-lg text-neutral-600 dark:text-muted-foreground">
                     Five steps to full autonomous coverage.
                 </p>
            </div>

            <div className="max-w-5xl mx-auto relative">
                {/* Connecting Line */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neutral-200 dark:via-white/10 to-transparent md:-translate-x-1/2" />

                <div className="space-y-20">
                     {STEPS.map((step, i) => (
                         <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={cn(
                                "relative flex flex-col md:flex-row gap-12 items-center",
                                i % 2 === 0 ? "md:flex-row-reverse" : ""
                            )}
                         >
                             {/* Content Side */}
                             <div className={cn(
                                 "flex-1 pl-20 md:pl-0",
                                 i % 2 === 0 ? "md:text-left" : "md:text-right"
                             )}>
                                 <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">{step.title}</h3>
                                 <p className="text-neutral-600 dark:text-muted-foreground text-base leading-relaxed">{step.description}</p>
                             </div>

                             {/* Center Node */}
                             <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-4 h-4 rounded-full bg-white dark:bg-black border-2 border-neutral-300 dark:border-white/20 shadow-sm dark:shadow-[0_0_10px_rgba(255,255,255,0.2)] z-10">
                                 <div className={cn("w-2 h-2 rounded-full", step.bg.replace('/10', ''))} />
                             </div>

                             {/* Icon Side */}
                             <div className="flex-1 pl-20 md:pl-0 hidden md:flex justify-center">
                                 <div className={cn(
                                     "w-20 h-20 rounded-2xl flex items-center justify-center border bg-white dark:bg-black/50 backdrop-blur-md shadow-lg dark:shadow-2xl transition-transform duration-300 hover:scale-105",
                                     step.border,
                                     step.color
                                 )}>
                                     <step.icon className="w-8 h-8" />
                                 </div>
                             </div>
                         </motion.div>
                     ))}
                </div>
            </div>
        </section>
    );
};
