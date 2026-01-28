"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Check, ShieldCheck, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRICING_SLABS = [
  { limit: 10000, price: 10, label: "Starter", color: "text-blue-400" },
  { limit: 25000, price: 8, label: "Growth", color: "text-indigo-400" },
  { limit: 50000, price: 6, label: "Scale", color: "text-purple-400" },
  { limit: 75000, price: 4, label: "Pro", color: "text-violet-400" },
  { limit: 100000, price: 3, label: "Enterprise", color: "text-rose-400" },
  { limit: Infinity, price: 2, label: "Custom", color: "text-emerald-400" },
];

export const PricingSection = () => {
    const [volume, setVolume] = useState([15000]);
    const maxVolume = 500000;
  
    // Find active slab
    let activeSlab = PRICING_SLABS[0];
    for (let i = 0; i < PRICING_SLABS.length; i++) {
        if (volume[0] <= PRICING_SLABS[i].limit) {
            activeSlab = PRICING_SLABS[i];
            break;
        }
        if (i === PRICING_SLABS.length - 1) activeSlab = PRICING_SLABS[i];
    }
  
    const monthlyCost = volume[0] * activeSlab.price;
    const manualCost = volume[0] * 25; // Assuming ₹25 per manual audit
    const savings = manualCost - monthlyCost;

    return (
        <section className="py-32 container px-4 relative z-10 bg-white dark:bg-black overflow-hidden">
             
             {/* Section Header */}
             <div className="text-center mb-24 relative z-10">
                 <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white tracking-tighter mb-4">
                     Pay <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">Less</span> As You Scale.
                 </h2>
                 <p className="text-neutral-600 dark:text-muted-foreground/80 text-lg">
                     Transparent volume-based pricing. No hidden fees.
                 </p>
             </div>

             <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                 
                 {/* LEFT: Holographic Calculator Control */}
                 <div className="lg:col-span-7 bg-white dark:bg-[#080808] border border-neutral-200 dark:border-white/[0.08] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-xl dark:shadow-2xl group">
                     {/* Background Grid */}
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/40 dark:from-indigo-900/20 via-transparent to-transparent opacity-40 pointer-events-none" />
                     
                     <div className="relative z-10">
                         <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-8 flex items-center gap-2">
                             <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                             Estimate Your Cost
                         </h3>
                         
                         {/* Slider Area */}
                         <div className="mb-10">
                             <div className="flex justify-between items-end mb-6">
                                 <div className="text-neutral-500 dark:text-muted-foreground text-xs uppercase tracking-wider font-semibold">Monthly Call Volume</div>
                                 <div className="text-5xl font-bold text-neutral-900 dark:text-white tracking-tighter tabular-nums">
                                     {volume[0].toLocaleString()}
                                 </div>
                             </div>
                             
                             <div className="relative h-10 flex items-center group-hover:scale-[1.01] transition-transform duration-300">
                                 {/* Custom Track Background */}
                                 <div className="absolute w-full h-3 bg-neutral-100 dark:bg-white/[0.05] rounded-full overflow-hidden border border-neutral-200 dark:border-white/[0.05]">
                                     {/* Progress Fill */}
                                     <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-100 ease-out"
                                        style={{ width: `${(volume[0] / maxVolume) * 100}%` }}
                                     />
                                 </div>
                                 
                                 <Slider 
                                     value={volume}
                                     onValueChange={setVolume}
                                     max={maxVolume}
                                     step={1000}
                                     className="relative z-10 cursor-pointer"
                                 />
                             </div>
                             
                             <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-3 font-mono">
                                 <span>0</span>
                                 <span>100K</span>
                                 <span>250K</span>
                                 <span>500K</span>
                             </div>
                         </div>
                     </div>

                     {/* Active Plan Badge (Integrated) */}
                     <div className="mt-auto pt-8 border-t border-neutral-200 dark:border-white/[0.05]">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                 <div className={`p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 ${activeSlab.color}`}>
                                     <ShieldCheck className="w-6 h-6" />
                                 </div>
                                 <div>
                                     <div className={`text-lg font-bold tracking-tight ${activeSlab.color}`}>{activeSlab.label} Plan</div>
                                     <div className="text-neutral-500 dark:text-muted-foreground text-xs">Unlocked at {activeSlab.limit.toLocaleString()} calls</div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <div className="text-3xl font-bold text-neutral-900 dark:text-white font-mono tracking-tight">₹{activeSlab.price}</div>
                                 <div className="text-neutral-400 dark:text-muted-foreground text-[10px] uppercase font-bold tracking-wider opacity-60">Per Call</div>
                             </div>
                        </div>
                     </div>
                 </div>

                 {/* RIGHT: The "ROI Crystal" */}
                 <div className="lg:col-span-5 flex flex-col gap-6">
                     
                     {/* Cost Card */}
                     <div className="flex-1 bg-gradient-to-bl from-neutral-900 to-black dark:from-[#0A0A0A] dark:to-[#050505] border border-neutral-800 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-neutral-700 dark:hover:border-white/20 transition-colors">
                         
                         <div className="relative z-10 flex flex-col h-full justify-between">
                             <div>
                                 <div className="text-xs text-neutral-400 dark:text-muted-foreground uppercase tracking-wider font-semibold mb-2">Estimated Monthly Cost</div>
                                 <div className="flex items-baseline gap-2">
                                     <span className="text-5xl lg:text-6xl font-bold text-white tracking-tighter">
                                         ₹{monthlyCost.toLocaleString()}
                                     </span>
                                     <span className="text-neutral-400 dark:text-muted-foreground/60 text-lg font-light">/mo</span>
                                 </div>
                             </div>

                             <Button className="w-full mt-8 h-12 bg-white text-black hover:bg-white/90 text-base font-bold rounded-lg shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition-all transform active:scale-95">
                                 Start Free Pilot
                             </Button>
                         </div>
                     </div>

                     {/* Savings Visualizer (Refined) */}
                     <div className="h-40 bg-white dark:bg-[#080808] border border-neutral-200 dark:border-white/[0.08] rounded-3xl p-6 relative overflow-hidden flex items-center justify-between group shadow-sm dark:shadow-none">
                         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
                         
                         {/* Stats Text */}
                         <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-1 text-emerald-500 dark:text-emerald-400">
                                  <Zap className="w-4 h-4 fill-current" />
                                  <span className="font-bold text-xs uppercase tracking-wider">You Save</span>
                              </div>
                              <div className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">₹{savings.toLocaleString()}</div>
                              <div className="text-[10px] text-neutral-500 dark:text-muted-foreground/60 mt-1">per month vs manual</div>
                         </div>

                         {/* Side-by-Side Bars */}
                         <div className="h-24 flex items-end gap-3 z-10">
                               {/* Manual Bar */}
                               <div className="w-12 h-full flex flex-col justify-end group/bar">
                                   <div className="w-full bg-neutral-200 dark:bg-white/10 rounded-t-sm relative overflow-hidden hover:bg-neutral-300 dark:hover:bg-white/20 transition-colors" style={{ height: '100%' }}></div>
                                   <span className="text-[10px] text-neutral-500 dark:text-muted-foreground text-center mt-2 font-mono">Manual</span>
                               </div>
                               
                               {/* AI Bar */}
                               <div className="w-12 h-full flex flex-col justify-end group/bar">
                                   <motion.div 
                                      className="w-full bg-emerald-500 rounded-t-sm relative shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                      initial={false}
                                      animate={{ height: `${Math.max((monthlyCost / manualCost) * 100, 5)}%` }} // Min height 5%
                                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                   />
                                   <span className="text-[10px] text-emerald-500 text-center mt-2 font-bold font-mono">AI</span>
                               </div>
                         </div>

                     </div>

                 </div>

             </div>
        </section>
    );
};
