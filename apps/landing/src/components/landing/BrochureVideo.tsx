"use client";

import { useRef, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrochureVideoProps {
    src: string;
}

export const BrochureVideo = ({ src }: BrochureVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullScreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
    }, []);

    // Force play on mount to ensure autoplay works on iOS/Safari
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Autoplay prevented:", error);
            });
        }
    }, []);

    const toggleFullScreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div 
            ref={containerRef} 
            className={`relative group w-full h-full flex items-center justify-center ${
                isFullScreen ? "bg-black" : "bg-neutral-100 dark:bg-neutral-900"
            }`}
        >
            <video 
                ref={videoRef}
                src={src} 
                autoPlay 
                muted 
                loop 
                playsInline 
                className={`w-full object-contain ${isFullScreen ? "h-full" : "h-auto"}`}
            />
            
            <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={toggleFullScreen}
                    className="bg-white/80 dark:bg-black/60 backdrop-blur-md hover:bg-white dark:hover:bg-black/80 shadow-lg rounded-full w-10 h-10"
                    title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                >
                    {isFullScreen ? (
                        <Minimize2 className="w-5 h-5 text-neutral-900 dark:text-white" />
                    ) : (
                        <Maximize2 className="w-5 h-5 text-neutral-900 dark:text-white" />
                    )}
                </Button>
            </div>
        </div>
    );
};
