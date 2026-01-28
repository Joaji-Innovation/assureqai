"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const CYPHER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

interface ScrambleTextProps {
  text: string;
  className?: string;
  revealSpeed?: number;
  scrambleSpeed?: number;
  delay?: number; // Delay before starting the scramble effect
}

export const ScrambleText = ({
  text,
  className,
  revealSpeed = 50, // ms per character reveal
  scrambleSpeed = 30, // ms per scramble update
  delay = 0,
}: ScrambleTextProps) => {
  const [displayText, setDisplayText] = useState("");
  const isMounted = useRef(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 }); // Start when 50% visible
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!isInView) return;

    // Start with empty or obscured text
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    timeout = setTimeout(() => {
        let revealIndex = 0;
        
        interval = setInterval(() => {
            if (!isMounted.current) return;

            let result = "";
            for (let i = 0; i < text.length; i++) {
                if (i < revealIndex) {
                    result += text[i];
                } else {
                    result += CYPHER_CHARS[Math.floor(Math.random() * CYPHER_CHARS.length)];
                }
            }

            setDisplayText(result);

            if (revealIndex >= text.length) {
                clearInterval(interval);
            } else {
                // Randomly advance index to make it feel less linear, or just increment
                 if (Math.random() > 0.5) revealIndex++;
            }

        }, scrambleSpeed);

    }, delay);

    return () => {
        clearTimeout(timeout);
        clearInterval(interval);
    };
  }, [isInView, text, scrambleSpeed, delay]);

  return (
    <span ref={containerRef} className={cn("inline-block tabular-nums", className)}>
      {displayText || text.split('').map(() => CYPHER_CHARS[Math.floor(Math.random() * CYPHER_CHARS.length)]).join('')}
    </span>
  );
};
