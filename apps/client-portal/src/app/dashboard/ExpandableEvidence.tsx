"use client";

import { useState } from "react";

interface ExpandableEvidenceProps {
  evidence: any;
}

const ExpandableEvidence: React.FC<ExpandableEvidenceProps> = ({ evidence }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!evidence) return null;

  // Handle single string case
  if (!Array.isArray(evidence)) {
    return (
      <div className="text-xs p-2 rounded bg-muted/50 border border-border/50 italic text-muted-foreground mt-2">
        <span className="text-primary/60 font-medium mr-1">#1:</span>
        &ldquo;{evidence}&rdquo;
      </div>
    );
  }

  // Handle array case
  const citations = evidence;
  if (citations.length === 0) return null;

  // Configuration
  const INITIAL_COUNT = 2;
  const showExpandButton = citations.length > INITIAL_COUNT;
  const visibleCitations = isExpanded ? citations : citations.slice(0, INITIAL_COUNT);
  const remainingCount = citations.length - INITIAL_COUNT;

  return (
    <div className="space-y-1 mt-2">
      {visibleCitations.map((ev: any, idx: number) => (
        <div
          key={idx}
          className="text-xs p-2 rounded bg-muted/50 border border-border/50 italic text-muted-foreground"
        >
          <span className="text-primary/60 font-medium mr-1">
            {ev.lineNumber ? `L${ev.lineNumber}:` : `#${idx + 1}:`}
          </span>
          &ldquo;{ev.text || ev}&rdquo;
        </div>
      ))}

      {showExpandButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1"
        >
          {isExpanded ? "Show less" : `+${remainingCount} more citations`}
        </button>
      )}
    </div>
  );
};

export default ExpandableEvidence;
