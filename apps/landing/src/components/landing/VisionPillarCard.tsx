"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const VisionPillarCard = ({
    title,
    desc,
    color,
    icon: Icon,
    delay
  }: {
    title: string;
    desc: string;
    color: "indigo" | "purple" | "rose";
    icon: any;
    delay: number;
  }) => {
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
            transition={{ delay, duration: 0.6 }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative h-full perspective-[1000px] cursor-pointer"
        >
             <div className="relative h-full overflow-hidden rounded-2xl bg-white dark:bg-black border border-neutral-200 dark:border-white/10 group-hover:border-neutral-300 dark:group-hover:border-white/20 transition-all duration-500 shadow-xl dark:shadow-none"
                  style={{ transform: "translateZ(20px)" }}
             >
                  {/* Energy Core Background */}
                  <div className={cn("absolute -inset-[100%] opacity-20 blur-[60px] group-hover:opacity-40 transition-opacity duration-700 animate-[spin_8s_linear_infinite]",
                      color === 'indigo' ? "bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] text-indigo-500" :
                      color === 'purple' ? "bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] text-purple-500" :
                      "bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] text-rose-500"
                  )} style={{ color: color === 'indigo' ? '#6366f1' : color === 'purple' ? '#a855f7' : '#f43f5e' }} />
                  
                  {/* Noise Texture */}
                  <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay" />

                  {/* Content Container - Glass */}
                  <div className="relative h-full p-8 backdrop-blur-md bg-white/90 dark:bg-black/60 flex flex-col items-start justify-between">
                     
                      {/* Floating Icon */}
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500 border border-neutral-200 dark:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]", 
                          color === 'indigo' ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" :
                          color === 'purple' ? "bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400" :
                          "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                      )}
                      style={{ transform: "translateZ(40px)" }}>
                          <Icon className="w-7 h-7" />
                          {/* Inner Glow */}
                          <div className={cn("absolute inset-0 rounded-2xl blur-md opacity-50", 
                             color === 'indigo' ? "bg-indigo-500" : color === 'purple' ? "bg-purple-500" : "bg-rose-500"
                          )} />
                      </div>

                      <div className="relative">
                        <h4 className={cn("text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-3",
                             color === 'indigo' ? "from-neutral-900 to-indigo-600 dark:from-white dark:to-indigo-300" :
                             color === 'purple' ? "from-neutral-900 to-purple-600 dark:from-white dark:to-purple-300" :
                             "from-neutral-900 to-rose-600 dark:from-white dark:to-rose-300"
                        )} style={{ transform: "translateZ(30px)" }}>
                            {title}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-gray-400 leading-relaxed" style={{ transform: "translateZ(20px)" }}>
                            {desc}
                        </p>
                      </div>

                      {/* Interactive Border Line */}
                      <div className={cn("absolute bottom-0 left-0 h-1 bg-gradient-to-r w-0 group-hover:w-full transition-all duration-700 ease-out", 
                          color === 'indigo' ? "from-indigo-500 to-transparent" :
                          color === 'purple' ? "from-purple-500 to-transparent" :
                          "from-rose-500 to-transparent"
                      )} />
                  </div>
             </div>
        </motion.div>
    );

};
