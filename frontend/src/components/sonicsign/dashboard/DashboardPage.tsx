'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ArrowUpRight,
  Upload,
  Send,
  Plus,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileStack,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { dashboardApi } from '@/services/api';
import { DATA_EVENTS } from '@/lib/dataEvents';
import type { Document, DashboardStats, Activity, DocumentStatus } from '@/types';

// ── Helpers ─────────────────────────────────────────────────────────
function formatDate(date: Date): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Status Indicator Component ──────────────────────────────────────
function StatusIndicator({ status }: { status: DocumentStatus }) {
  const statusLabel = {
    pending: 'Pending',
    signed: 'Signed',
    rejected: 'Rejected',
    draft: 'Draft',
    expired: 'Expired',
    viewed: 'Viewed',
    archived: 'Archived',
  }[status] || 'Draft';

  const dotColor = {
    pending: 'bg-amber-400 border-amber-500/20 shadow-amber-400/20',
    signed: 'bg-emerald-500 border-emerald-600/20 shadow-emerald-500/20',
    rejected: 'bg-rose-500 border-rose-600/20 shadow-rose-500/20',
    draft: 'bg-gray-400 border-gray-500/20 shadow-gray-400/20',
    expired: 'bg-orange-500 border-orange-600/20 shadow-orange-500/20',
    viewed: 'bg-indigo-400 border-indigo-500/20 shadow-indigo-400/20',
    archived: 'bg-stone-500 border-stone-600/20 shadow-stone-500/20',
  }[status] || 'bg-gray-400 border-gray-500/20 shadow-gray-400/20';

  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-2 h-2 rounded-full border shadow-[0_0_8px] shrink-0", dotColor)} />
      <span className="text-xs font-semibold text-sonic-text leading-none">{statusLabel}</span>
    </div>
  );
}

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export default function DashboardPage() {
  const { setCurrentPage, setSelectedDocumentId, user } = useAppStore();
  const userName = user?.name || 'User';

  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    pending: 0,
    signed: 0,
    rejected: 0,
    draft: 0,
    viewed: 0,
    expired: 0,
    archived: 0,
  });
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [pendingDocs, setPendingDocs] = useState<Document[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayLabel, setTodayLabel] = useState('');

  const loadDashboard = async (active = true) => {
    try {
      setLoading(true);
      const [statsData, recentDocsData, pendingDocsData, activitiesData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentDocuments(),
        dashboardApi.getPendingSignatures(),
        dashboardApi.getActivities(),
      ]);
      if (active) {
        setStats(statsData);
        setRecentDocs(recentDocsData || []);
        setPendingDocs(pendingDocsData || []);
        setActivities(activitiesData || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setTodayLabel(formatDate(new Date()));
    let active = true;
    loadDashboard(active);
    const refresh = () => loadDashboard(true);
    window.addEventListener(DATA_EVENTS.documentsChanged, refresh);
    return () => {
      active = false;
      window.removeEventListener(DATA_EVENTS.documentsChanged, refresh);
    };
  }, []);

  const handleDocumentClick = (docId: string) => {
    setSelectedDocumentId(docId);
    setCurrentPage('document-details');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-sonic-primary/20 border-t-sonic-primary animate-spin" />
        <p className="text-sm font-medium text-sonic-text-secondary animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  // Dashboard Mode Flag
  const isFirstTimeUser = stats.totalDocuments === 0;

  // ── MODE 1: FIRST TIME USER ONBOARDING ────────────────────────────
  if (isFirstTimeUser) {
    return (
      <motion.div
        className="w-full space-y-12 pb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Onboarding Hero Section */}
        <motion.section 
          variants={itemVariants} 
          className="flex flex-col items-center text-center max-w-2xl mx-auto py-8 space-y-5"
        >
          <span className="text-xs font-bold tracking-widest text-sonic-primary uppercase px-3 py-1 bg-sonic-secondary rounded-full">
            Workspace Onboarding
          </span>
          <h1 className="text-4xl sm:text-5xl font-heading text-sonic-text tracking-tight font-extrabold mt-1">
            Welcome back, {userName}
          </h1>
          <p className="text-base sm:text-lg text-sonic-text-secondary font-light max-w-lg leading-relaxed">
            Ready to send your first document? Get started in seconds with our quick onboarding actions.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => setCurrentPage('upload')}
              className="bg-sonic-primary hover:bg-sonic-primary/95 text-white text-button rounded-xl h-11 px-5 cursor-pointer shadow-md shadow-sonic-primary/10"
            >
              <Upload className="mr-2 size-4" />
              Upload First Document
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage('documents')}
              className="border-sonic-border text-sonic-text hover:bg-gray-50 text-button rounded-xl h-11 px-5 cursor-pointer"
            >
              <Send className="mr-2 size-4" />
              Request Signature
            </Button>
          </div>
        </motion.section>

        {/* Quick Actions Grid */}
        <motion.section 
          variants={itemVariants} 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          {[
            {
              title: 'Upload Document',
              description: 'Drop a PDF or select from your local device',
              icon: Upload,
              action: () => setCurrentPage('upload'),
              primary: true,
            },
            {
              title: 'Request Signature',
              description: 'Send a document to others for execution',
              icon: Send,
              action: () => setCurrentPage('documents'),
              primary: false,
            },
            {
              title: 'Create Template',
              description: 'Save documents for repeated sends',
              icon: FileStack,
              action: () => setCurrentPage('documents'),
              primary: false,
            },
            {
              title: 'Import PDF',
              description: 'Import from cloud storage or URLs',
              icon: Sparkles,
              action: () => setCurrentPage('upload'),
              primary: false,
            },
          ].map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={act.action}
                className={cn(
                  "group flex flex-col items-start p-6 rounded-2xl border text-left cursor-pointer transition-all duration-300",
                  act.primary
                    ? "bg-sonic-primary text-white border-sonic-primary hover:shadow-lg hover:shadow-sonic-primary/10 hover:scale-[1.02]"
                    : "bg-white border-sonic-border text-sonic-text hover:border-sonic-primary/30 hover:shadow-md hover:scale-[1.01]"
                )}
              >
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                  act.primary ? "bg-white/10 text-white" : "bg-sonic-secondary text-sonic-primary"
                )}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-sm font-semibold mb-1">
                  {act.title}
                </h3>
                <p className={cn(
                  "text-xs leading-normal",
                  act.primary ? "text-white/80" : "text-sonic-text-secondary"
                )}>
                  {act.description}
                </p>
                <div className="flex-grow min-h-[1.5rem]" />
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs font-bold mt-2",
                  act.primary ? "text-white" : "text-sonic-primary"
                )}>
                  Get Started <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            );
          })}
        </motion.section>

        {/* Onboarding Workflow Illustration */}
        <motion.section 
          variants={itemVariants} 
          className="max-w-4xl mx-auto py-10 border-t border-b border-sonic-border"
        >
          <span className="text-[10px] font-bold text-sonic-text-secondary uppercase tracking-widest block text-center mb-10">
            How SonicSign Works
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative px-4">
            {[
              { step: '1', title: 'Upload', desc: 'Add your PDF contract or agreement document' },
              { step: '2', title: 'Request Signature', desc: 'Add recipient emails and options' },
              { step: '3', title: 'Track Progress', desc: 'View live status update feed' },
              { step: '4', title: 'Signed', desc: 'Receive fully executed documents' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center relative">
                <div className="size-12 rounded-full bg-sonic-secondary border border-sonic-primary/20 flex items-center justify-center text-sonic-primary font-bold text-base mb-4 shadow-sm">
                  {item.step}
                </div>
                <h4 className="text-sm font-semibold text-sonic-text mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-sonic-text-secondary leading-normal px-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Priority & Live Activity Symmetrical Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 max-w-5xl mx-auto"
        >
          {/* PRIORITY ONBOARDING */}
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-sonic-text-secondary uppercase tracking-wider text-center">Priority Attention</h2>
            <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-sonic-border rounded-2xl min-h-[160px] space-y-3 bg-white/50">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <p className="text-sm font-semibold text-sonic-text">Nothing requires attention yet</p>
              <p className="text-xs text-sonic-text-secondary leading-normal max-w-xs">
                All caught up! When documents require your review or signature, they will show up here.
              </p>
            </div>
          </div>

          {/* LIVE ACTIVITY ONBOARDING */}
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-sonic-text-secondary uppercase tracking-wider text-center">Live Activity</h2>
            <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-sonic-border rounded-2xl min-h-[160px] space-y-3 bg-white/50">
              <div className="size-10 rounded-full bg-sonic-secondary flex items-center justify-center text-sonic-primary">
                <Clock className="size-5" />
              </div>
              <p className="text-sm font-semibold text-sonic-text">Your timeline is empty</p>
              <p className="text-xs text-sonic-text-secondary leading-normal max-w-xs">
                Activity will appear here once documents are uploaded and signatures are requested.
              </p>
            </div>
          </div>
        </motion.div>

        {/* RECENT DOCUMENTS ONBOARDING */}
        <motion.section variants={itemVariants} className="pt-4">
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-sonic-text-secondary uppercase tracking-wider text-center">Recent Documents</h2>
            <div className="flex flex-col items-center text-center p-10 border border-dashed border-sonic-border rounded-2xl max-w-2xl mx-auto space-y-4 bg-white">
              <div className="size-12 rounded-xl bg-sonic-secondary flex items-center justify-center text-sonic-primary">
                <FileText className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-sonic-text">No documents yet</p>
                <p className="text-xs text-sonic-text-secondary leading-normal max-w-sm">
                  Your recent documents will appear here. Upload your first PDF to get started.
                </p>
              </div>
              <Button 
                onClick={() => setCurrentPage('upload')}
                className="bg-sonic-primary hover:bg-sonic-primary/95 text-white text-xs font-semibold px-5 h-10 rounded-xl cursor-pointer"
              >
                Upload Document
              </Button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    );
  }

  // ── MODE 2: ACTIVE USER DASHBOARD ────────────────────────────────
  return (
    <motion.div
      className="w-full space-y-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HERO SECTION */}
      <motion.section variants={itemVariants} className="space-y-3">
        <span className="text-xs font-bold tracking-wider text-sonic-text-secondary uppercase">Workspace</span>
        <h1 className="text-page-title text-4xl sm:text-5xl text-sonic-text tracking-tight font-heading mt-1">
          Welcome, {userName}
        </h1>
        {todayLabel && <p className="text-sm text-sonic-text-secondary">{todayLabel}</p>}
        <p className="text-base sm:text-lg text-sonic-text-secondary leading-relaxed max-w-3xl font-light mt-4">
          {stats.pending > 0 ? (
            <>
              There are{' '}
              <span className="font-semibold text-sonic-text underline decoration-2 decoration-sonic-primary underline-offset-4">
                {stats.pending} document{stats.pending > 1 ? 's' : ''}
              </span>{' '}
              currently requiring signatures.
            </>
          ) : (
            "You have no pending documents requiring signatures. Keep up the great work!"
          )}
        </p>
      </motion.section>

      {/* DOCUMENT PIPELINE CENTERPIECE */}
      <motion.section variants={itemVariants} className="pt-6 pb-2 border-b border-sonic-border">
        <span className="text-[10px] font-bold text-sonic-text-secondary uppercase tracking-wider block mb-6">Document Workflow Pipeline</span>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 relative">
          {[
            { label: 'Draft', count: stats.draft, description: 'Work in progress', color: 'bg-gray-400' },
            { label: 'Pending', count: stats.pending, description: 'Awaiting signatures', color: 'bg-[#365CF5]' },
            { label: 'Viewed', count: stats.viewed, description: 'Opened by recipient', color: 'bg-amber-400' },
            { label: 'Signed', count: stats.signed, description: 'Fully executed', color: 'bg-emerald-500' },
            { label: 'Archived', count: stats.archived, description: 'Closed or expired', color: 'bg-orange-500' },
          ].map((stage, idx) => (
            <div key={idx} className="relative flex flex-col items-start pl-4 group">
              {/* Left Accent indicator representing stage state */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-full opacity-80 transition-all", stage.color)} />
              
              <span className="text-3xl font-extrabold text-sonic-text tracking-tight font-heading leading-none">
                {stage.count}
              </span>
              <span className="text-xs font-bold text-sonic-text uppercase tracking-wider mt-2 block">
                {stage.label}
              </span>
              <span className="text-[10px] text-sonic-text-secondary mt-0.5 leading-snug">
                {stage.description}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* PRIORITY, RECENT DOCS, & LIVE ACTIVITY */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 pt-4"
      >
        {/* Left column (col span 3) */}
        <div className="lg:col-span-3 space-y-12">
          
          {/* PRIORITY SECTION */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-sonic-text-secondary uppercase tracking-wider">Priority Attention</h2>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-wide">
                Requires Action
              </span>
            </div>
            
            {pendingDocs.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-sonic-border rounded-xl">
                <p className="text-sm text-sonic-text-secondary">Documents requiring your review or signature will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-sonic-border">
                {pendingDocs.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                    <div className="min-w-0 flex-1">
                      <button 
                        onClick={() => handleDocumentClick(item.id)}
                        className="text-sm font-semibold text-sonic-text hover:text-sonic-primary text-left truncate block w-full cursor-pointer transition-colors"
                      >
                        {item.name}
                      </button>
                      <div className="flex items-center gap-2 mt-1 text-xs text-sonic-text-secondary">
                        <span>Owner: {item.owner}</span>
                        <span>&bull;</span>
                        <span>Modified: {new Date(item.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusIndicator status={item.status} />
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDocumentClick(item.id)}
                        className="h-8 px-3 rounded-lg font-bold text-xs cursor-pointer bg-sonic-primary text-white hover:bg-sonic-primary/95"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT DOCUMENTS */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-sonic-text-secondary uppercase tracking-wider">Recent Documents</h2>
              <button
                onClick={() => setCurrentPage('documents')}
                className="text-xs font-bold text-sonic-primary hover:text-sonic-primary/80 transition-colors cursor-pointer"
              >
                View all documents →
              </button>
            </div>
            
            {recentDocs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-sonic-border rounded-xl space-y-4">
                <p className="text-sm text-sonic-text-secondary">Your first document will appear here.</p>
                <Button 
                  onClick={() => setCurrentPage('upload')}
                  className="bg-sonic-primary text-white hover:bg-sonic-primary/90 rounded-lg text-xs font-semibold px-4 h-9 cursor-pointer"
                >
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-sonic-border">
                {recentDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc.id)}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group cursor-pointer hover:bg-gray-50/50 rounded-lg px-2 -mx-2 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-sonic-secondary text-sonic-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-sonic-text group-hover:text-sonic-primary transition-colors truncate block">
                          {doc.name}
                        </span>
                        <span className="text-[11px] text-sonic-text-secondary mt-0.5 block">
                          {doc.size} &bull; {doc.pages} page{doc.pages > 1 ? 's' : ''} &bull; Modified {new Date(doc.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-4">
                      <StatusIndicator status={doc.status} />
                      <ArrowUpRight className="w-4 h-4 text-sonic-text-secondary opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column (col span 2) */}
        <div className="lg:col-span-2 lg:border-l lg:border-sonic-border lg:pl-10">
          
          {/* LIVE ACTIVITY FEED */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Live Activity</h2>
            
            {activities.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-sonic-border rounded-xl">
                <p className="text-sm text-sonic-text-secondary">Your document activity will appear here.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-sonic-border/80 space-y-6 ml-3 py-1">
                {activities.map((activity) => {
                  const dotColors = {
                    sign: 'bg-emerald-500 shadow-emerald-500/20 ring-emerald-50',
                    upload: 'bg-[#365CF5] shadow-blue-500/20 ring-blue-50',
                    reject: 'bg-rose-500 shadow-rose-500/20 ring-rose-50',
                    request: 'bg-violet-500 shadow-violet-500/20 ring-violet-50',
                    view: 'bg-amber-400 shadow-amber-500/20 ring-amber-50',
                    login: 'bg-teal-500 shadow-teal-500/20 ring-teal-50',
                    logout: 'bg-stone-500 shadow-stone-500/20 ring-stone-50',
                    delete: 'bg-rose-600 shadow-rose-600/20 ring-rose-50',
                    download: 'bg-blue-400 shadow-blue-400/20 ring-blue-50',
                    update: 'bg-orange-400 shadow-orange-400/20 ring-orange-50',
                  }[activity.type] || 'bg-gray-400 ring-gray-50';

                  return (
                    <div key={activity.id} className="relative">
                      {/* Timeline Node Point */}
                      <span className={cn(
                        "absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ring-4 shadow-[0_0_8px] z-10",
                        dotColors
                      )} />
                      
                      <div>
                        <p className="text-xs text-sonic-text leading-relaxed">
                          <span className="font-semibold text-sonic-text">{activity.user}</span>{' '}
                          <span className="text-sonic-text-secondary">{activity.action}</span>
                        </p>
                        <span className="text-[10px] text-sonic-text-secondary mt-1 block">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
