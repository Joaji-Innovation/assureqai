"use client";

import "@/app/landing.css";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { CTASection } from "@/components/landing/CTASection";
import { cn } from "@/lib/utils";
import {
  Check,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Zap,
  Users,
  Search,
  Lock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { VisionPillarCard } from "@/components/landing/VisionPillarCard";
import { ScrambleText } from "@/components/ui/scramble-text";
import { IntelligenceStack } from "@/components/landing/IntelligenceStack";
import { BrochureVideo } from "@/components/landing/BrochureVideo";
import { BrainCircuit } from "lucide-react";

// --- Components ---

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("py-20 px-6 md:px-12 max-w-7xl mx-auto", className)}>
      {children}
    </section>
  );
}

function SectionHeader({ title, subtitle, align = "center" }: { title: string; subtitle?: string; align?: "left" | "center" }) {
  return (
    <div className={cn("mb-16", align === "center" ? "text-center" : "text-left")}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-neutral-900 dark:text-white"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay = 0 }: { icon: any; title: string; description: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="p-8 rounded-2xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors group"
    >
      <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-neutral-900 dark:text-white">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
        {description}
      </p>
    </motion.div>
  );
}

// Reuse TeamCard from About Page
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
      className="group relative h-auto perspective-[1000px]"
    >
      <div className="relative h-auto overflow-hidden rounded-3xl bg-white dark:bg-white/[0.01] border border-neutral-200 dark:border-white/5 group-hover:border-neutral-300 dark:group-hover:border-white/10 transition-all duration-500 shadow-xl"
        style={{ transform: "translateZ(20px)" }}
      >
        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.1)_2px)] bg-[size:100%_4px] opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none z-10" />

        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10" />

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
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-neutral-900 to-neutral-900" />
              <div className="absolute inset-0 opacity-20 bg-[size:20px_20px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]" />

              <span className="relative z-10 text-5xl font-bold text-neutral-300/20 group-hover:text-emerald-500/40 transition-colors uppercase select-none">
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


          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors" style={{ transform: "translateZ(20px)" }}>{member.name}</h3>
          <p className="text-xs font-mono text-emerald-500 dark:text-emerald-400 mb-4 uppercase tracking-wider" style={{ transform: "translateZ(15px)" }}>{member.role}</p>
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
    role: "Head of Finance (HR)",
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

const DASHBOARD_IMAGES = [
  "/dashboard/1.png",
  "/dashboard/2.png",
  "/dashboard/3.png",
  "/dashboard/4.png",
  "/dashboard/5.png",
  "/dashboard/6.png",
];

const PRICING_SLABS = [
  { range: "0 – 10K", price: "₹10", desc: "Starter" },
  { range: "10K – 25K", price: "₹8", desc: "Growth" },
  { range: "25K – 50K", price: "₹6", desc: "Scale", recommended: true },
  { range: "50K – 75K", price: "₹4", desc: "Volume" },
  { range: "75K – 100K", price: "₹3", desc: "Enterprise" },
  { range: "100K+", price: "₹2", desc: "Partner" },
];

