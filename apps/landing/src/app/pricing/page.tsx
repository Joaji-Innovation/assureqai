"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { CTASection } from "@/components/landing/CTASection";
import { Check, ShieldCheck, Zap, X, Minus, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CosmicButton } from "@/components/landing/CosmicButton";

const PRICING_SLABS = [
  { limit: 10000, price: 10, label: "Starter", color: "text-blue-400" },
  { limit: 25000, price: 8, label: "Growth", color: "text-indigo-400" },
  { limit: 50000, price: 6, label: "Scale", color: "text-purple-400" },
  { limit: 75000, price: 4, label: "Pro", color: "text-violet-400" },
  { limit: 100000, price: 3, label: "Enterprise", color: "text-rose-400" },
  { limit: Infinity, price: 2, label: "Custom", color: "text-emerald-400" },
];

const PLANS = [
  {
    name: "Starter",
    price: "₹10",
    unit: "/call",
    desc: "For pilots and small teams (up to 10K calls).",
    color: "blue",
    features: [
      { name: "Up to 10,000 calls/mo", included: true },
      { name: "Standard Checklists", included: true },
      { name: "Basic Transcription", included: true },
      { name: "Email Support", included: true },
      { name: "API Access", included: false },
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Scale",
    price: "₹6",
    unit: "/call",
    desc: "Full coverage for growing teams (25K-50K calls).",
    color: "indigo",
    features: [
      { name: "25,000 - 50,000 calls/mo", included: true },
      { name: "Advanced Sentiment", included: true },
      { name: "Unlimited Checklists", included: true },
      { name: "Priority Support", included: true },
      { name: "API Access", included: true },
    ],
    cta: "Get Started",
    popular: true
  },
  {
    name: "Volume",
    price: "₹2",
    unit: "/call",
    desc: "Maximum efficiency for large scale (100k+ calls).",
    color: "emerald",
    features: [
      { name: "100,000+ calls/mo", included: true },
      { name: "Dedicated Infrastructure", included: true },
      { name: "Custom SLA Guarantees", included: true },
      { name: "24/7 Priority Support", included: true },
      { name: "API Access", included: true },
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function PricingPage() {
  const [volume, setVolume] = useState([15000]);
  const maxVolume = 500000;

  // Logic from PricingSection
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
    <Spotlight className="min-h-screen bg-white dark:bg-black selection:bg-primary/20">
      <Navbar />
      
      <main className="pt-32 pb-16">
        
        {/* --- Hero --- */}
        <section className="text-center px-4 mb-24">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-6"
            >
                Transparent Scale. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Zero Surprises.</span>
            </motion.h1>
            <p className="text-xl text-neutral-600 dark:text-muted-foreground max-w-2xl mx-auto">
                Pricing that adapts to your volume. Start small, scale indefinitely.
            </p>
        </section>

        {/* --- The Holographic Calculator (Ported from Home) --- */}
        <section className="mb-32 container px-4 max-w-6xl mx-auto">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                 
                 {/* Calculator Control */}
                 <div className="lg:col-span-7 bg-white dark:bg-[#080808] border border-neutral-200 dark:border-white/[0.08] rounded-3xl p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden shadow-xl dark:shadow-2xl group">
                     {/* Background Grid */}
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent dark:from-indigo-900/20 dark:via-transparent dark:to-transparent opacity-40 pointer-events-none" />
                     
                     <div className="relative z-10">
                         <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8 flex items-center gap-3">
                             <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                             Volume Estimator
                         </h3>
                         
                         {/* Slider Area */}
                         <div className="mb-12">
                             <div className="flex justify-between items-end mb-8">
                                 <div className="text-neutral-500 dark:text-muted-foreground text-sm uppercase tracking-wider font-semibold">Monthly Calls</div>
                                 <div className="text-6xl font-bold text-neutral-900 dark:text-white tracking-tighter tabular-nums">
                                     {volume[0].toLocaleString()}
                                 </div>
                             </div>
                             
                             <div className="relative h-12 flex items-center group-hover:scale-[1.01] transition-transform duration-300">
                                 {/* Custom Track Background */}
                                 <div className="absolute w-full h-4 bg-neutral-100 dark:bg-white/[0.05] rounded-full overflow-hidden border border-neutral-200 dark:border-white/[0.05]">
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
                             
                             <div className="flex justify-between text-xs text-muted-foreground/60 mt-4 font-mono">
                                 <span>1K</span>
                                 <span>500K+</span>
                             </div>
                         </div>
                     </div>

                     {/* Active Plan Badge */}
                     <div className="mt-auto pt-8 border-t border-neutral-200 dark:border-white/[0.05]">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                 <div className={cn("p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white", activeSlab.color)}>
                                     <ShieldCheck className="w-6 h-6" />
                                 </div>
                                 <div>
                                     <div className={cn("text-lg font-bold tracking-tight", activeSlab.color)}>{activeSlab.label} Plan</div>
                                     <div className="text-muted-foreground text-xs">Dynamic pricing active</div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <div className="text-3xl font-bold text-neutral-900 dark:text-white font-mono tracking-tight">₹{activeSlab.price}</div>
                                 <div className="text-neutral-500 dark:text-muted-foreground text-[10px] uppercase font-bold tracking-wider opacity-60">Per Call</div>
                             </div>
                        </div>
                     </div>
                 </div>

                 {/* The ROI Panel */}
                 <div className="lg:col-span-5 flex flex-col gap-6">
                     
                     {/* Cost Card */}
                     <div className="flex-1 bg-white dark:bg-gradient-to-bl dark:from-[#0F0F0F] dark:to-black border border-neutral-200 dark:border-white/10 rounded-3xl p-10 relative overflow-hidden group hover:border-neutral-300 dark:hover:border-white/20 transition-all duration-500 shadow-xl dark:shadow-none">
                         <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                         
                         <div className="relative z-10 flex flex-col h-full justify-between">
                             <div>
                                 <div className="text-xs text-neutral-500 dark:text-muted-foreground uppercase tracking-wider font-semibold mb-3">Estimated Investment</div>
                                 <div className="flex items-baseline gap-2">
                                     <span className="text-6xl font-bold text-neutral-900 dark:text-white tracking-tighter">
                                         ₹{monthlyCost.toLocaleString()}
                                     </span>
                                     <span className="text-neutral-400 dark:text-muted-foreground/60 text-lg font-light">/mo</span>
                                 </div>
                             </div>

                             <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-white/10">
                                 <div className="flex items-center justify-between mb-2">
                                     <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-2">
                                         <Zap className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400" /> Savings
                                     </span>
                                     <span className="text-xl font-bold text-neutral-900 dark:text-white">₹{savings.toLocaleString()}</span>
                                 </div>
                                 <div className="w-full bg-neutral-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                                     <div className="bg-emerald-500 h-full w-full animate-pulse" style={{ width: '100%' }} />
                                 </div>
                                 <p className="text-[10px] text-neutral-500 dark:text-muted-foreground mt-2 text-right">vs. Manual QA (₹25/call)</p>
                             </div>
                         </div>
                     </div>
                 </div>

             </div>
        </section>

        {/* --- Cosmic Monolith Cards --- */}
        <section className="container px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-center">
                {PLANS.map((plan, i) => (
                    <motion.div 
                        key={plan.name}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "relative p-8 rounded-3xl border flex flex-col transition-all duration-500 group hover:-translate-y-2",
                            plan.popular 
                                ? "bg-white dark:bg-white/[0.03] border-indigo-500 shadow-xl dark:shadow-[0_0_50px_-20px_rgba(99,102,241,0.3)] h-[640px] z-10" 
                                : "bg-white dark:bg-black border-neutral-200 dark:border-white/10 h-[580px] hover:border-neutral-300 dark:hover:border-white/20 shadow-sm dark:shadow-none"
                        )}
                    >
                        {/* Glowing Background Effect */}
                        <div className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-3xl pointer-events-none rounded-full",
                            plan.color === 'blue' ? "bg-blue-600" : plan.color === 'indigo' ? "bg-indigo-600" : "bg-rose-600"
                        )} />

                        {plan.popular && (
                            <div className="absolute -top-5 left-0 right-0 flex justify-center">
                                <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-indigo-500/40">
                                    Most Popular
                                </span>
                            </div>
                        )}

                        <div className="relative z-10 mb-8">
                            <h3 className={cn("text-2xl font-bold mb-2", 
                                plan.color === 'blue' ? "text-blue-400" : plan.color === 'indigo' ? "text-indigo-400" : "text-rose-400"
                            )}>
                                {plan.name}
                            </h3>
                            <p className="text-sm text-muted-foreground h-10">{plan.desc}</p>
                        </div>

                        <div className="relative z-10 mb-8 pb-8 border-b border-neutral-200 dark:border-white/10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-neutral-900 dark:text-white tracking-tighter">{plan.price}</span>
                                {plan.unit && <span className="text-neutral-500 dark:text-muted-foreground">{plan.unit}</span>}
                            </div>
                        </div>

                        <div className="relative z-10 flex-1 space-y-5 mb-8">
                            {plan.features.map((feat) => (
                                <div key={feat.name} className="flex items-start gap-4 group/item">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                        feat.included ? "bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white group-hover/item:bg-neutral-200 dark:group-hover/item:bg-white/20" : "bg-transparent text-neutral-300 dark:text-white/20"
                                    )}>
                                        {feat.included ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                    </div>
                                    <span className={cn("text-sm transition-colors", feat.included ? "text-neutral-700 dark:text-white/80 group-hover/item:text-neutral-900 dark:group-hover/item:text-white" : "text-neutral-400 dark:text-white/30")}>
                                        {feat.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {plan.popular ? (
                            <div className="relative z-10 w-full">
                                <CosmicButton className="w-full text-lg">
                                    <span className="flex items-center justify-center gap-2">
                                        {plan.cta}
                                    </span>
                                </CosmicButton>
                            </div>
                        ) : (
                            <Button 
                                className="relative z-10 w-full h-14 text-lg rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/30 transition-all duration-300"
                            >
                                <span className="flex items-center gap-2">
                                    {plan.cta} <ArrowRight className="w-4 h-4 opacity-50" />
                                </span>
                            </Button>
                        )}
                    </motion.div>
                ))}
            </div>
        </section>

        <section className="container px-4 mb-24 mt-8">
            <div className="max-w-7xl mx-auto relative rounded-3xl border border-neutral-200 dark:border-white/10 overflow-hidden bg-white dark:bg-gradient-to-r dark:from-neutral-900 dark:to-black p-8 md:p-16 text-center md:text-left flex flex-col md:flex-row items-center gap-12 shadow-xl dark:shadow-none">
                
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-rose-500/5 blur-3xl pointer-events-none" />

                <div className="flex-1 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                        Need an <span className="text-rose-500 dark:text-rose-400">Enterprise</span> Solution?
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                        For banks, large BPOs, and regulated industries requiring on-premise deployment, custom LLM fine-tuning, and dedicated security compliance.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                         <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-white/70 bg-neutral-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-white/5">
                            <ShieldCheck className="w-4 h-4 text-rose-500 dark:text-rose-400" /> On-Premise / VPC
                         </div>
                         <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-white/70 bg-neutral-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-white/5">
                            <Zap className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Custom Models
                         </div>
                         <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-white/70 bg-neutral-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-white/5">
                            <Check className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Dedicated CSM
                         </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <Button 
                        className="h-14 px-8 text-lg rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all font-bold shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        Talk to Enterprise Sales
                    </Button>
                </div>
            </div>
        </section>

      </main>
      <CTASection />
    </Spotlight>
  );
}
