"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioUploadDropzoneProps {
  onFileSelected: (file: File | null) => void;
  className?: string;
  isConverting?: boolean; // To show a loading state from parent
}

export interface AudioUploadDropzoneRef {
  clearFile: () => void;
}

export const AudioUploadDropzone = forwardRef<
  AudioUploadDropzoneRef,
  AudioUploadDropzoneProps
>(({ onFileSelected, className, isConverting = false }, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    clearFile: () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Do not call onFileSelected(null) here to avoid potential recursion
      // Parent components should update state directly when clearing the file
    },
  }));

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isConverting) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isConverting) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isConverting) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isConverting) return;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
      if (fileInputRef.current) {
        // This might not work in all browsers due to security but good to try
        try {
          fileInputRef.current.files = files;
        } catch (error) {
          console.warn("Could not assign to fileInput.files", error);
        }
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isConverting) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    } else {
      onFileSelected(null);
    }
  };

  const handleButtonClick = () => {
    if (isConverting) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors",
        isConverting
          ? "cursor-not-allowed bg-muted/50 border-muted-foreground/30"
          : "cursor-pointer",
        isDragging && !isConverting
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/70",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleButtonClick} // Click on div also triggers input click
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="audio/*,video/mp4"
        onChange={handleFileChange}
        id="audio-file-input-hidden"
        disabled={isConverting}
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        {isConverting ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-base text-muted-foreground">
              Processing audio...
            </p>
          </>
        ) : (
          <>
            <div className="p-3 bg-muted rounded-lg">
              <UploadCloud className="h-10 w-10 text-primary" />
            </div>
            <p className="text-base text-muted-foreground">
              Drag and drop an audio or MP4 file here, or
            </p>
            <Button
              type="button"
              variant="outline"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 text-sm"
              onClick={(e) => {
                // Needs own onClick to stop propagation if inside the main clickable div
                e.stopPropagation();
                handleButtonClick();
              }}
              disabled={isConverting}
            >
              Browse Files
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

AudioUploadDropzone.displayName = "AudioUploadDropzone";
