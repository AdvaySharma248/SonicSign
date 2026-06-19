'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Download,
  Trash2,
  PenTool,
  Clock,
  User,
  HardDrive,
  FileStack,
  Calendar,
  Plus,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { documentsApi } from '@/services/api';
import { DATA_EVENTS, emitDataEvent } from '@/lib/dataEvents';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PdfViewer } from '@/components/sonicsign/documents/PdfViewer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Document, DocumentStatus } from '@/types';

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    color: 'text-sonic-warning',
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-sonic-warning',
  },
  signed: {
    label: 'Signed',
    color: 'text-sonic-success',
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-sonic-success',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-sonic-danger',
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-sonic-danger',
  },
  draft: {
    label: 'Draft',
    color: 'text-sonic-text-secondary',
    bg: 'bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
  },
  expired: {
    label: 'Expired',
    color: 'text-sonic-text-secondary',
    bg: 'bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
  },
  viewed: {
    label: 'Viewed',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  archived: {
    label: 'Archived',
    color: 'text-stone-700',
    bg: 'bg-stone-50 border-stone-200',
    dot: 'bg-stone-500',
  },
};

const signerStatusConfig: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  pending: { label: 'Pending', color: 'text-sonic-warning', dot: 'bg-sonic-warning' },
  signed: { label: 'Signed', color: 'text-sonic-success', dot: 'bg-sonic-success' },
  rejected: { label: 'Rejected', color: 'text-sonic-danger', dot: 'bg-sonic-danger' },
  viewed: { label: 'Viewed', color: 'text-indigo-600', dot: 'bg-indigo-500' },
  expired: { label: 'Expired', color: 'text-orange-600', dot: 'bg-orange-500' },
};

