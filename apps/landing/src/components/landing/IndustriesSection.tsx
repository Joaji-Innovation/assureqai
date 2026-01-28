"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Users, Shuffle, ShieldCheck, Landmark, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
    {
        id: "collections",
        title: "Collections & Recovery",
        icon: Phone,
        desc: "Automate compliance for high-stakes debt recovery calls.",
        checks: ["Miscommitment Detection", "Mini-Miranda Rights", "Abusive Language Flagging", "Payment Plan Verification"],
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-blue-500/0",
        border: "border-blue-500/20"
    },
    {
        id: "support",
        title: "Customer Support",
        icon: Users,
        desc: "Ensure every agent sounds like your best agent.",
        checks: ["Greeting & Closing Variance", "Empathy Scoring", "Hold Time Violations", "First Call Resolution Indicators"],
        color: "text-emerald-400",
        gradient: "from-emerald-500/20 to-emerald-500/0",
        border: "border-emerald-500/20"
    },
    {
        id: "sales",
        title: "Sales & Marketing",
        icon: Shuffle,
        desc: "Increase conversion by auditing pitch adherence.",
        checks: ["Rebuttal Effectiveness", "Pitch Accuracy", "Pricing Disclosure", "Buying Signal Identification"],
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-orange-500/0",
        border: "border-orange-500/20"
    },
    {
        id: "verification",
        title: "Tele-Verification",
        icon: ShieldCheck,
        desc: "Zero-tolerance audits for mandatory disclosures.",
        checks: ["PII Validation", "Mandatory Script Read", "Consent Recording", "Fraud Signal Detection"],
        color: "text-purple-400",
        gradient: "from-purple-500/20 to-purple-500/0",
        border: "border-purple-500/20"
    },
    {
        id: "bfsi",
        title: "BFSI (Banking)",
        icon: Landmark,
        desc: "Strict regulatory adherence for financial services.",
        checks: ["Risk Disclaimer Read", "Interest Rate Transparency", "Grievance Redressal Info", "Data Privacy Scripts"],
        color: "text-rose-400",
        gradient: "from-rose-500/20 to-rose-500/0",
        border: "border-rose-500/20"
    }
];

