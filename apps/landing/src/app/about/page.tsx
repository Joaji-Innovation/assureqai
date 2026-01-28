"use client";

import "../landing.css";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { CTASection } from "@/components/landing/CTASection";
import { cn } from "@/lib/utils";
import { BrainCircuit, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import { ScrambleText } from "@/components/ui/scramble-text";
import { VisionPillarCard } from "@/components/landing/VisionPillarCard";
import { IntelligenceStack } from "@/components/landing/IntelligenceStack";

// Note: Metadata is exported from a separate file for client components
// See: about/metadata.ts

const VALUES = [
  {
    title: "Accuracy over Assumptions",
    icon: ShieldCheck,
    desc: "We don't guess. We audit 100% of interactions to provide evidentiary truth, not sampled estimates.",
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-emerald-500/0"
  },
  {
    title: "Transparency over Black-box",
    icon: BrainCircuit,
    desc: "Our AI explains its reasoning. Every score comes with a citation, so you can trust the verdict.",
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-indigo-500/0"
  },
  {
    title: "Actionability over Vanity",
    icon: Zap,
    desc: "Data without action is noise. We focus on insights that directly improve agent performance.",
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-rose-500/0"
  }
];

export default function AboutPage() {
  return (
    <Spotlight className="min-h-screen bg-white dark:bg-black selection:bg-primary/20">
      <Navbar />
      
      <main className="pt-32 pb-16">
        
        {/* --- Hero Section --- */}
        <section className="relative px-6 py-24 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 backdrop-blur-md mb-8">
                     <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                     <span className="text-xs font-mono text-neutral-500 dark:text-muted-foreground uppercase tracking-widest">Our Mission</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-8">
                    The Architects of <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-400 dark:via-purple-400 dark:to-rose-400">Automated QA.</span>
                </h1>
                <p className="text-xl text-neutral-600 dark:text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    We built AssureQAi because we believe random sampling is a relic of the past. 
                    In a world of infinite data, &ldquo;good enough&rdquo; coverage is no longer acceptable.
                </p>
            </motion.div>
        </section>

        {/* --- The Story / Holographic Visual --- */}
        <section className="py-24 container px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                     {/* Decorative Elements */}
                     <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-[50px] pointer-events-none" />
                     
                     <div className="relative z-10 space-y-6">
                         <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">Built by Practitioners.</h2>
                         <div className="space-y-4 text-neutral-600 dark:text-muted-foreground text-lg leading-relaxed">
                             <p>
                                 The founding team spent a decade scaling support teams at high-growth startups. 
                                 We saw the same problem everywhere: QA was a bottleneck.
                             </p>
                             <p>
                                 Human auditors could only review 1-2% of calls. This meant 98% of customer interactions—and the risks buried within them—went unheard.
                             </p>
                             <p>
                                 We decided to fix it. Not by hiring more people, but by building an intelligence layer that could listen, understand, and grade every single second of conversation.
                             </p>
                         </div>
                     </div>
                </motion.div>

                <div className="relative w-full aspect-square md:aspect-[4/3] perspective-1000 group">
                    <IntelligenceStack />
                </div>
            </div>
        </section>

        {/* --- Vision / The North Star --- */}
        <section className="py-32 relative overflow-hidden">
             {/* Background Grid & Neural Mesh */}
             <div className="absolute inset-0 bg-white dark:bg-black">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
                 <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-black dark:via-transparent dark:to-black" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse pointer-events-none" />
             </div>

             <div className="container px-4 relative z-10">
                 <div className="max-w-5xl mx-auto text-center">
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 mb-16"
                     >
                         <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-indigo-500" />
                         <span className="text-xs font-mono text-indigo-400 uppercase tracking-[0.3em] font-bold">The Directive</span>
                         <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-indigo-500" />
                     </motion.div>
                     
                     <h2 className="max-w-4xl mx-auto leading-tight tracking-tight mb-20">
                         <span className="text-2xl md:text-3xl font-light text-neutral-400 dark:text-white/40 block mb-6">
                             Our vision is to lead as a premier AI-driven technology company, transforming industries with 
                         </span>
                         
                         <span className="block text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-indigo-600 to-indigo-800 dark:from-white dark:via-indigo-200 dark:to-indigo-400 mb-4">
                             <ScrambleText text="intelligent, adaptive systems" revealSpeed={40} delay={200} />
                         </span>

                         <span className="text-2xl md:text-3xl font-light text-neutral-400 dark:text-white/40 block mb-6">
                            that are
                         </span>

                         <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white">
                            <span className="text-indigo-600 dark:text-indigo-400">
                                <ScrambleText text="connected," delay={1500} />
                            </span>
                            <span className="text-purple-600 dark:text-purple-400">
                                <ScrambleText text="autonomous," delay={2000} />
                            </span>
                            <span className="text-rose-600 dark:text-rose-400">
                                <ScrambleText text="& predictive." delay={2500} />
                            </span>
                         </div>
                     </h2>

                     {/* 3D Pillar Cards */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto border-t border-neutral-200 dark:border-white/10 pt-20 perspective-1000">
                         <VisionPillarCard 
                             title="Smarter & Ethical"
                             desc="Delivering solutions that empower businesses while maintaining the highest standards of integrity."
                             color="indigo"
                             icon={BrainCircuit}
                             delay={0}
                         />
                         <VisionPillarCard 
                             title="Sustainable Impact"
                             desc="Creating adaptable systems that improve lives and ensure long-term value for all stakeholders."
                             color="purple"
                             icon={Zap}
                             delay={0.1}
                         />
                         <VisionPillarCard 
                             title="Responsible Innovation"
                             desc="Building trust through transparency, ensuring that every leap forward is grounded in safety."
                             color="rose"
                             icon={ShieldCheck}
                             delay={0.2}
                         />
                     </div>
                 </div>
             </div>
        </section>

        {/* --- Values / Orbital Cards --- */}
        <section className="py-24 container px-4 relative">
             <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Our Core Values</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                 {VALUES.map((val, i) => (
                     <ValueCard key={i} val={val} index={i} />
                 ))}
             </div>
        </section>

        {/* --- Team / Command Crew --- */}
        <section className="py-24 container px-4 relative border-t border-neutral-200 dark:border-white/5">
             <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">The Command Crew</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                 {TEAM.map((member, i) => (
                     <TeamCard key={i} member={member} index={i} />
                 ))}
             </div>
        </section>

      </main>

      <CTASection />
    </Spotlight>
  );
}


