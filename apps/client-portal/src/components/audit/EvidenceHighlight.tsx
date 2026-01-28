'use client';

import { useState } from 'react';
import { Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EvidenceCitation {
  text: string;
  lineNumber?: number;
  startChar?: number;
  endChar?: number;
}

interface EvidenceHighlightProps {
  evidence: EvidenceCitation[];
  maxVisible?: number;
  className?: string;
  onCitationClick?: (citation: EvidenceCitation) => void;
}

/**
 * EvidenceHighlight - Displays transcript citations that support an audit score
 * Clickable to navigate to the transcript section
 */
export function EvidenceHighlight({ 
  evidence, 
  maxVisible = 2,
  className,
  onCitationClick 
}: EvidenceHighlightProps) {
  const [expanded, setExpanded] = useState(false);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No evidence citations available
      </div>
    );
  }

  const visibleEvidence = expanded ? evidence : evidence.slice(0, maxVisible);
  const hasMore = evidence.length > maxVisible;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Quote className="h-3 w-3" />
        Evidence Citations ({evidence.length})
      </div>
      
      <div className="space-y-1.5">
        {visibleEvidence.map((citation, index) => (
          <div
            key={index}
            onClick={() => onCitationClick?.(citation)}
            className={cn(
              'p-2 rounded-md bg-muted/50 border border-border/50',
              'text-sm leading-relaxed',
              'hover:bg-muted/80 hover:border-primary/30 transition-colors',
              onCitationClick && 'cursor-pointer'
            )}
          >
            <div className="flex items-start gap-2">
              <span className="text-primary/60 font-medium shrink-0 text-xs">
                {citation.lineNumber ? `L${citation.lineNumber}` : `#${index + 1}`}
              </span>
              <p className="text-muted-foreground italic">
                &ldquo;{citation.text}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show {evidence.length - maxVisible} more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default EvidenceHighlight;
