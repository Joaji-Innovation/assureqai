"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import { CosmicButton } from "./CosmicButton";
import { AssureQaiLogo } from "../common/AssureQaiLogo";

export const CTASection = () => {
    return (
        <footer className="relative pt-32 pb-16 px-4 sm:px-6 overflow-hidden bg-white dark:bg-black text-neutral-900 dark:text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 pointer-events-none" />
            
            <div className="container relative z-10 mx-auto max-w-5xl text-center">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 text-neutral-900 dark:text-white"
                >
                    Ready to <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-800 to-neutral-400 dark:from-white dark:to-white/40">Audit Everything?</span>
                </motion.h2>

                <p className="text-xl text-neutral-600 dark:text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Join the automated QA revolution. Start your free pilot today and see parameter-level insights in action.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-32">
                    <Link href="/pricing">
                        <CosmicButton>
                            <span className="flex items-center gap-2">
                            Start Free Pilot
                            </span>
                        </CosmicButton>
                    </Link>
                    <Link href="/contact">
                        <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg bg-white dark:bg-black/60 border-neutral-200 dark:border-white/20 hover:bg-neutral-100 dark:hover:bg-white/10 dark:hover:border-white/30 text-neutral-900 dark:text-white shadow-sm dark:shadow-none">
                            Contact Sales <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>

                {/* Footer Links */}
                <div className="border-t border-neutral-200 dark:border-white/10 pt-24 pb-12 grid grid-cols-2 md:grid-cols-12 gap-12 text-left relative z-10">
                    <div className="col-span-2 md:col-span-4 flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                             <AssureQaiLogo 
                                 showIcon={true} 
                                 showLogo={true} 
                                 width={140} 
                                 className="h-9 w-auto"
                             />
                        </div>

                        <p className="text-neutral-500 dark:text-muted-foreground text-sm leading-relaxed max-w-xs">
                             Deep diagnostics for high-velocity teams. 
                             Replace random sampling with 100% automated coverage today.
                        </p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 md:col-start-7">
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-neutral-500 dark:text-muted-foreground">
                            <li><Link href="/#features" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-neutral-500 dark:text-muted-foreground">
                            <li><Link href="/about" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">About</Link></li>
                            <li><Link href="/contact" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div className="col-span-2 md:col-span-2">
                        <h4 className="font-bold text-neutral-900 dark:text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-neutral-500 dark:text-muted-foreground">
                             <li><Link href="/legal/privacy" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">Privacy</Link></li>
                             <li><Link href="/legal/terms" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">Terms</Link></li>
                             <li><Link href="/legal/dpa" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">DPA</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-neutral-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500 dark:text-muted-foreground">
                <div className="flex flex-col md:flex-row gap-2 md:gap-8 text-center md:text-left">
                    <span>© 2025 Joaji Inc. All rights reserved. Bengaluru, India.</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-300">Ph: +91 63636 44521</span>
                </div>
                
                <div className="flex gap-4">
                    <Link href="https://www.linkedin.com/company/assureqai" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                        <Linkedin className="w-4 h-4" />
                    </Link>
                    <Link href="https://x.com/assureQAI" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                        <Twitter className="w-4 h-4" />
                    </Link>
                </div>
            </div>
            </div>
        </footer>
    );
};

