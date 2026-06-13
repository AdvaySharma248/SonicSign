'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'sign-requests', label: 'Sign Requests', icon: Send },
  { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ─── Spring Physics ─────────────────────────────────────────────────
// Primary liquid: heavy mass creates visible overshoot & settle
const fluidSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 24,
  mass: 1.2,
};

// Glow layer: slower parallax — liquid light trailing behind
const glowSpring = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 20,
  mass: 2.0,
};

// Deformation: quick stretch/squish that snaps back
const deformSpring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 16,
  mass: 0.4,
};

// Border radius morphing: independent timing for organic shape
const borderRadiusSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 18,
  mass: 0.8,
};

// Magnetic hover: soft pull toward cursor
const magneticSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28,
  mass: 0.6,
};

// ─── Component ──────────────────────────────────────────────────────
export function Navbar() {
  const { currentPage, setCurrentPage } = useAppStore();
  const [hoveredTab, setHoveredTab] = useState<PageRoute | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(0); // -1 left, 1 right, 0 none
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeIndex = navItems.findIndex((item) => item.id === currentPage);
  const hoveredIndex = hoveredTab
    ? navItems.findIndex((item) => item.id === hoveredTab)
    : -1;

  // Magnetic pull — liquid leans toward hovered neighbor
  const isNeighborHovered =
    hoveredIndex !== -1 &&
    hoveredIndex !== activeIndex &&
    Math.abs(hoveredIndex - activeIndex) === 1;

  const magneticOffset = isNeighborHovered
    ? (hoveredIndex - activeIndex) * 5
    : 0;

  // Deformation scale during transition — liquid stretches in travel direction
  const deformScaleX = isTransitioning ? 1.08 + Math.abs(direction) * 0.06 : 1;
  const deformScaleY = isTransitioning ? 0.92 : 1;

  // Border radius morphing — deformed during travel, settled at rest
  const borderTopRadius = isTransitioning
    ? direction > 0 ? '20px' : '10px'
    : '16px';
  const borderBottomRadius = isTransitioning
    ? direction > 0 ? '10px' : '20px'
    : '16px';

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
        }, 600);
      }
      setCurrentPage(page);
    },
    [activeIndex, setCurrentPage]
  );

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      {/* ── Glass Capsule Container ──────────────────────────────── */}
      <div
        ref={navRef}
        className={cn(
          'relative flex items-center gap-0.5 px-2 py-2',
          'rounded-[28px]',
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.82) 100%)',
          backdropFilter: 'blur(60px) saturate(220%)',
          WebkitBackdropFilter: 'blur(60px) saturate(220%)',
          border: '1px solid rgba(255,255,255,0.90)',
          boxShadow: [
            // Primary elevation — floating shadow
            '0 12px 60px rgba(0,0,0,0.10)',
            '0 4px 16px rgba(0,0,0,0.05)',
            // Outer ring
            '0 0 0 1px rgba(0,0,0,0.03)',
            // Top highlight — glass edge catching light
            'inset 0 2px 0 rgba(255,255,255,1)',
            // Bottom shadow — glass thickness
            'inset 0 -1.5px 0 rgba(0,0,0,0.05)',
            // Inner ambient — faint blue glow inside tube
            'inset 0 0 30px rgba(54,92,245,0.05)',
            // Depth shadow — slight purple/blue tint
            '0 8px 32px rgba(54,92,245,0.06)',
          ].join(', '),
        }}
      >
        {/* ── Inner ambient glow along the tube ────────────────── */}
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
          const isAdjacentToActive =
            Math.abs(index - activeIndex) === 1 && !isActive;

          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) tabRefs.current.set(item.id, el);
              }}
              onClick={() => handlePageChange(item.id)}
              onMouseEnter={() => setHoveredTab(item.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2.5',
                'rounded-[18px]',
                'text-[13px] font-medium',
                'cursor-pointer select-none outline-none',
                'transition-colors duration-300',
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
                  {/* Layer 5: Deep ambient glow — light spilling far from liquid */}
                  <motion.div
                    layoutId="nav-liquid-ambient"
                    transition={glowSpring}
                    className="absolute rounded-[24px] pointer-events-none"
                    style={{
                      x: magneticOffset,
                      inset: -18,
                      background:
                        'radial-gradient(ellipse at 50% 50%, rgba(54,92,245,0.12) 0%, rgba(54,92,245,0.05) 40%, transparent 70%)',
                      filter: 'blur(8px)',
                    }}
                  />

                  {/* Layer 4: Outermost diffuse glow — liquid radiating light */}
                  <motion.div
                    layoutId="nav-liquid-glow"
                    transition={glowSpring}
                    className="absolute rounded-[22px] pointer-events-none"
                    style={{
                      x: magneticOffset,
                      inset: -10,
                      background:
                        'radial-gradient(ellipse at 50% 50%, rgba(54,92,245,0.20) 0%, rgba(54,92,245,0.10) 35%, transparent 60%)',
                      boxShadow: [
                        '0 10px 50px rgba(54,92,245,0.18)',
                        '0 4px 20px rgba(54,92,245,0.12)',
                      ].join(', '),
                    }}
                  />

                  {/* Layer 3b: Secondary blurred layer — depth behind glass */}
                  <motion.div
                    layoutId="nav-liquid-blur"
                    transition={{
                      ...glowSpring,
                      stiffness: 160,
                      mass: 2.2,
                    }}
                    className="absolute inset-0 rounded-[18px] pointer-events-none"
                    style={{
                      x: magneticOffset,
                      background:
                        'rgba(54,92,245,0.15)',
                      filter: 'blur(18px)',
                      transform: 'scale(1.3)',
                    }}
                  />

                  {/* Layer 3: Primary liquid body — the visible fluid inside glass */}
                  <motion.div
                    layoutId="nav-liquid"
                    transition={fluidSpring}
                    className="absolute inset-0 rounded-[18px] pointer-events-none overflow-hidden"
                    style={{
                      x: magneticOffset,
                      scaleX: deformScaleX,
                      scaleY: deformScaleY,
                      borderTopLeftRadius: borderTopRadius,
                      borderTopRightRadius: borderTopRadius,
                      borderBottomLeftRadius: borderBottomRadius,
                      borderBottomRightRadius: borderBottomRadius,
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
                        // Strong outer glow — liquid radiating light
                        '0 8px 32px rgba(54,92,245,0.25)',
                        // Secondary glow ring
                        '0 3px 12px rgba(54,92,245,0.16)',
                        // Top inner highlight — light hitting liquid surface
                        'inset 0 2.5px 5px rgba(255,255,255,0.70)',
                        // Bottom inner — liquid depth
                        'inset 0 -4px 8px rgba(54,92,245,0.18)',
                        // Top edge reflection — glass above liquid
                        'inset 0 2px 0 rgba(255,255,255,0.65)',
                        // Side vignettes — liquid edges
                        'inset 4px 0 8px rgba(54,92,245,0.06)',
                        'inset -4px 0 8px rgba(54,92,245,0.06)',
                        // Bottom edge — slight shadow
                        'inset 0 -1px 0 rgba(54,92,245,0.10)',
                      ].join(', '),
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                    }}
                  >
                    {/* Light refraction gradient — surface of the liquid */}
                    <div
                      className="absolute inset-0 rounded-[18px] pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(178deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.15) 18%, transparent 38%, rgba(54,92,245,0.04) 65%, rgba(54,92,245,0.12) 100%)',
                      }}
                    />

                    {/* Primary breathing — liquid is alive, gently pulsing */}
                    <motion.div
                      className="absolute inset-0 rounded-[18px] pointer-events-none"
                      animate={{
                        opacity: [0.20, 0.65, 0.20],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        background:
                          'radial-gradient(ellipse at 35% 30%, rgba(54,92,245,0.20) 0%, transparent 55%)',
                      }}
                    />

                    {/* Secondary breathing offset — organic liquid movement */}
                    <motion.div
                      className="absolute inset-0 rounded-[18px] pointer-events-none"
                      animate={{
                        opacity: [0.10, 0.50, 0.10],
                        scale: [1, 1.03, 1],
                      }}
                      transition={{
                        duration: 4.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1.6,
                      }}
                      style={{
                        background:
                          'radial-gradient(ellipse at 65% 70%, rgba(54,92,245,0.15) 0%, transparent 50%)',
                      }}
                    />

                    {/* Shimmer — light caustic sliding across liquid surface */}
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
                        ease: [0.25, 0.1, 0.25, 1],
                        repeatDelay: 4,
                      }}
                    />

                    {/* Secondary shimmer offset — double caustic */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(75deg, transparent 25%, rgba(255,255,255,0.14) 42%, rgba(255,255,255,0.06) 50%, transparent 62%)',
                      }}
                      animate={{
                        x: ['-180%', '180%'],
                      }}
                      transition={{
                        duration: 4.5,
                        repeat: Infinity,
                        ease: [0.25, 0.1, 0.25, 1],
                        repeatDelay: 5,
                        delay: 2,
                      }}
                    />
                  </motion.div>

                  {/* Layer 2: Deformation flash — stretch/squish during travel */}
                  <motion.div
                    layoutId="nav-liquid-deform"
                    transition={deformSpring}
                    className="absolute inset-0 rounded-[18px] pointer-events-none overflow-hidden"
                    style={{
                      x: magneticOffset,
                      scaleX: deformScaleX,
                      scaleY: deformScaleY,
                      borderTopLeftRadius: borderTopRadius,
                      borderTopRightRadius: borderTopRadius,
                      borderBottomLeftRadius: borderBottomRadius,
                      borderBottomRightRadius: borderBottomRadius,
                    }}
                  >
                    {/* Flash during tab switch — liquid displacement burst */}
                    <motion.div
                      className="absolute inset-0 rounded-[18px]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      key={`deform-${currentPage}`}
                    />
                  </motion.div>
                </>
              )}

              {/* ── Hover: Magnetic pull glow on non-active adjacent tabs ── */}
              {!isActive && isHovered && (
                <motion.div
                  layoutId="nav-hover-glow"
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

              {/* ── Adjacent tab: subtle pull indicator ────────────── */}
              {!isActive && isAdjacentToActive && isHovered && (
                <motion.div
                  className="absolute inset-0 rounded-[18px] pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    boxShadow: `inset ${index < activeIndex ? 4 : -4}px 0 12px rgba(54,92,245,0.06)`,
                  }}
                />
              )}

              {/* ── Tab Content ──────────────────────────────────── */}
              <span className="relative z-10 flex items-center gap-2">
                <motion.span
                  animate={{
                    scale: isActive ? 1.15 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.4 : 1.6}
                    className={cn(
                      'transition-all duration-300',
                      isActive && 'drop-shadow-[0_0_14px_rgba(54,92,245,0.50)]'
                    )}
                  />
                </motion.span>
                <span className="hidden lg:inline">{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
