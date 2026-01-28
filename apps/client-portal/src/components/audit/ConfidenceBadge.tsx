'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ConfidenceBadge - Displays AI confidence level with color coding
 * High (85-100): Green - AI is very confident
 * Medium (60-84): Amber - AI is moderately confident  
 * Low (0-59): Red - AI is uncertain, human review recommended
 */
export function ConfidenceBadge({ 
  confidence, 
  showIcon = true, 
  size = 'sm',
  className 
}: ConfidenceBadgeProps) {
  const level = confidence >= 85 ? 'high' : confidence >= 60 ? 'medium' : 'low';
  
  const styles = {
    high: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    low: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const icons = {
    high: ShieldCheck,
    medium: ShieldQuestion,
    low: ShieldAlert,
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const Icon = icons[level];

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium gap-1 border',
        styles[level],
        sizes[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {confidence}%
    </Badge>
  );
}

export default ConfidenceBadge;