export default function DocumentDetailsPage() {
  const { selectedDocumentId, setSelectedDocumentId, setCurrentPage } =
    useAppStore();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!selectedDocumentId) return;
    let active = true;
    async function loadDoc() {
      if (!selectedDocumentId) return;
      try {
        setLoading(true);
        const doc = await documentsApi.getById(selectedDocumentId);
        if (active) {
          setDocument(doc || null);
        }
      } catch (err) {
        console.error('Failed to load document details:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadDoc();
    return () => {
      active = false;
    };
  }, [selectedDocumentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-sonic-primary/20 border-t-sonic-primary animate-spin" />
        <p className="text-sm font-medium text-sonic-text-secondary animate-pulse">Loading document details...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-sonic-text-secondary/40" />
          <p className="mt-4 text-lg text-card-title text-sonic-text">
            Document not found
          </p>
          <p className="mt-1 text-sm text-sonic-text-secondary">
            The document you are looking for does not exist or has been removed.
          </p>
          <Button
            variant="outline"
            className="mt-4 text-button cursor-pointer"
            onClick={() => setCurrentPage('documents')}
          >
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[document.status] || statusConfig.draft;
  const handleRequestSignature = () => {
    setSelectedDocumentId(document.id);
    setCurrentPage('signature-placement');
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDownload = async () => {
    try {
      await documentsApi.download(document.id, document.name);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const confirmDelete = async () => {
    try {
      await documentsApi.delete(document.id);
      emitDataEvent(DATA_EVENTS.documentsChanged);
      setDeleteDialogOpen(false);
      setSelectedDocumentId(null);
      setCurrentPage('documents');
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex h-full flex-col"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-sonic-border bg-sonic-surface px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setCurrentPage('documents')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base text-page-title text-sonic-text sm:text-lg">
                {document.name}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 border text-xs text-card-title',
                  status.bg,
                  status.color
                )}
              >
                <span
                  className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', status.dot)}
                />
                {status.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {document.status === 'draft' && (
            <Button
              onClick={handleRequestSignature}
              className="bg-sonic-primary hover:bg-sonic-primary/90 text-white text-button cursor-pointer"
            >
              <PenTool className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Request Signature</span>
              <span className="sm:hidden">Sign</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="default"
            className="text-button cursor-pointer"
            onClick={handleDownload}
            disabled={!document.id}
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="default"
            className="text-sonic-danger hover:bg-red-50 hover:text-sonic-danger text-button cursor-pointer"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left Sidebar */}
        <aside className="w-full shrink-0 border-b border-sonic-border bg-sonic-surface lg:w-80 lg:border-b-0 lg:border-r">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 space-y-6">
              {/* Document Information */}
              <div>
                <h2 className="mb-4 text-sm text-section-title text-sonic-text uppercase tracking-wide">
                  Document Information
                </h2>
                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-sonic-text-secondary">
                      <AlertCircle className="h-4 w-4" />
                      Status
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          status.dot
                        )}
                      />
                      <span
                        className={cn('text-sm text-card-title', status.color)}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Upload Date */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-sonic-text-secondary">
                      <Calendar className="h-4 w-4" />
                      Upload Date
                    </span>
                    <span className="text-sm text-card-title text-sonic-text">
                      {new Date(document.date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-sonic-text-secondary">
                      <User className="h-4 w-4" />
                      Owner
                    </span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-sonic-primary/10 text-sonic-primary text-[10px]">
                          {getInitials(document.owner)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-card-title text-sonic-text">
                        {document.owner}
                      </span>
                    </div>
                  </div>

                  {/* File Size */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-sonic-text-secondary">
                      <HardDrive className="h-4 w-4" />
                      File Size
                    </span>
                    <span className="text-sm text-card-title text-sonic-text">
                      {document.size}
                    </span>
                  </div>

                  {/* Pages */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-sonic-text-secondary">
                      <FileStack className="h-4 w-4" />
                      Pages
                    </span>
                    <span className="text-sm text-card-title text-sonic-text">
                      {document.pages}
                    </span>
                  </div>

                  {/* Last Modified */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-sonic-text-secondary">
                      <Clock className="h-4 w-4" />
                      Last Modified
                    </span>
                    <span className="text-sm text-card-title text-sonic-text">
                      {new Date(document.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Signers Section */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm text-section-title text-sonic-text uppercase tracking-wide">
                    Signers
                  </h2>
                  {document.status === 'draft' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-sonic-primary text-button cursor-pointer"
                      onClick={handleRequestSignature}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Signer
                    </Button>
                  )}
                </div>

                {!document.signers || document.signers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-sonic-border py-6 text-center">
                    <User className="mx-auto h-8 w-8 text-sonic-text-secondary/40" />
                    <p className="mt-2 text-sm text-sonic-text-secondary">
                      No signers added yet
                    </p>
                    {document.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-sonic-primary cursor-pointer"
                        onClick={handleRequestSignature}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Signer
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {document.signers.map((signer, index) => {
                      const signerStatus =
                        signerStatusConfig[signer.status] ||
                        signerStatusConfig.pending;
                      return (
                        <motion.div
                          key={signer.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-start gap-3 rounded-lg border border-sonic-border p-3 transition-colors hover:bg-sonic-secondary/50"
                        >
                          <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-sonic-primary/10 text-sonic-primary text-xs">
                              {getInitials(signer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm text-card-title text-sonic-text">
                                {signer.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {signer.status === 'signed' ? (
                                  <Check className="h-3.5 w-3.5 text-sonic-success" />
                                ) : signer.status === 'rejected' ? (
                                  <X className="h-3.5 w-3.5 text-sonic-danger" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-sonic-warning" />
                                )}
                                <span
                                  className={cn(
                                    'text-xs text-card-title',
                                    signerStatus.color
                                  )}
                                >
                                  {signerStatus.label}
                                </span>
                              </div>
                            </div>
                            <p className="truncate text-xs text-sonic-text-secondary">
                              {signer.email}
                            </p>
                            {signer.emailDelivery && (
                              <div className="mt-1 flex flex-col gap-0.5">
                                <span className="text-[10px] text-sonic-text-secondary font-medium">
                                  Email Delivery: {' '}
                                  <span className={cn(
                                    "font-semibold",
                                    signer.emailDelivery.status === 'delivered' && "text-emerald-600 dark:text-emerald-400",
                                    signer.emailDelivery.status === 'failed' && "text-red-500 dark:text-red-400",
                                    signer.emailDelivery.status === 'bounced' && "text-orange-500 dark:text-orange-400",
                                    signer.emailDelivery.status === 'rejected' && "text-red-600 dark:text-red-400",
                                    ['queued', 'processing', 'sent'].includes(signer.emailDelivery.status) && "text-amber-500 dark:text-amber-400"
                                  )}>
                                    {signer.emailDelivery.status.charAt(0).toUpperCase() + signer.emailDelivery.status.slice(1)}
                                  </span>
                                </span>
                                {signer.emailDelivery.errorMessage && (
                                  <span className="text-[10px] text-red-500 dark:text-red-400 font-mono break-words leading-tight">
                                    Error: {signer.emailDelivery.errorMessage}
                                  </span>
                                )}
                              </div>
                            )}
                            {signer.signedAt && (
                              <p className="mt-1 text-xs text-sonic-text-secondary">
                                Signed{' '}
                                {new Date(signer.signedAt).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex flex-1 flex-col bg-sonic-bg overflow-hidden">
          <PdfViewer documentId={document.id} documentName={document.name} />
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{document.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
