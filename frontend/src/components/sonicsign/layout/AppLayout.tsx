'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useAppStore } from '@/store/useAppStore';
import { authApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { PenLine, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -4,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.25,
};

function getInitials(nameOrEmail: string) {
  const value = nameOrEmail.trim();
  if (!value) return '';
  const namePart = value.includes('@') ? value.split('@')[0] : value;
  return namePart
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentPage, setIsAuthenticated, setUser, setCurrentPage, user } = useAppStore();
  const displayName = user?.displayName || user?.name || user?.email || '';
  const avatarUrl = user?.photoURL || user?.avatar || '';
  const profileSubtext = user?.email || user?.role || '';

  const handleSignOut = async () => {
    await authApi.logout().catch((error) => {
      console.error('Failed to sign out:', error);
    });
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('auth');
  };

  return (
    <div className={cn('min-h-screen flex flex-col relative', 'bg-[#FAFBFC]')}>
      
      {/* Centered Desktop Navbar (Suspended at 24px top spacing) */}
      <Navbar />

      {/* Spatial Scroll Depth Gradient Blur Mask Overlay (Fades and blurs content scrolling upward) */}
      <div 
        className="fixed top-0 left-0 right-0 h-[180px] z-30 pointer-events-none hidden md:block"
        style={{
          background: 'linear-gradient(to bottom, #FAFBFC 0%, #FAFBFC 44%, rgba(250, 251, 252, 0.7) 70%, rgba(250, 251, 252, 0) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 44%, rgba(0, 0, 0, 0.7) 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 44%, rgba(0, 0, 0, 0.7) 70%, transparent 100%)',
        }}
      />


      {/* Suspended Logo overlay (Aligned with Navbar vertical center at top-[34px]) */}
      <div className="fixed top-[34px] left-[32px] z-40 hidden md:flex items-center gap-2.5 select-none pointer-events-none">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#365CF5] shadow-md shadow-[#365CF5]/10 pointer-events-auto">
          <PenLine className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
        <span className="text-[#111827] text-base font-heading tracking-tight font-extrabold uppercase pointer-events-auto">
          SonicSign
        </span>
      </div>

      {/* Suspended User / Sign Out overlay (Aligned with Navbar vertical center at top-[34px]) */}
      <div className="fixed top-[34px] right-[32px] z-40 hidden md:flex items-center gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEF2FF] border border-[#365CF5]/5 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-[#365CF5]">
                {getInitials(displayName)}
              </span>
            )}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-[#111827] leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-[#6B7280] font-medium leading-tight mt-0.5">
              {profileSubtext}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
          onClick={handleSignOut}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Top Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex md:hidden items-center justify-between px-4 h-14 bg-white/80 backdrop-blur-md border-b border-sonic-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#365CF5]">
            <PenLine className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-[#111827] text-sm font-heading tracking-tight font-extrabold uppercase">
            SonicSign
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#6B7280] hover:text-[#EF4444]"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content (Controlled globally with 64px gap: safe area 24px + navbar 52px + gap 64px = pt-140px) */}
      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 pb-[96px] md:pb-10 pt-[72px] md:pt-[140px] flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
