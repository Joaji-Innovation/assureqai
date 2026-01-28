"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: any;
  onClick?: () => void;
  noHover?: boolean;
}

export function GlassCard({ children, className, title, icon: Icon, onClick, noHover = false }: GlassCardProps) {
  return (
    <motion.div
      whileHover={!noHover && onClick ? { y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className={cn(
        "glass rounded-xl p-6 relative overflow-hidden group",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Background Gradient Blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
      
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-4 relative z-10">
          {title && (
            <h3 className="text-sm font-medium text-muted-foreground tracking-tight">
              {title}
            </h3>
          )}
          {Icon && (
            <div className={`p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-300`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
