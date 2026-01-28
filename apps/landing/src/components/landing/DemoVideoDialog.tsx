"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DemoVideoDialogProps {
  videoSrc?: string; // Optional: custom video source
}

export function DemoVideoDialog({ videoSrc = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" }: DemoVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
            variant="outline" 
            size="lg" 
            className="h-14 px-8 rounded-full text-neutral-900 dark:text-white bg-white dark:bg-black/60 border-neutral-200 dark:border-white/20 hover:bg-neutral-100 dark:hover:bg-white/10 backdrop-blur-md hover:border-neutral-300 dark:hover:border-white/30 transition-all duration-300 group shadow-sm dark:shadow-none"
        >
            <PlayCircle className="mr-2 w-5 h-5 text-neutral-900 dark:text-white group-hover:text-primary transition-colors" />
            Watch Demo
        </Button>
      </DialogTrigger>
      
      {/* 
        Custom Cosmic Dialog Content 
        The DialogContent component from shadcn/ui handles the overlay/portal.
        We add custom classes for the cosmic look.
      */}
      <DialogContent className="sm:max-w-[900px] p-0 bg-transparent border-none shadow-none overflow-hidden">
        
        {/* Cosmic Container */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_100px_-20px_rgba(124,58,237,0.5)] bg-black/80 backdrop-blur-3xl group">
             
             {/* Neon Glow Borders */}
             <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_20px_2px_rgba(124,58,237,0.3)]" />
             <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
             
             {/* Close Button (Custom) is usually handled by DialogPrimitive, but let's ensure it looks good */}
             
             <div className="relative aspect-video w-full bg-black">
                 {/* Loading State / Thumbnail could go here */}
                 
                 <iframe 
                    width="100%" 
                    height="100%" 
                    src={isOpen ? videoSrc : ""} 
                    title="Product Demo" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full rounded-2xl"
                 ></iframe>

                {/* Grid Overlay for 'Tech' feel */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
             </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
