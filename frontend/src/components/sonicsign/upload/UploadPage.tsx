'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  File,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { documentsApi } from '@/services/api';
import { DATA_EVENTS, emitDataEvent } from '@/lib/dataEvents';
import type { UploadFile } from '@/types';

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
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
};

const fileItemVariants = {
  initial: { opacity: 0, x: -12, scale: 0.96 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 12, scale: 0.96, transition: { duration: 0.2 } },
};

// ── Helpers ─────────────────────────────────────────────────────────
const ALLOWED_TYPES = [
  'application/pdf',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  return FileText;
}

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
}

// ── Component ───────────────────────────────────────────────────────
export default function UploadPage() {
  const { setCurrentPage } = useAppStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (fileId: string, file: File) => {
    try {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 35, status: 'uploading' } : f))
      );
      const document = await documentsApi.upload(file);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress: 100, status: 'complete', documentId: document.id }
            : f
        )
      );
      emitDataEvent(DATA_EVENTS.documentsChanged);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress: 0, status: 'error', error: message }
            : f
        )
      );
      setGlobalError(message);
    }
  }, []);

  // Add files from drop or select
  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setGlobalError('');
      const newFiles: UploadFile[] = [];
      const fileArray = Array.from(incoming);

      for (const file of fileArray) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setGlobalError(
            `"${file.name}" is not a supported file type. Please upload a PDF file.`
          );
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setGlobalError(
            `"${file.name}" exceeds the 25 MB size limit.`
          );
          continue;
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const uploadFile: UploadFile = {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'uploading',
          file,
        };
        newFiles.push(uploadFile);
      }

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        newFiles.forEach((f) => {
          if (f.file) {
            uploadFile(f.id, f.file);
          }
        });
      }
    },
    [uploadFile]
  );

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      // Reset input so re-selecting same file works
      e.target.value = '';
    }
  };

  const completedCount = files.filter((f) => f.status === 'complete').length;
  const totalCount = files.length;
  const allComplete = totalCount > 0 && completedCount === totalCount;

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center gap-3 mb-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg -ml-2"
            onClick={() => setCurrentPage('documents')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-page-title text-2xl text-sonic-text sm:text-3xl">
            Upload Documents
          </h1>
        </div>
        <p className="ml-10 text-sm text-sonic-text-secondary sm:text-base text-body">
          Drag & drop your PDF files below or click to browse.
        </p>
      </motion.section>

      {/* ── Drop Zone ───────────────────────────────────────────── */}
      <motion.section variants={itemVariants}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload files by dropping them here or clicking to browse"
          className={cn(
            'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 sm:p-14 cursor-pointer transition-all duration-300',
            isDragOver
              ? 'border-sonic-primary bg-sonic-primary/5 scale-[1.01]'
              : 'border-sonic-border bg-white hover:border-sonic-primary/40 hover:bg-sonic-primary/[0.02]'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload icon with animation */}
          <motion.div
            className={cn(
              'flex size-16 items-center justify-center rounded-2xl mb-5 transition-colors duration-300',
              isDragOver
                ? 'bg-sonic-primary/10 text-sonic-primary'
                : 'bg-sonic-secondary text-sonic-primary'
            )}
            animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Upload className="size-7" />
          </motion.div>

          <p className="text-base font-medium text-sonic-text mb-1">
            {isDragOver ? 'Drop your files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-sonic-text-secondary">
            or <span className="text-sonic-primary font-medium underline underline-offset-2">browse files</span> from your device
          </p>
          <p className="mt-3 text-xs text-sonic-text-secondary">
            Max file size: 25 MB &middot; PDF
          </p>
        </div>
      </motion.section>

      {/* ── Error message ───────────────────────────────────────── */}
      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4"
          >
            <AlertCircle className="size-5 text-red-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-red-800">{globalError}</p>
            </div>
            <button
              onClick={() => setGlobalError('')}
              className="shrink-0 ml-auto text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── File List ───────────────────────────────────────────── */}
      {files.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-section-title text-base text-sonic-text">
              Uploaded Files
              <span className="ml-2 text-sm font-normal text-sonic-text-secondary">
                ({completedCount}/{totalCount} complete)
              </span>
            </h2>
            {allComplete && (
              <Button
                className="rounded-xl text-button"
                onClick={() => setCurrentPage('documents')}
              >
                View Documents
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {files.map((file) => {
                const Icon = getFileIcon(file.type);
                const ext = getFileExtension(file.name);
                return (
                  <motion.div
                    key={file.id}
                    variants={fileItemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                  >
                    <Card className="rounded-xl border-sonic-border bg-white overflow-hidden py-0 gap-0">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {/* File icon */}
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <Icon className="size-5 text-blue-600" />
                          </div>

                          {/* File info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-card-title text-sm text-sonic-text truncate">
                                {file.name}
                              </p>
                              <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 uppercase">
                                {ext}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-sonic-text-secondary">
                                {formatFileSize(file.size)}
                              </p>
                              {file.status === 'uploading' && (
                                <span className="text-xs text-sonic-primary font-medium">
                                  {file.progress}%
                                </span>
                              )}
                              {file.status === 'complete' && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                  <CheckCircle2 className="size-3" />
                                  Complete
                                </span>
                              )}
                              {file.status === 'error' && (
                                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                                  <AlertCircle className="size-3" />
                                  Failed
                                </span>
                              )}
                            </div>
                            {file.error && (
                              <p className="mt-1 text-xs text-red-600">{file.error}</p>
                            )}
                          </div>

                          {/* Status indicator / Remove button */}
                          <div className="shrink-0">
                            {file.status === 'uploading' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg"
                                onClick={() => removeFile(file.id)}
                                aria-label={`Cancel upload of ${file.name}`}
                              >
                                <X className="size-4 text-sonic-text-secondary" />
                              </Button>
                            ) : file.status === 'complete' ? (
                              <div className="flex size-8 items-center justify-center">
                                <CheckCircle2 className="size-5 text-emerald-500" />
                              </div>
                            ) : file.status === 'error' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg"
                                onClick={() => removeFile(file.id)}
                                aria-label={`Remove failed upload of ${file.name}`}
                              >
                                <X className="size-4 text-sonic-text-secondary" />
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        {/* Progress bar */}
                        {file.status === 'uploading' && (
                          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <motion.div
                              className="h-full rounded-full bg-sonic-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              transition={{ duration: 0.3, ease: 'easeOut' as const }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.section>
      )}

      {/* ── Tips Section ────────────────────────────────────────── */}
      {files.length === 0 && (
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: FileText,
                title: 'PDF Documents',
                desc: 'Upload contracts, agreements, and forms for signing.',
                bg: 'bg-blue-50',
                fg: 'text-blue-600',
              },
              {
                icon: CheckCircle2,
                title: 'Persistent Storage',
                desc: 'Uploaded PDFs are saved and linked to your account.',
                bg: 'bg-violet-50',
                fg: 'text-violet-600',
              },
              {
                icon: File,
                title: 'Batch Upload',
                desc: 'Upload multiple files at once for efficient processing.',
                bg: 'bg-emerald-50',
                fg: 'text-emerald-600',
              },
            ].map((tip) => (
              <Card
                key={tip.title}
                className="rounded-xl border-sonic-border bg-white py-0 gap-0"
              >
                <CardContent className="p-5">
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl mb-3',
                      tip.bg
                    )}
                  >
                    <tip.icon className={cn('size-5', tip.fg)} />
                  </div>
                  <h3 className="text-card-title text-sm text-sonic-text mb-1">
                    {tip.title}
                  </h3>
                  <p className="text-xs text-sonic-text-secondary text-body">
                    {tip.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
