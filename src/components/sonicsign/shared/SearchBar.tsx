'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchBarProps) {
  const hasValue = value.length > 0;

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search
          size={16}
          className={cn(
            'transition-colors duration-200',
            hasValue ? 'text-[#365CF5]' : 'text-[#9CA3AF]'
          )}
        />
      </div>

      {/* Input */}
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'pl-9 pr-8 h-10',
          'rounded-xl',
          'bg-[#FFFFFF] border-[#E5E7EB]',
          'text-[#111827] text-sm',
          'transition-all duration-200',
          'placeholder:text-[#9CA3AF]',
          'focus-visible:border-[#365CF5] focus-visible:ring-[#365CF5]/20',
          'hover:border-[#D1D5DB]'
        )}
      />

      {/* Clear Button */}
      {hasValue && (
        <button
          onClick={handleClear}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            'flex items-center justify-center',
            'size-5 rounded-full',
            'bg-[#E5E7EB] hover:bg-[#D1D5DB]',
            'text-[#6B7280] hover:text-[#374151]',
            'transition-all duration-150',
            'cursor-pointer outline-none'
          )}
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