export const IndustriesSection = () => {
    const [activeId, setActiveId] = useState(INDUSTRIES[0].id);
    const activeIndustry = INDUSTRIES.find(i => i.id === activeId) || INDUSTRIES[0];

    return (
        <section className="py-32 container px-4 relative z-10">
            <div className="text-center mb-20 max-w-3xl mx-auto">
                 <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tighter">
                     Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">High Compliance.</span>
                 </h2>
                 <p className="text-neutral-600 dark:text-muted-foreground text-lg">
                     Don&apos;t settle for generic QA. Toggle to see how we handle your specific regulated workflows.
                 </p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                 
                 {/* LEFT: Sector Menu */}
                 <div className="lg:col-span-5 flex flex-col gap-3">
                     {INDUSTRIES.map((ind) => (
                         <button
                            key={ind.id}
                            onClick={() => setActiveId(ind.id)}
                            className={cn(
                                "group relative p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden",
                                activeId === ind.id 
                                    ? "bg-neutral-100 dark:bg-white/[0.08] border-neutral-300 dark:border-white/20 shadow-lg" 
                                    : "bg-white dark:bg-[#0A0A0A] border-neutral-200 dark:border-white/[0.05] hover:border-neutral-300 dark:hover:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
                            )}
                         >
                             {/* Active Indicator */}
                             {activeId === ind.id && (
                                 <motion.div 
                                    layoutId="activeGlow"
                                    className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-current to-transparent opacity-80", ind.color)}
                                 />
                             )}
                             
                             <div className="flex items-center gap-4 relative z-10">
                                 <div className={cn(
                                     "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                     activeId === ind.id ? "bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white" : "bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-muted-foreground group-hover:text-neutral-900 dark:group-hover:text-white"
                                 )}>
                                     <ind.icon className="w-5 h-5" />
                                 </div>
                                 <span className={cn(
                                     "text-lg font-medium transition-colors",
                                     activeId === ind.id ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-muted-foreground group-hover:text-neutral-900 dark:group-hover:text-white"
                                 )}>
                                     {ind.title}
                                 </span>
                                 
                                 {activeId === ind.id && (
                                     <motion.div 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        className="ml-auto"
                                     >
                                        <ArrowRight className="w-5 h-5 text-neutral-900/50 dark:text-white/50" />
                                     </motion.div>
                                 )}
                             </div>
                         </button>
                     ))}
                 </div>

                 {/* RIGHT: Holographic Projection */}
                 <div className="lg:col-span-7 relative">
                     <AnimatePresence mode="wait">
                         <motion.div
                            key={activeId}
                            initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="h-full min-h-[600px] rounded-3xl bg-white dark:bg-[#080808] border border-neutral-200 dark:border-white/10 overflow-hidden relative flex flex-col p-10 shadow-xl dark:shadow-2xl group"
                         >
                             {/* Background Gradient & Grid */}
                             <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 pointer-events-none transition-colors duration-500", activeIndustry.gradient)} />
                             <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 dark:opacity-20 pointer-events-none mix-blend-overlay" />
                             
                             {/* Floating Particles/Glow */}
                             <div className={cn("absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-black/5 dark:from-white/5 to-transparent blur-[80px] rounded-full pointer-events-none", activeIndustry.color)} />

                             {/* Content Header */}
                             <div className="relative z-10 mb-10">
                                 <div className="flex justify-between items-start mb-6">
                                     <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-neutral-100 dark:bg-white/5 backdrop-blur-md", activeIndustry.color, activeIndustry.border)}>
                                         <activeIndustry.icon className="w-4 h-4" />
                                         <span className="text-xs font-bold uppercase tracking-wider">{activeIndustry.title} Protocol</span>
                                     </div>
                                     <div className="flex gap-1">
                                         {[...Array(3)].map((_, i) => (
                                             <div key={i} className={cn("w-1.5 h-1.5 rounded-full animate-pulse", activeIndustry.color.replace('text-', 'bg-').replace('-400', '-500/50'))} style={{ animationDelay: `${i * 200}ms` }} />
                                         ))}
                                     </div>
                                 </div>
                                 <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight">{activeIndustry.desc}</h3>
                             </div>

                             {/* Checklist Visualization */}
                             <div className="flex-1 space-y-4 relative z-10">
                                 <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-6 border-b border-white/10 pb-2 inline-block">
                                     {/* Mandatory Audit Parameters */}
                                 </p>
                                 
                                 <div className="grid grid-cols-1 gap-4">
                                     {activeIndustry.checks.map((check, i) => (
                                         <motion.div 
                                            key={check}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 + 0.2 }}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/[0.05] hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors group/item"
                                         >
                                             <div className={cn("p-1.5 rounded-full bg-neutral-200 dark:bg-white/5 group-hover/item:bg-neutral-200 dark:group-hover/item:bg-white/10 transition-colors", activeIndustry.color)}>
                                                 <CheckCircle2 className="w-5 h-5" />
                                             </div>
                                             <span className="text-neutral-700 dark:text-white/90 font-light text-lg">{check}</span>
                                             
                                             {/* Tech decoration on hover */}
                                             <div className="ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity text-[10px] font-mono text-muted-foreground">
                                                 REQ-0{i+1}
                                             </div>
                                         </motion.div>
                                     ))}
                                 </div>
                             </div>

                             {/* Footer Status */}
                             <div className="mt-auto pt-8 border-t border-neutral-200 dark:border-white/5 flex justify-between items-center text-[10px] font-mono text-neutral-500 dark:text-muted-foreground uppercase tracking-wider relative z-10">
                                 <div>
                                     Status: <span className={cn("font-bold", activeIndustry.color)}>Active Monitoring</span>
                                 </div>
                                 <div>
                                     Protocol v2.4.0
                                 </div>
                             </div>

                             {/* Decorative Scanner Line */}
                             <motion.div 
                                 className={cn("absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-30 shadow-[0_0_15px_rgba(255,255,255,0.5)] z-20 pointer-events-none", activeIndustry.color)}
                                 animate={{ top: ["0%", "100%"] }}
                                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                             />
                         </motion.div>
                     </AnimatePresence>
                 </div>

            </div>
        </section>
    );
};