const TEAM = [
    {
        name: "Ajith T.",
        role: "Founder & CEO",
        bio: "",
        image: "/team/1.jpeg",
        skills: ["Strategy", "Scale", "Systems"],
        id: "Qai0001"
    },
    {
        name: "Joel J.",
        role: "Co-Founder & COO",
        bio: "",
        image: "/team/2.jpeg",
        skills: ["Ops", "Human-AI", "Process"],
        id: "Qai0002"
    },
    {
        name: "Kanish K.",
        role: "CTO",
        bio: "",
        image: "/team/3.jpeg",
        skills: ["LLMs", "Architecture", "RAG"],
        id: "Qai0003"
    },
    {
        name: "Sai Laaxmi",
        role: "Head of Design",
        bio: "",
        image: "",
        skills: ["Visual", "Product", "Brand"],
        id: "Qai0004"
    },
    {
        name: "Jessica",
        role: "Head of Finance",
        bio: "",
        image: "",
        skills: ["Finance", "People", "Culture"],
        id: "Qai0005"
    },
    {
        name: "Basco",
        role: "Head of Sales",
        bio: "",
        image: "",
        skills: ["GTM", "Revenue", "Growth"],
        id: "Qai0006"
    },
    {
        name: "Rathi R.",
        role: "Head of Operations",
        bio: "",
        image: "",
        skills: ["Process", "Scale", "Efficiency"],
        id: "Qai0007"
    },
    {
        name: "Harshit",
        role: "Head of Customer Success",
        bio: "",
        image: "",
        skills: ["Retention", "Support", "CX"],
        id: "QAi0008"
    }
];

