"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { text: "Analyze 100% of calls...", icon: Search },
  { text: "Detect fatal errors...", icon: Command },
  { text: "Generate training insights...", icon: ArrowRight },
  { text: "Reduce compliance risk...", icon: Search },
];

export const CommandBarTicker = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % COMMANDS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = COMMANDS[index].icon;

  return (
    <div className="relative group">
      <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/50 to-secondary/50 opacity-20 group-hover:opacity-50 blur transition duration-500" />
      <div className="relative flex items-center h-12 px-4 rounded-lg bg-neutral-50 dark:bg-black/40 backdrop-blur-md border border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-xl overflow-hidden min-w-[320px]">
        
        {/* Animated Icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`icon-${index}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="mr-3 text-muted-foreground"
          >
            <CurrentIcon className="w-4 h-4" />
          </motion.div>
        </AnimatePresence>

        {/* Typing Text Effect */}
        <div className="w-full relative h-[20px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute left-0 text-sm md:text-base text-neutral-900 dark:text-gray-200 font-mono"
            >
              {COMMANDS[index].text}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Command shortcut hint */}
        <div className="ml-auto text-xs text-neutral-500 dark:text-muted-foreground bg-neutral-200 dark:bg-white/5 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-white/5 hidden sm:block">
          ⌘K
        </div>
      </div>
    </div>
  );
};
