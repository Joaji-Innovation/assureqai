"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Spotlight } from "@/components/landing/Spotlight";
import { WorldMap } from "@/components/landing/WorldMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, MessagesSquare, Radio, ShieldCheck } from "lucide-react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    company: '', // Optional or add field
                    message: formData.message,
                }),
            });

            if (res.ok) {
                setIsSuccess(true);
                setFormData({ firstName: "", lastName: "", email: "", message: "" });
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

            {/* Background Layer */}
            <WorldMap />

            <main className="pt-32 pb-16 min-h-screen flex flex-col items-center justify-center relative z-10 px-4">

                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-6"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">Systems Operational</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-4"
                    >
                        Open Frequency.
                    </motion.h1>
                    <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                        Initiate a secure channel with our engineering or sales team. We respond within 24ms (mostly).
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl items-start">

                    {/* Left: Communication Array (Status Cards) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-4 space-y-4"
                    >
                        <div className="group p-6 rounded-2xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 backdrop-blur-md hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-default shadow-sm dark:shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500 dark:text-indigo-400">
                                    <MessagesSquare className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> ONLINE
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Sales & Pilots</h3>
                            <p className="text-sm text-neutral-600 dark:text-muted-foreground mb-4">For enterprise licensing and custom deployments.</p>
                            <div className="text-neutral-900 dark:text-white font-mono text-sm">sales@assureqai.com</div>
                        </div>

                        <div className="group p-6 rounded-2xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 backdrop-blur-md hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-default shadow-sm dark:shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500 dark:text-purple-400">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> ONLINE
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Technical Support</h3>
                            <p className="text-sm text-neutral-600 dark:text-muted-foreground mb-4">Direct line to our integration engineers.</p>
                            <div className="text-neutral-900 dark:text-white font-mono text-sm">support@assureqai.com</div>
                        </div>

                        <div className="group p-6 rounded-2xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 backdrop-blur-md hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-default shadow-sm dark:shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500 dark:text-rose-400">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-mono text-neutral-500 dark:text-white/50">
                                    UTC+5:30
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Global HQ</h3>
                            <p className="text-sm text-neutral-600 dark:text-muted-foreground">Bengaluru, India</p>
                        </div>
                    </motion.div>

                    {/* Right: The Glass Monolith (Form) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-8"
                    >
                        <form onSubmit={handleSubmit} className="relative p-8 md:p-12 rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-black/60 backdrop-blur-xl shadow-xl dark:shadow-2xl overflow-hidden">
                            {/* Decorative Top Bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-50" />

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-mono text-neutral-500 dark:text-white/60 uppercase tracking-widest pl-1">Input // First Name</label>
                                    <Input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="bg-transparent border-0 border-b border-neutral-200 dark:border-white/20 rounded-none px-0 h-12 focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:bg-neutral-50 dark:focus-visible:bg-white/5 transition-all text-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-white/20"
                                        placeholder="Jane"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-mono text-neutral-500 dark:text-white/60 uppercase tracking-widest pl-1">Input // Last Name</label>
                                    <Input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className="bg-transparent border-0 border-b border-neutral-200 dark:border-white/20 rounded-none px-0 h-12 focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:bg-neutral-50 dark:focus-visible:bg-white/5 transition-all text-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-white/20"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <label className="text-xs font-mono text-neutral-500 dark:text-white/60 uppercase tracking-widest pl-1">Input // Work Email</label>
                                <Input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    type="email"
                                    className="bg-transparent border-0 border-b border-neutral-200 dark:border-white/20 rounded-none px-0 h-12 focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:bg-neutral-50 dark:focus-visible:bg-white/5 transition-all text-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-white/20"
                                    placeholder="jane@company.com"
                                />
                            </div>

                            <div className="space-y-3 mb-10">
                                <label className="text-xs font-mono text-neutral-500 dark:text-white/60 uppercase tracking-widest pl-1">Input // Directive</label>
                                <Textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    className="bg-transparent border-0 border-b border-neutral-200 dark:border-white/20 rounded-none px-0 min-h-[100px] focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:bg-neutral-50 dark:focus-visible:bg-white/5 transition-all text-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-white/20 resize-none"
                                    placeholder="We need to audit 50k calls/month..."
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                                    <span>Encrypted Transmission</span>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading || isSuccess}
                                    className={cn(
                                        "h-14 px-8 bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-white/90 rounded-full font-bold text-lg tracking-tight group disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                                        isError && "bg-red-500 text-white hover:bg-red-600"
                                    )}
                                >
                                    {isLoading ? "Transmitting..." :
                                        isSuccess ? "Success" :
                                            isError ? "Transmission Failed" :
                                                "Transmit Request"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>

                </div>

            </main>
        </Spotlight>
    );
}
