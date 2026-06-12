'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  PenTool,
  Eye,
  Send,
  Bell,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { mockDocuments, mockActivities, mockStats } from '@/data/mock';
import type { DocumentStatus, Activity } from '@/types';

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── Helpers ─────────────────────────────────────────────────────────
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const statusConfig: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  },
  signed: {
    label: 'Signed',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  rejected: {
    label: 'Rejected',
    className:
      'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
  },
  draft: {
    label: 'Draft',
    className:
      'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50',
  },
  expired: {
    label: 'Expired',
    className:
      'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
  },
};

const activityIconMap: Record<
  Activity['type'],
  { icon: React.ElementType; bg: string; fg: string }
> = {
  upload: { icon: Upload, bg: 'bg-blue-50', fg: 'text-blue-600' },
  sign: { icon: PenTool, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  reject: { icon: XCircle, bg: 'bg-red-50', fg: 'text-red-500' },
  request: { icon: Send, bg: 'bg-violet-50', fg: 'text-violet-600' },
  view: { icon: Eye, bg: 'bg-amber-50', fg: 'text-amber-600' },
};

// ── Stat card data ──────────────────────────────────────────────────
const statCards = [
  {
    key: 'total' as const,
    label: 'Total Documents',
    value: mockStats.totalDocuments,
    icon: FileText,
    iconBg: 'bg-[#365CF5]/8',
    iconFg: 'text-[#365CF5]',
  },
  {
    key: 'pending' as const,
    label: 'Pending',
    value: mockStats.pending,
    icon: Clock,
    iconBg: 'bg-[#F59E0B]/8',
    iconFg: 'text-[#F59E0B]',
  },
  {
    key: 'signed' as const,
    label: 'Signed',
    value: mockStats.signed,
    icon: CheckCircle,
    iconBg: 'bg-[#10B981]/8',
    iconFg: 'text-[#10B981]',
  },
  {
    key: 'rejected' as const,
    label: 'Rejected',
    value: mockStats.rejected,
    icon: XCircle,
    iconBg: 'bg-[#EF4444]/8',
    iconFg: 'text-[#EF4444]',
  },
];

// ── Component ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { setCurrentPage, setSelectedDocumentId } = useAppStore();

  const recentDocs = mockDocuments.slice(0, 5);
  const pendingDocs = mockDocuments.filter(
    (d) => d.status === 'pending'
  );

  const handleDocumentClick = (docId: string) => {
    setSelectedDocumentId(docId);
    setCurrentPage('document-details');
  };

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── 1. Welcome Section ─────────────────────────────────── */}
      <motion.section variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-sonic-text sm:text-3xl">
          Welcome back, Alex
        </h1>
        <p className="mt-1.5 text-sm text-sonic-text-secondary sm:text-base">
          {formatDate()} &middot; You have{' '}
          <span className="font-medium text-sonic-primary">
            {mockStats.pending} documents
          </span>{' '}
          awaiting signature
        </p>
      </motion.section>

      {/* ── 2. Statistics Cards ────────────────────────────────── */}
      <motion.section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        {statCards.map((stat) => (
          <motion.div key={stat.key} variants={itemVariants}>
            <Card
              className="rounded-2xl border-sonic-border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ padding: 0 }}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                    stat.iconBg
                  )}
                >
                  <stat.icon className={cn('h-5 w-5', stat.iconFg)} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-3xl font-bold tracking-tight text-sonic-text">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-sonic-text-secondary font-medium">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      {/* ── Bottom grid: Recent Docs + Sidebar ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left column (3/5) */}
        <div className="space-y-6 lg:col-span-3">
          {/* ── 3. Recent Documents ───────────────────────────── */}
          <motion.section variants={itemVariants}>
            <Card className="rounded-2xl border-sonic-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold text-sonic-text">
                  Recent Documents
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-sm text-sonic-primary hover:text-sonic-primary/80"
                  onClick={() => setCurrentPage('documents')}
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-sonic-border">
                  {recentDocs.map((doc) => {
                    const status = statusConfig[doc.status];
                    return (
                      <li
                        key={doc.id}
                        className="group flex cursor-pointer items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                        onClick={() => handleDocumentClick(doc.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleDocumentClick(doc.id);
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View ${doc.name}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <FileText className="h-4.5 w-4.5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-sonic-text group-hover:text-sonic-primary transition-colors">
                              {doc.name}
                            </p>
                            <p className="mt-0.5 text-xs text-sonic-text-secondary">
                              {doc.owner} &middot; {doc.lastModified}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-md text-xs font-medium',
                              status.className
                            )}
                          >
                            {status.label}
                          </Badge>
                          <ArrowUpRight className="h-3.5 w-3.5 text-sonic-text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* ── 5. Recent Activity ────────────────────────────── */}
          <motion.section variants={itemVariants}>
            <Card className="rounded-2xl border-sonic-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-sonic-text">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-sonic-border">
                  {mockActivities.map((activity) => {
                    const cfg = activityIconMap[activity.type];
                    const Icon = cfg.icon;
                    return (
                      <li
                        key={activity.id}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            cfg.bg
                          )}
                        >
                          <Icon className={cn('h-4 w-4', cfg.fg)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-sonic-text">
                            <span className="font-medium">{activity.user}</span>{' '}
                            {activity.action}{' '}
                            <span className="font-medium">
                              {activity.target}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-sonic-text-secondary">
                            {activity.timestamp}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Right column (2/5) */}
        <div className="space-y-6 lg:col-span-2">
          {/* ── 4. Pending Signatures ─────────────────────────── */}
          <motion.section variants={itemVariants}>
            <Card className="rounded-2xl border-sonic-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-sonic-text">
                  Pending Signatures
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-sonic-border">
                  {pendingDocs.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="cursor-pointer truncate text-sm font-medium text-sonic-text hover:text-sonic-primary transition-colors"
                          onClick={() => handleDocumentClick(doc.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')
                              handleDocumentClick(doc.id);
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`View ${doc.name}`}
                        >
                          {doc.name}
                        </p>
                        <p className="mt-0.5 text-xs text-sonic-text-secondary">
                          {doc.signers
                            .filter((s) => s.status === 'pending')
                            .map((s) => s.name)
                            .join(', ')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5 rounded-lg border-sonic-border text-xs font-medium text-sonic-text-secondary hover:text-sonic-primary hover:border-sonic-primary/30"
                      >
                        <Bell className="h-3 w-3" />
                        Remind
                      </Button>
                    </li>
                  ))}
                </ul>
                {pendingDocs.length === 0 && (
                  <div className="py-8 text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-emerald-400" />
                    <p className="mt-2 text-sm text-sonic-text-secondary">
                      All caught up! No pending signatures.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
