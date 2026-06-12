'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  authViewKey: string;
}

const leftSideVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const floatingDotVariants = {
  animate: (i: number) => ({
    y: [0, -8, 0],
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 3 + i * 0.5,
      repeat: Infinity,
      ease: 'easeInOut',
      delay: i * 0.4,
    },
  }),
};

const formVariants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AuthLayout({ children, authViewKey }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[#FAFBFC]">
      {/* Left side - Branding (hidden on mobile) */}
      <div
        className={cn(
          'hidden lg:flex lg:w-[480px] xl:w-[540px]',
          'relative overflow-hidden',
          'bg-[#365CF5]'
        )}
      >
        <motion.div
          variants={leftSideVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col justify-between p-10 xl:p-12 w-full"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
              <PenLine className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-white text-lg font-semibold tracking-tight">
              SonicSign
            </span>
          </div>

          {/* Tagline + decorative elements */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-white text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight">
              Sign documents
              <br />
              with confidence
            </h1>
            <p className="mt-6 text-white/70 text-base leading-relaxed max-w-[340px]">
              The modern way to send, sign, and manage documents securely. Trusted by teams worldwide.
            </p>

            {/* Decorative dots */}
            <div className="mt-10 flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={floatingDotVariants}
                  animate="animate"
                  className="w-2 h-2 rounded-full bg-white/30"
                />
              ))}
            </div>
          </div>

          {/* Bottom testimonial */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <p className="text-white/90 text-sm leading-relaxed font-light">
                &ldquo;SonicSign transformed our contract workflow. What used to take days now takes minutes.&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
                  SK
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Sarah Kim</p>
                  <p className="text-white/50 text-xs mt-0.5">VP of Operations, Acme Corp</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Background decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03]" />
      </div>

      {/* Right side - Form area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 pt-8 pb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#365CF5]">
            <PenLine className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-[#111827] text-base font-semibold tracking-tight">
            SonicSign
          </span>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={authViewKey}
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 text-center">
          <p className="text-[#9CA3AF] text-xs tracking-wide">
            &copy; {new Date().getFullYear()} SonicSign, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
