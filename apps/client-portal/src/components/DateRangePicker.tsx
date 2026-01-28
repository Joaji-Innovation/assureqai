'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange, DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return 'Select date range';
    }
    if (dateRange.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    return format(dateRange.from, 'MMM d, yyyy');
  };

  // Preset ranges
  const presets = [
    {
      label: 'Today',
      range: { from: new Date(), to: new Date() },
    },
    {
      label: 'Last 7 Days',
      range: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
    {
      label: 'Last 30 Days',
      range: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
    {
      label: 'This Month',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      },
    },
    {
      label: 'Last Month',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    },
  ];

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm hover:bg-muted transition-colors"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{formatDateRange()}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-card border border-border rounded-xl shadow-xl p-4 flex gap-4">
          {/* Presets */}
          <div className="flex flex-col gap-1 border-r border-border pr-4">
            <span className="text-xs font-medium text-muted-foreground mb-2">Quick Select</span>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onDateRangeChange(preset.range);
                  setIsOpen(false);
                }}
                className="text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors"
              >
                {preset.label}
              </button>
            ))}
            <div className="border-t border-border my-2" />
            <button
              onClick={() => {
                onDateRangeChange(undefined);
                setIsOpen(false);
              }}
              className="text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Calendar */}
          <div>
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              className="text-sm"
              classNames={{
                months: 'flex gap-4',
                month: 'space-y-2',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium',
                nav: 'space-x-1 flex items-center',
                nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-border',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
                row: 'flex w-full mt-1',
                cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md inline-flex items-center justify-center',
                day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                day_today: 'bg-accent text-accent-foreground',
                day_outside: 'text-muted-foreground opacity-50',
                day_disabled: 'text-muted-foreground opacity-50',
                day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                day_hidden: 'invisible',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
