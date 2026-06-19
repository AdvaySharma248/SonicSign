'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  authViewKey: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
};

const formVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: 'easeOut' as const },
  },
};

function DocumentsPanel() {
  const rows = [
    { label: 'Upload PDF', detail: 'Private to your account', status: 'Draft' },
    { label: 'Prepare fields', detail: 'Private to your account', status: 'Ready' },
    { label: 'Track status', detail: 'Private to your account', status: 'Done' },
  ];

  return (
    <div className="absolute top-[6%] left-[4%] w-[270px] hidden xl:flex flex-col border border-[#E5E7EB] bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-4 select-none pointer-events-none z-0">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
        <span className="text-xs font-bold text-gray-900 tracking-tight font-heading">Documents</span>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">Encrypted</span>
      </div>
      <div className="flex flex-col gap-2.5 mt-3">
        {rows.map((row, index) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-800 truncate max-w-[140px]">{row.label}</p>
                <p className="text-[9px] text-gray-400">{row.detail}</p>
              </div>
            </div>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[8px] font-bold border',
                index === 0
                  ? 'bg-gray-50 text-gray-600 border-gray-100'
                  : index === 1
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              )}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingSignaturesPanel() {
  const rows = ['Recipient review', 'Identity check'];

  return (
    <div className="absolute top-[34%] right-[4%] w-[270px] hidden xl:flex flex-col border border-[#E5E7EB] bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-4 select-none pointer-events-none z-0">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
        <span className="text-xs font-bold text-gray-900 tracking-tight font-heading">Pending Signatures</span>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">Live</span>
      </div>
      <div className="flex flex-col gap-3 mt-3">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-800 truncate max-w-[150px]">{row}</p>
              <p className="text-[9px] text-gray-400">Scoped to your workspace</p>
            </div>
            <div className="px-2 py-0.5 text-[9px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded">Remind</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditEventsPanel() {
  const rows = [
    ['Document uploaded', 'Owner and timestamp recorded'],
    ['Signature request sent', 'Recipient action tracked'],
    ['Completion recorded', 'Audit trail preserved'],
  ];

  return (
    <div className="absolute bottom-[8%] left-[6%] w-[270px] hidden xl:flex flex-col border border-[#E5E7EB] bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-4 select-none pointer-events-none z-0">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
        <span className="text-xs font-bold text-gray-900 tracking-tight font-heading">Audit Events</span>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase">Verified</span>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        {rows.map(([title, detail], index) => (
          <div key={title} className="flex items-start gap-2 text-[10px] text-gray-700">
            <span className={cn('font-bold', index === 0 ? 'text-blue-500' : index === 1 ? 'text-violet-500' : 'text-emerald-500')}>•</span>
            <div>
              <span className="font-semibold">{title}</span>
              <p className="text-[8px] text-gray-400 mt-0.5">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthLayout({ children, authViewKey }: AuthLayoutProps) {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col justify-between p-6 relative bg-premium-noise">
      <DocumentsPanel />
      <PendingSignaturesPanel />
      <AuditEventsPanel />

      <div className="flex-1 flex items-center justify-center relative z-10 w-full">
        <div className="w-full max-w-[460px] relative z-20">
          <div className="absolute top-[-16px] right-[-24px] hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-[#E5E7EB]/80 shadow-md text-[10px] font-bold text-[#111827] z-30 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#365CF5] animate-pulse" />
            <span>Enterprise secure</span>
          </div>

          <div className="absolute bottom-[-16px] left-[-24px] hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-[#E5E7EB]/80 shadow-md text-[10px] font-bold text-[#111827] z-30 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Audit trail ready</span>
          </div>

          <motion.div
            layout
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full bg-white/80 backdrop-blur-xl border border-white/45 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] p-6 sm:p-8 relative overflow-hidden"
          >
            <div className="flex flex-col items-center mb-6 select-none shrink-0">
              <img
                src="/logo.svg"
                alt="SonicSign Logo"
                className="w-11 h-11 object-contain mb-3"
              />
              <span className="text-[#111827] text-base font-heading tracking-tight font-extrabold uppercase">
                SonicSign
              </span>
              <p className="mt-1.5 text-[#6B7280] text-[13px] text-center font-medium max-w-[280px] leading-relaxed">
                Secure document signing for modern teams
              </p>
            </div>

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

            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6 pt-5 border-t border-gray-100/60 select-none shrink-0">
              {[
                'Secure PDF Processing',
                'Enterprise Grade Security',
                'Audit Trail Tracking',
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200/60 text-[9px] font-bold text-gray-500 tracking-wide uppercase shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="text-center shrink-0 mt-4 relative z-20 select-none">
        <p className="text-[#9CA3AF] text-[11px] font-sans tracking-wide">
          SonicSign, Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
