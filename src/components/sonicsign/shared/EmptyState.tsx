'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'py-16 px-6',
        'text-center',
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          'flex items-center justify-center',
          'size-14 rounded-2xl',
          'bg-[#EEF2FF] mb-5'
        )}
      >
        <Icon size={26} className="text-[#365CF5]" strokeWidth={1.8} />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'text-base text-section-title text-[#111827] mb-1.5'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={cn(
          'text-sm text-body text-[#6B7280] max-w-xs leading-relaxed mb-6'
        )}
      >
        {description}
      </p>

      {/* Optional Action */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className={cn(
            'h-9 px-5 rounded-xl',
            'bg-[#365CF5] hover:bg-[#2B50E6]',
            'text-white text-sm text-button',
            'transition-colors duration-150'
          )}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
