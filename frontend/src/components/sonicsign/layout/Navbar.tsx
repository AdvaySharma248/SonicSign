'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'sign-requests', label: 'Sign Requests', icon: Send },
  { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { currentPage, setCurrentPage } = useAppStore();
  const [hoveredTab, setHoveredTab] = useState<PageRoute | null>(null);
  
  const navRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // Physics state for left and right endpoints of the liquid pool
  const xLRef = useRef(0);
  const xRRef = useRef(0);
  const vxLRef = useRef(0);
  const vxRRef = useRef(0);

  // Surface Wave Nodes (Top surface of the shallow water layer)
  const numNodes = 15;
  const yTopRef = useRef<number[]>(new Array(numNodes).fill(0));
  const vyTopRef = useRef<number[]>(new Array(numNodes).fill(0));

  // Mouse coords relative to canvas
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  const handlePageChange = useCallback(
    (page: PageRoute) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const navbarEl = navRef.current;
    if (!navbarEl) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    navbarEl.addEventListener('mousemove', handleMouseMove);
    navbarEl.addEventListener('mouseleave', handleMouseLeave);

    const runPhysics = () => {
      if (!canvas || !ctx || !navbarEl) return;

      // High-DPI canvas configuration
      const dpr = window.devicePixelRatio || 1;
      const width = navbarEl.clientWidth;
      const height = navbarEl.clientHeight;
      
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);
      }

      // Query active tab target coordinates relative to navbar
      const activeTabEl = tabRefs.current.get(currentPage);
      let targetLeft = 0;
      let targetRight = 0;
      
      if (activeTabEl) {
        const activeRect = activeTabEl.getBoundingClientRect();
        const navRect = navbarEl.getBoundingClientRect();
        const pad = 12; // margin inside capsule
        targetLeft = activeRect.left - navRect.left + pad;
        targetRight = activeRect.right - navRect.left - pad;
      }

      // Initialize liquid position to active tab target on first frame
      if (xLRef.current === 0 && xRRef.current === 0 && targetLeft !== 0) {
        xLRef.current = targetLeft;
        xRRef.current = targetRight;
        // Initialize wave heights
        yTopRef.current.fill(height - 10);
      }

      // Physics constants: High mass and damping for heavy, viscous fluid flow
      const stiffness = 0.05; // Slow, luxurious acceleration
      const damping = 0.84;   // Dampened settle (no chaotic jelly vibrations)
      
      let stiffnessL = stiffness;
      let stiffnessR = stiffness;
      
      // Calculate travel direction to lag trailing edge (viscous stretching)
      const isMovingRight = (targetRight + targetLeft) / 2 > (xRRef.current + xLRef.current) / 2;
      const distanceToTarget = Math.abs(targetRight - xRRef.current);

      if (distanceToTarget > 4) {
        if (isMovingRight) {
          stiffnessL = stiffness * 0.52; // Trailing left edge lags
        } else {
          stiffnessR = stiffness * 0.52; // Trailing right edge lags
        }
      }

      // Apply spring forces to left and right boundaries
      const forceL = (targetLeft - xLRef.current) * stiffnessL;
      vxLRef.current = (vxLRef.current + forceL) * damping;
      xLRef.current += vxLRef.current;

      const forceR = (targetRight - xRRef.current) * stiffnessR;
      vxRRef.current = (vxRRef.current + forceR) * damping;
      xRRef.current += vxRRef.current;

      // Minimum capsule width constraints
      const currentWidth = xRRef.current - xLRef.current;
      const minWidth = 64; 
      if (currentWidth < minWidth) {
        const center = (xRRef.current + xLRef.current) / 2;
        xLRef.current = center - minWidth / 2;
        xRRef.current = center + minWidth / 2;
      }

      // Inertial sloshing acceleration force
      const bubbleAccel = (vxLRef.current + vxRRef.current) / 2;
      
      // Surface wave values for heavy viscous water ripples
      const waveStiffness = 0.035; // Low-frequency oscillation
      const waveTension = 0.055;  // Smooth surface tension
      const waveDamping = 0.90;   // Highly dampened sloshing
      const sloshFactor = 1.4;    // Subtle inertial reaction
      
      const yTop = yTopRef.current;
      const vyTop = vyTopRef.current;
      const bubbleW = xRRef.current - xLRef.current;

      const baseTop = height - 9; // Shallow layer height (9px from bottom)

      // Update surface wave nodes
      for (let i = 0; i < numNodes; i++) {
        // Inertial sloshing force
        const relativePos = i / (numNodes - 1) - 0.5;
        const slosh = -bubbleAccel * relativePos * sloshFactor;

        // Mouse hover displacement (almost invisible micro-ripples)
        let mouseDisplacement = 0;
        const nodeX = xLRef.current + (i / (numNodes - 1)) * bubbleW;
        
        if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
          const mX = mouseRef.current.x;
          const mY = mouseRef.current.y;
          const dist = Math.abs(nodeX - mX);
          const maxDist = 32;
          // Only react if cursor is close to the bottom/water surface
          if (dist < maxDist && mY > height - 16) {
            const factor = (1 - dist / maxDist) * 0.75;
            mouseDisplacement = factor; // Pushes surface line down slightly
          }
        }

        // Top waves spring-coupling
        const forceYTop = (baseTop - yTop[i] + slosh + mouseDisplacement) * waveStiffness;
        let couplingTop = 0;
        if (i > 0) couplingTop += (yTop[i-1] - yTop[i]) * waveTension;
        if (i < numNodes - 1) couplingTop += (yTop[i+1] - yTop[i]) * waveTension;

        vyTop[i] = (vyTop[i] + forceYTop + couplingTop) * waveDamping;
        yTop[i] += vyTop[i];
      }

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // ADVANCED MASKING: Clip drawing to the navbar rounded capsule shape
      ctx.beginPath();
      const radius = 28; // capsule radius matches rounded-[28px]
      ctx.moveTo(radius, 0);
      ctx.lineTo(width - radius, 0);
      ctx.arcTo(width, 0, width, height, radius);
      ctx.lineTo(width, height - radius);
      ctx.arcTo(width, height, width - radius, height, radius);
      ctx.lineTo(radius, height);
      ctx.arcTo(0, height, 0, height - radius, radius);
      ctx.lineTo(0, radius);
      ctx.arcTo(0, 0, radius, 0, radius);
      ctx.closePath();
      ctx.clip();

      const xL = xLRef.current;
      const xR = xRRef.current;

      // 1. Draw Liquid Pool (shallow layer matching rounded boundaries automatically via clip mask)
      ctx.beginPath();
      ctx.moveTo(xL, height);
      ctx.lineTo(xL, yTop[0]);
      for (let i = 1; i < numNodes; i++) {
        const px = xL + (i / (numNodes - 1)) * bubbleW;
        ctx.lineTo(px, yTop[i]);
      }
      ctx.lineTo(xR, yTop[numNodes - 1]);
      ctx.lineTo(xR, height);
      ctx.closePath();

      // Volumetric vertical opacity gradient (deeper blue at bottom, lighter at top)
      const liquidGrad = ctx.createLinearGradient(0, height - 12, 0, height);
      liquidGrad.addColorStop(0, 'rgba(54, 92, 245, 0.65)'); // #365CF5 at 65% opacity
      liquidGrad.addColorStop(1, 'rgba(43, 79, 224, 0.78)'); // deeper dark blue at 78% opacity
      
      ctx.fillStyle = liquidGrad;
      ctx.fill();

      // 2. Draw Meniscus Surface Line (Light reflection catch at water boundary)
      ctx.beginPath();
      ctx.moveTo(xL, yTop[0]);
      for (let i = 1; i < numNodes; i++) {
        const px = xL + (i / (numNodes - 1)) * bubbleW;
        ctx.lineTo(px, yTop[i]);
      }
      ctx.strokeStyle = 'rgba(130, 160, 255, 0.8)'; // Meniscus highlight
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Draw Specular Outer Glass reflections (stationary glares simulating tube thickness)
      const glareGrad = ctx.createLinearGradient(0, 0, width, 0);
      glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glareGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0.05)');
      glareGrad.addColorStop(0.16, 'rgba(255, 255, 255, 0.0)');
      glareGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.0)');
      glareGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.04)');
      glareGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.0)');

      ctx.fillStyle = glareGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle slanted glares on glass tube edges
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(100, 0);
      ctx.lineTo(70, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(width * 0.7, 0);
      ctx.lineTo(width * 0.78, 0);
      ctx.lineTo(width * 0.74, height);
      ctx.lineTo(width * 0.66, height);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(runPhysics);
    };

    animationFrameRef.current = requestAnimationFrame(runPhysics);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      navbarEl.removeEventListener('mousemove', handleMouseMove);
      navbarEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [currentPage]);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      {/* ── Glass Capsule Vessel Container ────────────────────────── */}
      <div
        ref={navRef}
        className={cn(
          'relative flex items-center gap-0.5 px-2 py-2',
          'rounded-[28px] overflow-hidden'
        )}
        style={{
          background: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(40px) saturate(210%)',
          WebkitBackdropFilter: 'blur(40px) saturate(210%)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: [
            '0 1px 2px rgba(0, 0, 0, 0.02)',
            '0 12px 32px rgba(0, 0, 0, 0.08)',
            'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            'inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
          ].join(', '),
        }}
      >
        {/* Real-time Physics Fluid Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none select-none z-0"
        />

        {navItems.map((item) => {
          const isActive = item.id === currentPage;
          const Icon = item.icon;
          const isHovered = item.id === hoveredTab;

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
                'relative flex items-center gap-2 px-5 py-2.5 z-10',
                'rounded-[18px]',
                'text-[13px] text-nav font-medium',
                'cursor-pointer select-none outline-none transition-colors duration-250',
                isActive
                  ? 'text-[#365CF5] font-semibold'
                  : isHovered
                    ? 'text-[#111827]'
                    : 'text-[#9CA3AF]'
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                <motion.span
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={cn(
                      'transition-all duration-250',
                      isActive && 'drop-shadow-[0_1px_4px_rgba(54, 92, 245, 0.15)]'
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
