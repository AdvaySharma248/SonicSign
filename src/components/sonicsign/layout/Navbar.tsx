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
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'sign-requests', label: 'Sign Requests', icon: Send },
  { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const springTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};

export function Navbar() {
  const { currentPage, setCurrentPage } = useAppStore();

  const activeIndex = navItems.findIndex((item) => item.id === currentPage);

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div
        className={cn(
          'flex items-center gap-1 px-1.5 py-1.5',
          'rounded-2xl',
          'bg-white/80 backdrop-blur-xl',
          'border border-[#E5E7EB]/60',
          'shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.1)_inset]'
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
                'relative flex items-center gap-2 px-4 py-2 rounded-xl',
                'text-sm font-medium transition-colors duration-200',
                'cursor-pointer select-none outline-none',
                'hover:text-[#111827]',
                isActive
                  ? 'text-[#365CF5]'
                  : 'text-[#6B7280]'
              )}
            >
              {/* Fluid bubble indicator */}
              {isActive && (
                <motion.div
                  layoutId="navbar-fluid-bubble"
                  transition={springTransition}
                  className={cn(
                    'absolute inset-0 rounded-xl',
                    'bg-[#EEF2FF]'
                  )}
                  style={{ originX: 0.5 }}
                />
              )}

              {/* Content */}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="hidden lg:inline">{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
