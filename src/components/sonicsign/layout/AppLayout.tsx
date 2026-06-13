'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useAppStore } from '@/store/useAppStore';
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
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.25,
};

export function AppLayout({ children }: AppLayoutProps) {
  const { currentPage, setIsAuthenticated, setUser } = useAppStore();

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <div className={cn('min-h-screen flex flex-col', 'bg-[#FAFBFC]')}>
      {/* Top Bar with Logo + User */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-8 h-16">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#365CF5]">
            <PenLine className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-[#111827] text-base font-heading tracking-tight hidden sm:inline">
            SonicSign
          </span>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EEF2FF]">
              <span className="text-xs font-semibold text-[#365CF5]">AC</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm text-card-title text-[#111827] leading-tight">Alex Chen</p>
              <p className="text-xs text-[#6B7280] leading-tight">Admin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#6B7280] hover:text-[#EF4444]"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-20 md:pb-8 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
