"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
    {
        quote: "AssureQAi’s 100% audit visibility changed our governance approach—pricing is a no-brainer.",
        author: "Head of Operations",
        role: "Tier-1 BPO",
        stats: "38%",
        statDesc: "Cost Reduction",
        color: "from-blue-500 to-indigo-500"
    },
    {
        quote: "Fatal error rate reduced by 42% in just 8 weeks. The automated diagnostics are spot on.",
        author: "VP of Quality",
        role: "FinTech Giant",
        stats: "-42%",
        statDesc: "Fatal Errors",
        color: "from-rose-500 to-red-500"
    },
    {
        quote: "The ability to map TNIs directly to coaching modules saved our L&D team hundreds of hours.",
        author: "Director of Training",
        role: "E-commerce Unicorn",
        stats: "3.1x",
        statDesc: "Closure Rate",
        color: "from-amber-500 to-orange-500"
    },
    {
        quote: "We moved from sampling 2% to auditing 100% without increasing our budget.",
        author: "CX Lead",
        role: "InsurTech",
        stats: "100%",
        statDesc: "Coverage",
        color: "from-emerald-500 to-green-500"
    },
    {
        quote: "The best ROI tool we've implemented this year. Simple as that.",
        author: "Operations Manager",
        role: "Telecom",
        stats: "5x",
        statDesc: "ROI",
        color: "from-violet-500 to-purple-500"
    },
    {
        quote: "Finally, a QA tool that agents actually appreciate. The feedback is instant and fair.",
        author: "Team Lead",
        role: "Sales Process",
        stats: "98%",
        statDesc: "Agent Satisfaction",
        color: "from-cyan-500 to-blue-500"
    }
];

const TestimonialCard = ({ item, index }: { item: typeof TESTIMONIALS[0], index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-[#080808] border border-neutral-200 dark:border-white/[0.08] overflow-hidden hover:border-black/5 dark:hover:border-white/[0.15] transition-all duration-500 shadow-sm hover:shadow-xl dark:hover:shadow-2xl"
        >
            {/* Ambient Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-[0.03] blur-[50px] group-hover:opacity-[0.08] transition-opacity`} />
            
            {/* Stat Header */}
            <div className="mb-8 relative z-10">
                <div className={`text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br ${item.color} mb-1`}>
                    {item.stats}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{item.statDesc}</div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                <Quote className="w-8 h-8 text-neutral-200 dark:text-white/[0.1] mb-4" />
                <p className="text-lg text-neutral-700 dark:text-white/90 leading-relaxed font-light mb-6">
                    &ldquo;{item.quote}&rdquo;
                </p>
                
                <div className="flex items-center gap-4 pt-6 border-t border-neutral-100 dark:border-white/[0.05]">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} opacity-20`} />
                     <div>
                        <h4 className="text-neutral-900 dark:text-white font-medium text-sm">{item.author}</h4>
                        <p className="text-neutral-500 dark:text-muted-foreground text-xs">{item.role}</p>
                    </div>
                </div>
            </div>
            
        </motion.div>
    );
};

export const TestimonialsSection = () => {
    return (
        <section className="py-32 relative bg-white dark:bg-black">
             <div className="container px-4">
             {/* Background Gradients */}
             <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-white/10 to-transparent" />
             <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-white/10 to-transparent" />

            <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8 max-w-6xl mx-auto">
                <div className="max-w-2xl">
                    <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white tracking-tighter mb-6">
                        Trusted by <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-700 to-neutral-400 dark:from-white dark:to-white/50">High-Velocity Teams.</span>
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-muted-foreground/60 font-light">
                        See why compliance-heavy industries are switching to 100% automated audits.
                    </p>
                </div>
                <div className="hidden md:block">
                     {/* Decorative Badge or CTA could go here */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {TESTIMONIALS.map((t, i) => (
                    <TestimonialCard key={i} item={t} index={i} />
                ))}
            </div>
            </div>
        </section>
    );
};
