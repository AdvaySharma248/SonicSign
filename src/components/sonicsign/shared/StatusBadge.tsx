'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DocumentStatus, RequestStatus } from '@/types';

type BadgeStatus = DocumentStatus | RequestStatus;

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusConfig: Record<
  BadgeStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    dotClass: string;
  }
> = {
  draft: {
    label: 'Draft',
    bgClass: 'bg-[#F3F4F6]',
    textClass: 'text-[#6B7280]',
    dotClass: 'bg-[#9CA3AF]',
  },
  pending: {
    label: 'Pending',
    bgClass: 'bg-[#FEF3C7]',
    textClass: 'text-[#92400E]',
    dotClass: 'bg-[#F59E0B]',
  },
  sent: {
    label: 'Sent',
    bgClass: 'bg-[#DBEAFE]',
    textClass: 'text-[#1E40AF]',
    dotClass: 'bg-[#3B82F6]',
  },
  viewed: {
    label: 'Viewed',
    bgClass: 'bg-[#E0E7FF]',
    textClass: 'text-[#3730A3]',
    dotClass: 'bg-[#6366F1]',
  },
  signed: {
    label: 'Signed',
    bgClass: 'bg-[#D1FAE5]',
    textClass: 'text-[#065F46]',
    dotClass: 'bg-[#10B981]',
  },
  rejected: {
    label: 'Rejected',
    bgClass: 'bg-[#FEE2E2]',
    textClass: 'text-[#991B1B]',
    dotClass: 'bg-[#EF4444]',
  },
  expired: {
    label: 'Expired',
    bgClass: 'bg-[#FFEDD5]',
    textClass: 'text-[#9A3412]',
    dotClass: 'bg-[#F97316]',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.draft;

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'rounded-full border-0 text-xs font-medium',
        'transition-colors duration-150',
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span
        className={cn('size-1.5 rounded-full shrink-0', config.dotClass)}
      />
      {config.label}
    </Badge>
  );
}