export default function BrochurePage() {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="bg-[#fdfbf7] dark:bg-black font-sans selection:bg-emerald-500/30">

      {/* Standard Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent dark:from-emerald-900/20" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-8 border border-emerald-200 dark:border-emerald-800"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Mission Briefing
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 text-neutral-900 dark:text-white"
          >
            Audit <span className="text-emerald-600 dark:text-emerald-500">100%</span> of Your Calls.
            <br />
            <span className="text-3xl md:text-5xl lg:text-6xl text-neutral-400 dark:text-neutral-600 font-medium">No More Blind Spots.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            AssureQAi delivers parameter-level defect detection, automatic TNIs, and leadership-ready dashboards at a fraction of manual QA costs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/book-demo" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-lg shadow-xl shadow-neutral-900/10 hover:scale-105 transition-transform">
                Start Auditing
              </button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-neutral-300 dark:border-neutral-700 font-bold text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                View Pricing
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The Problem (Blind Spot) */}
      <Section className="mb-12">
        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 md:p-16 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-neutral-900 dark:text-white">The 98% Blind Spot</h2>
              <div className="space-y-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>
                  In traditional QA, only <b className="text-red-500">1–2%</b> of interactions are audited. This leaves 98% of your customer conversations in the dark.
                </p>
                <p>
                  Risks hide in the shadows: DNC violations, missed disclosures, and rude behavior often go unchecked until a escalation happens.
                </p>
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 rounded-r-xl">
                  <p className="text-emerald-900 dark:text-emerald-100 font-medium italic">
                    &quot;AssureQAi eliminates this blind spot by auditing 100% of calls with superhuman precision.&quot;
                  </p>
                </div>
              </div>
            </div>
            <div className="relative h-[400px] bg-neutral-100 dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
              {/* Abstract Visualization of 1% vs 100% */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-1 p-4 opacity-20">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className={cn("rounded-sm", i < 3 ? "bg-red-500" : "bg-neutral-400 dark:bg-neutral-600")} />
                ))}
              </div>
              <div className="relative z-10 text-center p-12 bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl">
                <div className="text-7xl md:text-8xl font-bold text-emerald-600 mb-2 tracking-tighter">100%</div>
                <div className="text-sm font-mono uppercase tracking-widest text-neutral-500">Coverage</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Platform Platform Tour (Alternating Layout) */}
      <Section id="features" className="space-y-32">
        <SectionHeader
          title="Inside the Platform"
          subtitle="A tour of the capabilities that make 100% coverage possible."
        />

        {/* Feature 1: End-to-End Auditing */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 md:order-1 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
              <BrochureVideo src="/dashboard/videos/audit_demo.mp4" />
              {/* <Image src={DASHBOARD_IMAGES[0]} alt="End-to-End Auditing Dashboard" fill className="object-cover" /> */}
            </div>
            <div className="absolute -bottom-6 -right-6 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-800 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600"><Search className="w-6 h-6" /></div>
                <div>
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-xs text-neutral-500 uppercase">Coverage</div>
                </div>
              </div>
            </div>
          </motion.div>
          <div className="order-1 md:order-2">
            <h3 className="text-3xl font-bold mb-4">End-to-End Auditing</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              Audit 100% of calls across inbound, outbound, collections, and sales. Or configure sampling parameters to focus on high-risk interactions.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Full coverage of all call types</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Configurable sampling logic</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Inbound, Outbound, & Collections</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 2: Defect Intelligence */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-4">Defect Intelligence</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              Go beyond simple scores. Tag defects parameter-wise across behavioral, process, compliance, system, and product knowledge dimensions.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Parameter-level tagging</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Behavioral & Process insights</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Fatal error flagging</span>
              </li>
            </ul>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
              <BrochureVideo src="/dashboard/videos/fatal_error.mp4" />
              {/* <Image src={DASHBOARD_IMAGES[2]} alt="Defect Intelligence Dashboard" fill className="object-cover" /> */}
            </div>
          </motion.div>
        </div>

        {/* Feature 3: TNIs & Coaching */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 md:order-1 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
              <BrochureVideo src="/dashboard/videos/TNI.mp4" />
              {/* <Image src={DASHBOARD_IMAGES[1]} alt="TNI & Coaching Dashboard" fill className="object-cover" /> */}
            </div>
          </motion.div>
          <div className="order-1 md:order-2">
            <h3 className="text-3xl font-bold mb-4">Smart Coaching</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              Automatically generate Training Needs Identification (TNIs) from defect patterns. Link them directly to coaching plans and track closure.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Auto-generated TNIs</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Coaching closure tracking</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>L&D Module linkage</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 4: Auto-Scoring & Reporting */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-4">Leadership Reporting</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              Real-time drilldowns from agent to site level. Export one-click Excel reports with pivots, PDF summaries, and PPT packs for MBRs.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Real-time Drilldowns</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>GAR (Green/Amber/Red) scoring</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>One-click PPT/Excel exports</span>
              </li>
            </ul>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
              <BrochureVideo src="/dashboard/videos/dashboard_overview.mp4" />
              {/* <Image src={DASHBOARD_IMAGES[3]} alt="Reporting Dashboard" fill className="object-cover" /> */}
            </div>
          </motion.div>
        </div>

      </Section>

      {/* Comparison Table */}
      <Section className="p-0">
        <div className="bg-neutral-900 text-white rounded-[2.5rem] overflow-hidden p-8 md:p-20 relative">
          <div className="absolute top-0 right-0 p-32 bg-emerald-600/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="md:flex justify-between items-end mb-16">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Manual vs AssureQAi</h2>
                <p className="text-neutral-400 max-w-lg text-lg">See the difference in cost, speed, and intelligence.</p>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-sm text-neutral-500 uppercase font-mono mb-1">Savings up to</div>
                <div className="text-5xl font-bold text-emerald-400 tracking-tighter">92%</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-sm font-mono text-neutral-500 uppercase">
                    <th className="py-6 px-4">Dimension</th>
                    <th className="py-6 px-4">Manual QA</th>
                    <th className="py-6 px-4 text-emerald-400">AssureQAi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-lg">
                  <tr>
                    <td className="py-6 px-4 font-medium text-neutral-300">Coverage</td>
                    <td className="py-6 px-4 text-neutral-500">1-2% (Costly)</td>
                    <td className="py-6 px-4 font-bold text-white">100% Audits</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-4 font-medium text-neutral-300">Turnaround</td>
                    <td className="py-6 px-4 text-neutral-500">Daily/Weekly Batches</td>
                    <td className="py-6 px-4 font-bold text-white">Near Real-time</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-4 font-medium text-neutral-300">Insights</td>
                    <td className="py-6 px-4 text-neutral-500">Manual Consolidation</td>
                    <td className="py-6 px-4 font-bold text-white">Parameter-level + Fatal Classification</td>
                  </tr>
                  <tr>
                    <td className="py-6 px-4 font-medium text-neutral-300">Scalability</td>
                    <td className="py-6 px-4 text-neutral-500">Linear (Hire more people)</td>
                    <td className="py-6 px-4 font-bold text-white">Elastic (Infinite Scale)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>



      {/* Our Mission / The Architects */}
      <section className="relative px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 backdrop-blur-md mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Our Mission</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-8">
            The Architects of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200">Automated QA.</span>
          </h1>
          <p className="text-xl text-neutral-600 dark:text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We built AssureQAi because we believe random sampling is a relic of the past.
            In a world of infinite data, &ldquo;good enough&rdquo; coverage is no longer acceptable.
          </p>
        </motion.div>
      </section>

      {/* The Story / Mission (Built by Practitioners) */}
      <section className="py-24 container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Decorative Elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">Built by Practitioners.</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
                <p>
                  The founding team spent a decade scaling support teams at high-growth startups.
                  We saw the same problem everywhere: QA was a bottleneck.
                </p>
                <p>
                  Human auditors could only review 1-2% of calls. This meant 98% of customer interactions—and the risks buried within them—went unheard.
                </p>
                <div className="p-6 bg-neutral-100 dark:bg-neutral-900 border-l-4 border-emerald-500 rounded-r-xl">
                  <p className="font-medium text-emerald-900 dark:text-emerald-300">
                    We decided to fix it. Not by hiring more people, but by building an intelligence layer that could listen, understand, and grade every single second of conversation.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
            <BrochureVideo src="/dashboard/videos/TopQA.mp4" />
          </div>
        </div>
      </section>

      {/* Vision / The Directive */}
      <section className="py-32 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" />
        </div>

        <div className="container px-4 relative z-10 mx-auto">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 mb-16"
            >
              <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-emerald-500" />
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-bold">The Directive</span>
              <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-emerald-500" />
            </motion.div>

            <h2 className="max-w-4xl mx-auto leading-tight tracking-tight mb-20">
              <span className="text-2xl md:text-3xl font-light text-neutral-400 dark:text-white/40 block mb-6">
                Our vision is to lead as a premier AI-driven technology company, transforming industries with
              </span>

              <span className="block text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-emerald-600 to-emerald-800 dark:from-white dark:via-emerald-200 dark:to-emerald-400 mb-4">
                <ScrambleText text="intelligent, adaptive systems" revealSpeed={40} delay={200} />
              </span>

              <span className="text-2xl md:text-3xl font-light text-neutral-400 dark:text-white/40 block mb-6">
                that are
              </span>

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white">
                <span className="text-emerald-600 dark:text-emerald-400">
                  <ScrambleText text="connected," delay={1500} />
                </span>
                <span className="text-teal-600 dark:text-teal-400">
                  <ScrambleText text="autonomous," delay={2000} />
                </span>
                <span className="text-green-600 dark:text-green-400">
                  <ScrambleText text="& predictive." delay={2500} />
                </span>
              </div>
            </h2>

            {/* 3D Pillar Cards - Adapted Colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto border-t border-neutral-200 dark:border-white/10 pt-20 perspective-1000">
              <VisionPillarCard
                title="Smarter & Ethical"
                desc="Delivering solutions that empower businesses while maintaining the highest standards of integrity."
                color="indigo" // Keep indigo/purple range for variety or switch to emerald if user insisted on strict palette. Retaining contrast for now.
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

      {/* Pricing Slabs (Moved here as per original flow, just ensuring it follows Vision) */}
      <Section id="pricing">
        <SectionHeader
          title="Transparent Pricing"
          subtitle="Volume-based slabs. No hidden fees. Pay for what you audit."
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PRICING_SLABS.map((slab, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-6 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[180px] transition-all duration-300",
                slab.recommended
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/20 scale-110 z-10"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/30"
              )}
            >
              <div className={cn("text-xs font-mono uppercase mb-3", slab.recommended ? "text-emerald-100" : "text-neutral-500")}>
                {slab.range} calls
              </div>
              <div className="text-4xl font-bold mb-3 tracking-tight">{slab.price}</div>
              <div className={cn("text-xs font-medium", slab.recommended ? "text-emerald-200" : "text-neutral-400")}>
                per audit
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center text-sm text-neutral-500 bg-neutral-100 dark:bg-neutral-900/50 py-4 px-8 rounded-full inline-block mx-auto">
          Enterprise commitments and multi-campaign deployments available.
        </div>
      </Section>

      {/* Leadership / The Command Crew */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">The Command Crew</h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Built by practitioners who have audited millions of calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 relative z-10">
          {TEAM.slice(0, 3).map((member, i) => (
            <div key={i} className="w-full">
              <TeamCard member={member} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* Case Studies / Testimonials */}
      <Section>
        <SectionHeader title="Field Reports" />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-6 text-emerald-600">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
              <span className="font-bold text-sm uppercase tracking-wide">Collections</span>
            </div>
            <p className="text-5xl font-bold mb-4 tracking-tighter">42%</p>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">Reduction in fatal error rates.</p>
            <div className="h-px bg-neutral-100 dark:bg-white/5 mb-6" />
            <p className="text-xs font-mono text-neutral-500">75K calls / month</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-6 text-emerald-600">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
              <span className="font-bold text-sm uppercase tracking-wide">Support</span>
            </div>
            <p className="text-5xl font-bold mb-4 tracking-tighter">51/29/20</p>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">GAR distribution Improvement.</p>
            <div className="h-px bg-neutral-100 dark:bg-white/5 mb-6" />
            <p className="text-xs font-mono text-neutral-500">100K calls / month</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2rem] shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-6 text-emerald-600">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><Zap className="w-5 h-5" /></div>
              <span className="font-bold text-sm uppercase tracking-wide">Sales</span>
            </div>
            <p className="text-5xl font-bold mb-4 tracking-tighter">27%</p>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">Increase in parameter compliance.</p>
            <div className="h-px bg-neutral-100 dark:bg-white/5 mb-6" />
            <p className="text-xs font-mono text-neutral-500">40K calls / month</p>
          </div>
        </div>
      </Section>

      {/* Standard CTA & Footer */}
      <CTASection />

    </div>
  );
}
