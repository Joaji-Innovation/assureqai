"use client";

import { motion } from "framer-motion";

export const WorldMap = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-20 pointer-events-none select-none">
            {/* 
                Simplified Dot Matrix World Map Representation 
                Using SVG for lightweight, crisp rendering
            */}
            <svg 
                viewBox="0 0 1000 500" 
                className="w-[120%] h-auto text-indigo-500 fill-current"
                style={{ filter: "drop-shadow(0 0 10px rgba(99,102,241,0.5))" }}
            >
                {/* Abstract Continents (Dot Pattern) */}
                <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="currentColor" fillOpacity="0.3" />
                    </pattern>
                </defs>

                {/* 
                    We'll use a mask or path to define the rough shape of continents, 
                    filled with the dot pattern.
                    For a pure "tech" feel, we can just use widely spaced glowing nodes.    
                */}
                
                {/* Automated Nodes Pulsing */}
                {[
                    { cx: 200, cy: 150 }, // North America West
                    { cx: 300, cy: 180 }, // North America East
                    { cx: 480, cy: 130 }, // Europe
                    { cx: 750, cy: 200 }, // Asia
                    { cx: 850, cy: 350 }, // Australia
                    { cx: 550, cy: 300 }, // Africa
                ].map((node, i) => (
                    <motion.g key={i}>
                         <circle cx={node.cx} cy={node.cy} r="3" className="fill-white" />
                         <motion.circle 
                            cx={node.cx} 
                            cy={node.cy} 
                            r="3" 
                            className="fill-transparent stroke-white/50 stroke-1"
                            initial={{ r: 3, opacity: 1 }}
                            animate={{ r: 30, opacity: 0 }}
                            transition={{ 
                                duration: 3, 
                                repeat: Infinity, 
                                delay: i * 0.5,
                                ease: "easeOut" 
                            }}
                         />
                         {/* Connection Lines */}
                         <motion.path
                            d={`M 480 130 L ${node.cx} ${node.cy}`} // All connecting to Europe (HQ proxy)
                            className="stroke-indigo-500/20 stroke-[0.5]"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 2, delay: i * 0.2 }}
                         />
                    </motion.g>
                ))}
                
                {/* Horizontal Scan Lines */}
                <motion.line 
                    x1="0" y1="0" x2="1000" y2="0" 
                    className="stroke-indigo-500/10 stroke-[1]"
                    animate={{ y1: [0, 500], y2: [0, 500] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
            </svg>
            
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
        </div>
    );
};
