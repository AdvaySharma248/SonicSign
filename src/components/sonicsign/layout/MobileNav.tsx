'use client';

import { useState } from 'react';
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

// ─── Navigation Items ───────────────────────────────────────────────
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

// ─── Spring Physics ─────────────────────────────────────────────────
const fluidSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 22,
  mass: 1.1,
};

const glowSpring = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 26,
  mass: 1.6,
};

const deformSpring = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 18,
  mass: 0.5,
};

// ─── Component ──────────────────────────────────────────────────────
export function MobileNav() {
  const { currentPage, setCurrentPage } = useAppStore();
  const [hoveredTab, setHoveredTab] = useState<PageRoute | null>(null);

  const activeIndex = navItems.findIndex((item) => item.id === currentPage);
  const hoveredIndex = hoveredTab
    ? navItems.findIndex((item) => item.id === hoveredTab)
    : -1;

  const isNeighborHovered =
    hoveredIndex !== -1 &&
    hoveredIndex !== activeIndex &&
    Math.abs(hoveredIndex - activeIndex) === 1;

  const magneticOffset = isNeighborHovered
    ? (hoveredIndex - activeIndex) * 2
    : 0;

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'md:hidden',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <div className="mx-3 mb-3">
        {/* ── Glass Capsule Container ────────────────────────────── */}
        <div
          className={cn(
            'relative flex items-center justify-around px-2 py-2',
            'rounded-[24px]',
          )}
          style={{
            background: 'linear-gradient(0deg, rgba(255,255,255,0.88) 0%, rgba(248,250,252,0.75) 100%)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: [
              '0 -8px 48px rgba(0,0,0,0.08)',
              '0 -2px 12px rgba(0,0,0,0.04)',
              '0 0 0 1px rgba(0,0,0,0.02)',
              'inset 0 -1.5px 0 rgba(255,255,255,1)',
              'inset 0 1px 0 rgba(0,0,0,0.04)',
              'inset 0 0 20px rgba(54,92,245,0.04)',
            ].join(', '),
          }}
        >
          {navItems.map((item) => {
            const isActive = item.id === currentPage;
            const Icon = item.icon;
            const isHovered = item.id === hoveredTab;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'min-w-[52px] py-2.5 px-2',
                  'rounded-[16px]',
                  'transition-colors duration-300',
                  'cursor-pointer select-none outline-none',
                  isActive
                    ? 'text-[#2B4FE0]'
                    : isHovered
                      ? 'text-[#374151]'
                      : 'text-[#9CA3AF]'
                )}
              >
                {/* ── Active: Liquid Fluid Indicator ────────────────── */}
                {isActive && (
                  <>
                    {/* Layer 4: Outermost glow */}
                    <motion.div
                      layoutId="mobilenav-liquid-glow"
                      transition={glowSpring}
                      className="absolute rounded-[20px] pointer-events-none"
                      style={{
                        x: magneticOffset,
                        inset: -10,
                        background:
                          'radial-gradient(ellipse at 50% 50%, rgba(54,92,245,0.18) 0%, rgba(54,92,245,0.08) 35%, transparent 60%)',
                        boxShadow:
                          '0 8px 40px rgba(54,92,245,0.15)',
                      }}
                    />

                    {/* Layer 3: Primary liquid body */}
                    <motion.div
                      layoutId="mobilenav-liquid"
                      transition={fluidSpring}
                      className="absolute inset-0 rounded-[16px] pointer-events-none overflow-hidden"
                      style={{
                        x: magneticOffset,
                        background: [
                          'linear-gradient(150deg,',
                          'rgba(54,92,245,0.28) 0%,',
                          'rgba(54,92,245,0.18) 35%,',
                          'rgba(54,92,245,0.22) 65%,',
                          'rgba(54,92,245,0.15) 100%)',
                        ].join(' '),
                        border: '1px solid rgba(54,92,245,0.30)',
                        boxShadow: [
                          '0 6px 28px rgba(54,92,245,0.22)',
                          '0 2px 10px rgba(54,92,245,0.14)',
                          'inset 0 2px 4px rgba(255,255,255,0.65)',
                          'inset 0 -3px 6px rgba(54,92,245,0.15)',
                          'inset 0 1.5px 0 rgba(255,255,255,0.60)',
                          'inset 3px 0 6px rgba(54,92,245,0.05)',
                          'inset -3px 0 6px rgba(54,92,245,0.05)',
                        ].join(', '),
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                      }}
                    >
                      {/* Light refraction */}
                      <div
                        className="absolute inset-0 rounded-[16px] pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(175deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 20%, transparent 40%, rgba(54,92,245,0.06) 75%, rgba(54,92,245,0.10) 100%)',
                        }}
                      />

                      {/* Breathing */}
                      <motion.div
                        className="absolute inset-0 rounded-[16px] pointer-events-none"
                        animate={{
                          opacity: [0.25, 0.70, 0.25],
                        }}
                        transition={{
                          duration: 3.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        style={{
                          background:
                            'radial-gradient(ellipse at 35% 35%, rgba(54,92,245,0.16) 0%, transparent 55%)',
                        }}
                      />

                      {/* Secondary breathing offset */}
                      <motion.div
                        className="absolute inset-0 rounded-[16px] pointer-events-none"
                        animate={{
                          opacity: [0.15, 0.55, 0.15],
                        }}
                        transition={{
                          duration: 4.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 1.8,
                        }}
                        style={{
                          background:
                            'radial-gradient(ellipse at 65% 65%, rgba(54,92,245,0.12) 0%, transparent 50%)',
                        }}
                      />

                      {/* Shimmer */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(108deg, transparent 20%, rgba(255,255,255,0.22) 38%, rgba(255,255,255,0.10) 45%, transparent 58%)',
                        }}
                        animate={{
                          x: ['-150%', '150%'],
                        }}
                        transition={{
                          duration: 3.5,
                          repeat: Infinity,
                          ease: [0.25, 0.1, 0.25, 1],
                          repeatDelay: 3,
                        }}
                      />
                    </motion.div>

                    {/* Layer 2: Deformation overlay */}
                    <motion.div
                      layoutId="mobilenav-liquid-deform"
                      transition={deformSpring}
                      className="absolute inset-0 rounded-[16px] pointer-events-none overflow-hidden"
                      style={{
                        x: magneticOffset,
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-[16px]"
                        style={{
                          background:
                            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        key={`deform-${currentPage}`}
                      />
                    </motion.div>
                  </>
                )}

                {/* ── Hover: Magnetic pull glow ─────────────────────── */}
                {!isActive && isHovered && (
                  <motion.div
                    layoutId="mobilenav-hover-glow"
                    className="absolute inset-0 rounded-[16px] pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      background:
                        'radial-gradient(ellipse at center, rgba(54,92,245,0.08) 0%, transparent 70%)',
                    }}
                  />
                )}

                {/* ── Icon ──────────────────────────────────────────── */}
                <motion.span
                  className="relative z-10"
                  animate={{
                    scale: isActive ? 1.16 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                  <Icon
                    size={isActive ? 20 : 18}
                    strokeWidth={isActive ? 2.3 : 1.6}
                    className={cn(
                      'transition-all duration-300',
                      isActive && 'drop-shadow-[0_0_12px_rgba(54,92,245,0.45)]'
                    )}
                  />
                </motion.span>

                {/* ── Label ─────────────────────────────────────────── */}
                <motion.span
                  className={cn(
                    'relative z-10 text-[10px] mt-0.5 font-medium leading-tight',
                  )}
                  animate={{
                    opacity: isActive ? 1 : 0.45,
                  }}
                  transition={{ duration: 0.2 }}
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