const TeamCard = ({ member, index }: { member: typeof TEAM[0], index: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 50, damping: 10 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 10 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative h-full perspective-[1000px]"
    >
        <div className="relative h-full overflow-hidden rounded-3xl bg-white dark:bg-white/[0.01] border border-neutral-200 dark:border-white/5 group-hover:border-neutral-300 dark:group-hover:border-white/10 transition-all duration-500 shadow-xl"
             style={{ transform: "translateZ(20px)" }}
        >
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.1)_2px)] bg-[size:100%_4px] opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none z-10" />
            
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                
                {member.image ? (
                    <Image 
                        src={member.image} 
                        alt={member.name}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative">
                         {/* Abstract Background for Placeholder */}
                         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-neutral-900 to-neutral-900" />
                         <div className="absolute inset-0 opacity-20 bg-[size:20px_20px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]" />
                         
                         <span className="relative z-10 text-5xl font-bold text-neutral-300/20 group-hover:text-indigo-500/40 transition-colors uppercase select-none">
                            {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                         </span>
                    </div>
                )}
                
                {/* Tech Corners */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/30 z-20" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/30 z-20" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/30 z-20" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/30 z-20" />

                {/* ID Badge Overlay */}
                <div className="absolute top-4 left-4 z-20 flex gap-2" style={{ transform: "translateZ(30px)" }}>
                    <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-mono text-white/70">
                        ID: {member.id}
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-6 relative">
                 <div className="absolute -top-6 right-6 w-12 h-12 bg-[#0A0A0A] rounded-full flex items-center justify-center border border-white/10 z-20 group-hover:scale-110 transition-transform duration-300"
                      style={{ transform: "translateZ(30px)" }} 
                 >
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 </div>
                 
                 
                 <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors" style={{ transform: "translateZ(20px)" }}>{member.name}</h3>
                 <p className="text-xs font-mono text-indigo-500 dark:text-indigo-400 mb-4 uppercase tracking-wider" style={{ transform: "translateZ(15px)" }}>{member.role}</p>
                 <p className="text-sm text-neutral-600 dark:text-muted-foreground leading-relaxed mb-6" style={{ transform: "translateZ(10px)" }}>
                     {member.bio}
                 </p>

                 {/* Skills Tags */}
                 <div className="flex flex-wrap gap-2" style={{ transform: "translateZ(25px)" }}>
                     {member.skills.map((skill, i) => (
                         <span key={i} className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-[10px] text-neutral-500 dark:text-white/50 group-hover:text-neutral-900 dark:group-hover:text-white/80 group-hover:border-neutral-300 dark:group-hover:border-white/20 transition-colors">
                             {skill}
                         </span>
                     ))}
                 </div>
            </div>
        </div>
    </motion.div>
    );
};

const ValueCard = ({ val, index }: { val: typeof VALUES[0], index: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 50, damping: 10 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 10 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative h-full perspective-[1000px]"
        >
            <div className="relative h-full p-8 rounded-3xl bg-white dark:bg-white/[0.01] border border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10 transition-all duration-500 overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none"
                 style={{ transform: "translateZ(20px)" }}
            >
                {/* Nebula Glow Effect - Subtler */}
                <div className={cn("absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none", val.color.replace("text-", "bg-"))} />
                <div className={cn("absolute -left-20 -bottom-20 w-64 h-64 rounded-full blur-[100px] opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none", val.color.replace("text-", "bg-"))} />
                
                {/* Icon Reactor */}
                <div className={cn("relative w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-500", val.color)}
                     style={{ transform: "translateZ(30px)" }}
                >
                    <div className={cn("absolute inset-0 rounded-2xl opacity-10 blur-md transition-opacity duration-500 group-hover:opacity-30", val.color.replace("text-", "bg-"))} />
                    <val.icon className="w-7 h-7 relative z-10 drop-shadow-md" />
                </div>
                
                
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-white dark:group-hover:to-white/70 transition-colors"
                    style={{ transform: "translateZ(20px)" }}
                >
                    {val.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-muted-foreground leading-relaxed group-hover:text-neutral-800 dark:group-hover:text-white/70 transition-colors"
                   style={{ transform: "translateZ(10px)" }}
                >
                    {val.desc}
                </p>

                {/* Glass Reflection - Sharper */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl mix-blend-overlay" />
            </div>
        </motion.div>
    );
};


