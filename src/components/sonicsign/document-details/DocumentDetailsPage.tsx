'use client';

import React, { useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  AlertCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { mockDocuments } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
};

const signerStatusConfig: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  pending: { label: 'Pending', color: 'text-sonic-warning', dot: 'bg-sonic-warning' },
  signed: { label: 'Signed', color: 'text-sonic-success', dot: 'bg-sonic-success' },
  rejected: { label: 'Rejected', color: 'text-sonic-danger', dot: 'bg-sonic-danger' },
};

export default function DocumentDetailsPage() {
  const { selectedDocumentId, setSelectedDocumentId, setCurrentPage } =
    useAppStore();
  const [currentPage, setCurrentPageNum] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const document = useMemo(
    () => mockDocuments.find((d) => d.id === selectedDocumentId),
    [selectedDocumentId]
  );

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
            className="mt-4 text-button"
            onClick={() => setCurrentPage('documents')}
          >
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[document.status] || statusConfig.draft;
  const totalPages = document.pages;

  const handleRequestSignature = () => {
    setSelectedDocumentId(document.id);
    setCurrentPage('signature-placement');
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setDeleteDialogOpen(false);
    setCurrentPage('documents');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Simulated document page content
  const renderSimulatedPage = (pageNum: number) => {
    const lineHeight = 12;
    const paragraphWidths = [85, 92, 78, 95, 88, 72, 90, 83, 68, 94];
    const paragraphs = [
      { lines: 4, startIndent: false, heading: true },
      { lines: 6, startIndent: false, heading: false },
      { lines: 3, startIndent: true, heading: false },
      { lines: 8, startIndent: false, heading: false },
      { lines: 5, startIndent: false, heading: true },
      { lines: 7, startIndent: true, heading: false },
      { lines: 4, startIndent: false, heading: false },
      { lines: 6, startIndent: false, heading: false },
    ];

    let currentY = 48;
    let paraIndex = 0;
    const elements: React.ReactNode[] = [];

    // Header line
    elements.push(
      <div
        key="header"
        className="absolute left-12 right-12 h-3 rounded-sm bg-sonic-border/60"
        style={{ top: 32 }}
      />
    );

    for (const para of paragraphs) {
      if (currentY > 680) break;
      paraIndex = (paraIndex + 1) % paragraphWidths.length;

      if (para.heading) {
        elements.push(
          <div
            key={`heading-${currentY}`}
            className="absolute left-12 h-3 rounded-sm bg-sonic-text/15"
            style={{
              top: currentY,
              width: `${paragraphWidths[paraIndex] * 0.6}%`,
            }}
          />
        );
        currentY += lineHeight + 4;
      }

      for (let i = 0; i < para.lines; i++) {
        if (currentY > 680) break;
        const widthPercent =
          i === para.lines - 1
            ? paragraphWidths[(paraIndex + i) % paragraphWidths.length] * 0.5
            : paragraphWidths[(paraIndex + i) % paragraphWidths.length];

        elements.push(
          <div
            key={`line-${currentY}-${i}`}
            className={cn(
              'absolute h-2 rounded-sm',
              para.startIndent && i === 0
                ? 'left-20 bg-sonic-text/8'
                : 'left-12 bg-sonic-text/8'
            )}
            style={{
              top: currentY,
              width: `${widthPercent}%`,
            }}
          />
        );
        currentY += lineHeight;
      }
      currentY += lineHeight;
    }

    // Page number
    elements.push(
      <div
        key="page-num"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-sonic-text-secondary/50"
      >
        Page {pageNum}
      </div>
    );

    // Signature lines at bottom of certain pages
    if (pageNum === totalPages || pageNum === Math.ceil(totalPages / 2)) {
      elements.push(
        <div key="sig-area" className="absolute bottom-20 left-12 right-12">
          <div className="mb-2 h-px bg-sonic-border" />
          <div className="flex justify-between">
            <div className="flex gap-16">
              <div>
                <div className="h-px w-32 bg-sonic-border/80" />
                <div className="mt-1 h-2 w-16 rounded-sm bg-sonic-text/8" />
              </div>
              <div>
                <div className="h-px w-32 bg-sonic-border/80" />
                <div className="mt-1 h-2 w-16 rounded-sm bg-sonic-text/8" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return elements;
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
          <Button
            onClick={handleRequestSignature}
            className="bg-sonic-primary hover:bg-sonic-primary/90 text-white text-button"
          >
            <PenTool className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Request Signature</span>
            <span className="sm:hidden">Sign</span>
          </Button>
          <Button variant="outline" size="default" className="text-button">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="default"
            className="text-sonic-danger hover:bg-red-50 hover:text-sonic-danger text-button"
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
                      {document.date}
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
                      {document.lastModified}
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
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-sonic-primary text-button">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Signer
                  </Button>
                </div>

                {document.signers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-sonic-border py-6 text-center">
                    <User className="mx-auto h-8 w-8 text-sonic-text-secondary/40" />
                    <p className="mt-2 text-sm text-sonic-text-secondary">
                      No signers added yet
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-sonic-primary"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Signer
                    </Button>
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

        {/* PDF Viewer */}
        <main className="flex flex-1 flex-col bg-sonic-bg overflow-hidden">
          {/* PDF Viewer Controls */}
          <div className="flex items-center justify-between border-b border-sonic-border bg-sonic-surface px-4 py-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-[3rem] text-center text-xs text-card-title text-sonic-text-secondary">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
            <span className="text-xs text-card-title text-sonic-text-secondary">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Document Area */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-thin">
            <div className="mx-auto" style={{ maxWidth: `${zoom * 6}px` }}>
              {/* Page */}
              <motion.div
                key={currentPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="relative mx-auto bg-white shadow-lg ring-1 ring-sonic-border/50"
                style={{
                  width: `${zoom * 6}px`,
                  height: `${zoom * 8}px`,
                  borderRadius: '2px',
                }}
              >
                {renderSimulatedPage(currentPage)}
              </motion.div>
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center justify-center gap-3 border-t border-sonic-border bg-sonic-surface px-4 py-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="text-sm text-card-title text-sonic-text">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPageNum((p) => Math.min(totalPages, p + 1))
              }
            >
              Next
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
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
