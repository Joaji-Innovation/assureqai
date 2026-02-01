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
      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
        "{evidence}"
      </p>
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
    <div className="space-y-1 mt-1">
      {visibleCitations.map((ev: any, idx: number) => (
        <p key={idx} className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
          "{ev.text || ev}"
          {ev.lineNumber ? <span className="ml-1 text-[10px] not-italic opacity-70">(Line {ev.lineNumber})</span> : null}
        </p>
      ))}

      {showExpandButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] text-primary hover:underline font-medium ml-2 flex items-center gap-1"
        >
          {isExpanded ? "Show less" : `+${remainingCount} more citations`}
        </button>
      )}
    </div>
  );
};
