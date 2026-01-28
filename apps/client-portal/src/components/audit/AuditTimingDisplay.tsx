'use client';

import { Clock, Zap, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AuditTiming {
  startTime: string;
  endTime: string;
  processingDurationMs: number;
  promptTokensPerSecond?: number;
}

interface AuditTimingDisplayProps {
  timing?: AuditTiming;
  compact?: boolean;
  className?: string;
}

/**
 * AuditTimingDisplay - Shows audit processing timing metrics
 * Displays start time, end time, and processing duration
 */
export function AuditTimingDisplay({ 
  timing, 
  compact = false,
  className 
}: AuditTimingDisplayProps) {
  if (!timing) {
    return null;
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(0);
    return `${mins}m ${secs}s`;
  };

  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Speed classification
  const speedLevel = timing.processingDurationMs < 5000 
    ? 'fast' 
    : timing.processingDurationMs < 15000 
    ? 'normal' 
    : 'slow';

  const speedStyles = {
    fast: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    normal: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    slow: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };

  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          'font-medium gap-1 border',
          speedStyles[speedLevel],
          className
        )}
      >
        <Zap className="h-3 w-3" />
        {formatDuration(timing.processingDurationMs)}
      </Badge>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-sm', className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Started: {formatTime(timing.startTime)}</span>
      </div>
      
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Timer className="h-4 w-4" />
        <span>Completed: {formatTime(timing.endTime)}</span>
      </div>
      
      <Badge 
        variant="outline" 
        className={cn(
          'font-medium gap-1 border',
          speedStyles[speedLevel]
        )}
      >
        <Zap className="h-3 w-3" />
        {formatDuration(timing.processingDurationMs)}
        {speedLevel === 'fast' && ' ⚡'}
      </Badge>

      {timing.promptTokensPerSecond && timing.promptTokensPerSecond > 0 && (
        <span className="text-xs text-muted-foreground">
          ({timing.promptTokensPerSecond.toFixed(1)} tokens/sec)
        </span>
      )}
    </div>
  );
}

export default AuditTimingDisplay;
