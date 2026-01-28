"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'Demo Request'
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setFormData({ name: "", email: "", company: "", message: "" });
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        setIsError(true);
        setTimeout(() => setIsError(false), 5000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsError(true);
      setTimeout(() => setIsError(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Spotlight className="min-h-screen bg-white dark:bg-black selection:bg-primary/20 overflow-hidden">
      <Navbar />
      
      <main className="pt-32 pb-16 min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
        
        <div className="container mx-auto max-w-6xl">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             
             {/* Left: Content */}
             <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
             >
                 <div>
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 mb-6">
                         <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                         <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">System Online</span>
                     </div>
                     <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-6">
                         Initialize <br />
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-400 dark:via-purple-400 dark:to-rose-400">
                             Demo Sequence.
                         </span>
                     </h1>
                     <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                         Experience the raw power of our QA intelligence engine. Schedule a live walkthrough with our solutions engineers.
                     </p>
                 </div>

                 <div className="space-y-4">
                     {[
                         "Real-time audio analysis demonstration",
                         "Custom parameter configuration preview",
                         "Integration architecture deep-dive",
                         "Security & compliance protocol review"
                     ].map((item, i) => (
                         <div key={i} className="flex items-center gap-3 text-sm text-neutral-600 dark:text-gray-300">
                             <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                             <span>{item}</span>
                         </div>
                     ))}
                 </div>
             </motion.div>

             {/* Right: The Holographic Terminal */}
             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative lg:h-[600px] w-full rounded-3xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 flex flex-col overflow-hidden group backdrop-blur-xl shadow-xl dark:shadow-2xl"
             >
                 {/* Terminal Header */}
                 <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02]">
                     <div className="flex items-center gap-2">
                         <div className="flex gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/50" />
                             <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                         </div>
                         <div className="h-4 w-[1px] bg-neutral-200 dark:bg-white/10 mx-2" />
                         <span className="text-[10px] font-mono text-neutral-400 dark:text-white/40 tracking-widest uppercase">Secure Channel // Encrypted</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-500 font-bold">LIVE</span>
                     </div>
                 </div>

                 {/* Scanline & Grid Background */}
                 <div className="absolute inset-0 pointer-events-none">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan" />
                 </div>
                 
                 {/* Form Content */}
                 <div className="relative z-10 p-8 flex-1 flex flex-col justify-center">
                     <form onSubmit={handleSubmit} className="space-y-6">
                         
                         <div className="grid grid-cols-2 gap-6">
                             <div className="group/input relative">
                                 <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                                     Identity // Name
                                 </label>
                                 <input 
                                     type="text"
                                     name="name"
                                     value={formData.name}
                                     onChange={handleChange}
                                     required
                                     className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all placeholder:text-neutral-400 dark:placeholder:text-white/40 font-mono"
                                     placeholder="Enter designation..."
                                 />
                                 <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-emerald-500 group-focus-within/input:w-full transition-all duration-500" />
                             </div>

                             <div className="group/input relative">
                                 <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                                     Comms // Email
                                 </label>
                                 <input 
                                     type="email" 
                                     name="email"
                                     value={formData.email}
                                     onChange={handleChange}
                                     required
                                     className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all placeholder:text-neutral-400 dark:placeholder:text-white/40 font-mono"
                                     placeholder="name@company.com"
                                 />
                                 <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-emerald-500 group-focus-within/input:w-full transition-all duration-500" />
                             </div>
                         </div>

                         <div className="group/input relative">
                             <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                                 Entity // Company Name
                             </label>
                             <input 
                                 type="text" 
                                 name="company"
                                 value={formData.company}
                                 onChange={handleChange}
                                 className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all placeholder:text-neutral-400 dark:placeholder:text-white/40 font-mono"
                                 placeholder="Global Corp Ltd."
                             />
                             <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                             </div>
                         </div>

                         <div className="group/input relative">
                             <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                                 Parameters // Message
                             </label>
                             <textarea 
                                 name="message"
                                 value={formData.message}
                                 onChange={handleChange}
                                 required
                                 className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all placeholder:text-neutral-400 dark:placeholder:text-white/40 font-mono min-h-[100px] resize-none"
                                 placeholder="Requesting 100% audit coverage..."
                             />
                         </div>

                         <button 
                             type="submit"
                             disabled={isLoading || isSuccess}
                             className={cn(
                               "group/btn relative w-full h-14 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold uppercase tracking-wider overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                               isError && "bg-red-500/10 hover:bg-red-500/20 border-red-500/50 text-red-400"
                             )}
                         >
                             <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
                                 <span>
                                   {isLoading ? "Transmitting..." : 
                                    isSuccess ? "Transmission Complete" : 
                                    isError ? "Transmission Failed" : 
                                    "Initiate Uplink"}
                                 </span>
                                 {!isLoading && !isSuccess && !isError && <div className="w-2 h-2 border-t-2 border-r-2 border-emerald-400 transform rotate-45 group-hover/btn:translate-x-1 transition-transform" />}
                                 {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                             </div>
                             
                             {/* Button Scan Effect */}
                             {!isLoading && !isSuccess && !isError && <div className="absolute inset-0 bg-emerald-500/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />}
                         </button>

                         <div className="text-center">
                             <p className="text-[9px] text-neutral-400 dark:text-white/30 font-mono uppercase tracking-widest">
                                 Transmission secure via 256-bit encryption
                             </p>
                         </div>
                     </form>
                 </div>
             </motion.div>
           </div>
        </div>
      </main>
    </Spotlight>
  );
}
