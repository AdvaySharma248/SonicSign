'use client';

import { useState, useRef, useCallback } from 'react';
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
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
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
  stiffness: 300,
  damping: 24,
  mass: 1.2,
};

const glowSpring = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 20,
  mass: 2.0,
};

const deformSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 16,
  mass: 0.4,
};

// ─── Component ──────────────────────────────────────────────────────
export function MobileNav() {
  const { currentPage, setCurrentPage } = useAppStore();
  const [hoveredTab, setHoveredTab] = useState<PageRoute | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Deformation during transition
  const deformScaleX = isTransitioning ? 1.06 + Math.abs(direction) * 0.04 : 1;
  const deformScaleY = isTransitioning ? 0.94 : 1;

  const handlePageChange = useCallback(
    (page: PageRoute) => {
      const newIndex = navItems.findIndex((item) => item.id === page);
      if (newIndex !== activeIndex) {
        const diff = newIndex - activeIndex;
        setDirection(diff > 0 ? 1 : -1);
        setIsTransitioning(true);

        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
        }
        transitionTimerRef.current = setTimeout(() => {
          setIsTransitioning(false);
          setDirection(0);
        }, 500);
      }
      setCurrentPage(page);
    },
    [activeIndex, setCurrentPage]
  );

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
            'rounded-[28px]',
          )}
          style={{
            background: 'linear-gradient(0deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.82) 100%)',
            backdropFilter: 'blur(60px) saturate(220%)',
            WebkitBackdropFilter: 'blur(60px) saturate(220%)',
            border: '1px solid rgba(255,255,255,0.90)',
            boxShadow: [
              '0 -12px 60px rgba(0,0,0,0.10)',
              '0 -4px 16px rgba(0,0,0,0.05)',
              '0 0 0 1px rgba(0,0,0,0.03)',
              'inset 0 -2px 0 rgba(255,255,255,1)',
              'inset 0 1.5px 0 rgba(0,0,0,0.05)',
              'inset 0 0 30px rgba(54,92,245,0.05)',
              '0 -8px 32px rgba(54,92,245,0.06)',
            ].join(', '),
          }}
        >
          {/* Inner ambient glow along the tube */}
          <div
            className="absolute inset-0 rounded-[28px] pointer-events-none overflow-hidden"
            style={{
              background:
                'linear-gradient(90deg, rgba(54,92,245,0.02) 0%, rgba(54,92,245,0.06) 50%, rgba(54,92,245,0.02) 100%)',
            }}
          />

          {navItems.map((item, index) => {
            const isActive = item.id === currentPage;
            const Icon = item.icon;
            const isHovered = item.id === hoveredTab;

            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'min-w-[52px] py-2.5 px-2',
                  'rounded-[18px]',
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
                    {/* Layer 5: Deep ambient glow */}
                    <motion.div
                      layoutId="mobilenav-liquid-ambient"
                      transition={glowSpring}
                      className="absolute rounded-[24px] pointer-events-none"
                      style={{
                        x: magneticOffset,
                        inset: -14,
                        background:
                          'radial-gradient(ellipse at 50% 50%, rgba(54,92,245,0.12) 0%, rgba(54,92,245,0.05) 40%, transparent 70%)',
                        filter: 'blur(6px)',
                      }}
                    />

                    {/* Layer 4: Outermost diffuse glow */}
                    <motion.div
                      layoutId="mobilenav-liquid-glow"
                      transition={glowSpring}
                      className="absolute rounded-[22px] pointer-events-none"
                      style={{
                        x: magneticOffset,
                        inset: -8,
                        background:
                          'radial-gradient(ellipse at 50% 50%, rgba(54,92,245,0.20) 0%, rgba(54,92,245,0.10) 35%, transparent 60%)',
                        boxShadow: [
                          '0 8px 40px rgba(54,92,245,0.18)',
                          '0 3px 16px rgba(54,92,245,0.12)',
                        ].join(', '),
                      }}
                    />

                    {/* Layer 3b: Secondary blurred layer — depth */}
                    <motion.div
                      layoutId="mobilenav-liquid-blur"
                      transition={{
                        ...glowSpring,
                        stiffness: 160,
                        mass: 2.2,
                      }}
                      className="absolute inset-0 rounded-[18px] pointer-events-none"
                      style={{
                        x: magneticOffset,
                        background: 'rgba(54,92,245,0.15)',
                        filter: 'blur(14px)',
                        transform: 'scale(1.25)',
                      }}
                    />

                    {/* Layer 3: Primary liquid body */}
                    <motion.div
                      layoutId="mobilenav-liquid"
                      transition={fluidSpring}
                      className="absolute inset-0 rounded-[18px] pointer-events-none overflow-hidden"
                      style={{
                        x: magneticOffset,
                        scaleX: deformScaleX,
                        scaleY: deformScaleY,
                        background: [
                          'linear-gradient(155deg,',
                          'rgba(54,92,245,0.32) 0%,',
                          'rgba(54,92,245,0.20) 30%,',
                          'rgba(54,92,245,0.25) 55%,',
                          'rgba(54,92,245,0.18) 80%,',
                          'rgba(54,92,245,0.14) 100%)',
                        ].join(' '),
                        border: '1px solid rgba(54,92,245,0.35)',
                        boxShadow: [
                          '0 6px 28px rgba(54,92,245,0.25)',
                          '0 2px 10px rgba(54,92,245,0.16)',
                          'inset 0 2.5px 5px rgba(255,255,255,0.70)',
                          'inset 0 -4px 8px rgba(54,92,245,0.18)',
                          'inset 0 2px 0 rgba(255,255,255,0.65)',
                          'inset 4px 0 8px rgba(54,92,245,0.06)',
                          'inset -4px 0 8px rgba(54,92,245,0.06)',
                        ].join(', '),
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                      }}
                    >
                      {/* Light refraction */}
                      <div
                        className="absolute inset-0 rounded-[18px] pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(178deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.15) 18%, transparent 38%, rgba(54,92,245,0.04) 65%, rgba(54,92,245,0.12) 100%)',
                        }}
                      />

                      {/* Primary breathing */}
                      <motion.div
                        className="absolute inset-0 rounded-[18px] pointer-events-none"
                        animate={{
                          opacity: [0.20, 0.65, 0.20],
                          scale: [1, 1.02, 1],
                        }}
                        transition={{
                          duration: 3.2,
                          repeat: Infinity,
                          ease: 'easeInOut' as const,
                        }}
                        style={{
                          background:
                            'radial-gradient(ellipse at 35% 30%, rgba(54,92,245,0.20) 0%, transparent 55%)',
                        }}
                      />

                      {/* Secondary breathing offset */}
                      <motion.div
                        className="absolute inset-0 rounded-[18px] pointer-events-none"
                        animate={{
                          opacity: [0.10, 0.50, 0.10],
                          scale: [1, 1.03, 1],
                        }}
                        transition={{
                          duration: 4.2,
                          repeat: Infinity,
                          ease: 'easeInOut' as const,
                          delay: 1.6,
                        }}
                        style={{
                          background:
                            'radial-gradient(ellipse at 65% 70%, rgba(54,92,245,0.15) 0%, transparent 50%)',
                        }}
                      />

                      {/* Shimmer */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(108deg, transparent 18%, rgba(255,255,255,0.28) 36%, rgba(255,255,255,0.12) 44%, transparent 56%)',
                        }}
                        animate={{
                          x: ['-160%', '160%'],
                        }}
                        transition={{
                          duration: 3.0,
                          repeat: Infinity,
                          ease: 'easeInOut' as const,
                          repeatDelay: 4,
                        }}
                      />
                    </motion.div>

                    {/* Layer 2: Deformation overlay */}
                    <motion.div
                      layoutId="mobilenav-liquid-deform"
                      transition={deformSpring}
                      className="absolute inset-0 rounded-[18px] pointer-events-none overflow-hidden"
                      style={{
                        x: magneticOffset,
                        scaleX: deformScaleX,
                        scaleY: deformScaleY,
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-[18px]"
                        style={{
                          background:
                            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.45, ease: 'easeOut' as const }}
                        key={`deform-${currentPage}`}
                      />
                    </motion.div>
                  </>
                )}

                {/* ── Hover: Magnetic pull glow ─────────────────────── */}
                {!isActive && isHovered && (
                  <motion.div
                    layoutId="mobilenav-hover-glow"
                    className="absolute inset-0 rounded-[18px] pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      background:
                        'radial-gradient(ellipse at center, rgba(54,92,245,0.10) 0%, rgba(54,92,245,0.04) 50%, transparent 70%)',
                      border: '1px solid rgba(54,92,245,0.12)',
                    }}
                  />
                )}

                {/* ── Icon ──────────────────────────────────────────── */}
                <motion.span
                  className="relative z-10"
                  animate={{
                    scale: isActive ? 1.18 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                  <Icon
                    size={isActive ? 20 : 18}
                    strokeWidth={isActive ? 2.4 : 1.6}
                    className={cn(
                      'transition-all duration-300',
                      isActive && 'drop-shadow-[0_0_14px_rgba(54,92,245,0.50)]'
                    )}
                  />
                </motion.span>

                {/* ── Label ─────────────────────────────────────────── */}
                <motion.span
                  className={cn(
                    'relative z-10 text-[10px] mt-0.5 text-label leading-tight',
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
