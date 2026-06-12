'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Send,
  ScrollText,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { PageRoute } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  id: PageRoute;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  shortLabel: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortLabel: 'Home' },
  { id: 'documents', label: 'Documents', icon: FileText, shortLabel: 'Docs' },
  { id: 'sign-requests', label: 'Sign Requests', icon: Send, shortLabel: 'Sign' },
  { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText, shortLabel: 'Logs' },
  { id: 'settings', label: 'Settings', icon: Settings, shortLabel: 'Settings' },
];

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.7,
};

export function MobileNav() {
  const { currentPage, setCurrentPage } = useAppStore();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'md:hidden',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <div className="mx-3 mb-3">
        <div
          className={cn(
            'flex items-center justify-around px-2 py-2',
            'rounded-2xl',
            'bg-white/80 backdrop-blur-xl',
            'border border-[#E5E7EB]/60',
            'shadow-[0_-2px_20px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.1)_inset]'
          )}
        >
          {navItems.map((item) => {
            const isActive = item.id === currentPage;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'min-w-[56px] py-1.5 px-2 rounded-xl',
                  'transition-colors duration-200',
                  'cursor-pointer select-none outline-none',
                  isActive ? 'text-[#365CF5]' : 'text-[#6B7280]'
                )}
              >
                {/* Active background bubble */}
                {isActive && (
                  <motion.div
                    layoutId="mobilenav-fluid-bubble"
                    transition={springTransition}
                    className="absolute inset-0 rounded-xl bg-[#EEF2FF]"
                  />
                )}

                {/* Icon */}
                <motion.span
                  className="relative z-10"
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={springTransition}
                >
                  <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.2 : 1.8} />
                </motion.span>

                {/* Label */}
                <motion.span
                  className={cn(
                    'relative z-10 text-[10px] mt-0.5 font-medium leading-tight',
                    'transition-opacity duration-200',
                    isActive ? 'opacity-100' : 'opacity-70'
                  )}
                  animate={{
                    opacity: isActive ? 1 : 0.7,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {item.shortLabel}
                </motion.span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
