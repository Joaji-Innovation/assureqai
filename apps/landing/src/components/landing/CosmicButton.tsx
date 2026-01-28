import React from "react";
import { ArrowRight } from "lucide-react";

interface CosmicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const CosmicButton: React.FC<CosmicButtonProps> = ({ children, className, ...props }) => {
  return (
    <button className={`cosmic-button ${className || ""}`} {...props}>
      <span className="cosmic-fold"></span>

      <div className="points_wrapper">
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
        <i className="point"></i>
      </div>

      <span className="cosmic-inner">
        {/* Default icon if needed, but allow children for flexibility */}
        {children}
      </span>
    </button>
  );
};
