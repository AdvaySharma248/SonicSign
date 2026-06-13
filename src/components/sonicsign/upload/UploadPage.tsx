'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  CloudUpload,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
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
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fileVariants = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } },
};

// ── Helpers ─────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ACCEPTED_TYPES = ['application/pdf'];

// ── Component ───────────────────────────────────────────────────────
export default function UploadPage() {
  const { setCurrentPage, setSelectedDocumentId } = useAppStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Simulate upload progress
  const simulateUpload = useCallback((fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, progress: 100, status: 'processing' }
              : f
          )
        );
        // Simulate processing
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, status: 'complete' }
                : f
            )
          );
        }, 1500);
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: Math.min(progress, 100) } : f
          )
        );
      }
    }, 300);
  }, []);

  // Validate and add files
  const addFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = [];

    Array.from(fileList).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        newFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'error',
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        newFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'error',
        });
        return;
      }

      const uploadFile: UploadFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading',
      };
      newFiles.push(uploadFile);

      // Simulate upload progress
      simulateUpload(uploadFile.id);
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, [simulateUpload]);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Drag handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const completedFiles = files.filter((f) => f.status === 'complete');
  const hasErrors = files.some((f) => f.status === 'error');
  const isUploading = files.some(
    (f) => f.status === 'uploading' || f.status === 'processing'
  );

  return (
    <motion.div
      className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.section variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
          Upload Document
        </h1>
        <p className="mt-1.5 text-sm text-[#6B7280] sm:text-base">
          Upload a PDF document to prepare for electronic signatures
        </p>
      </motion.section>

      {/* Drop Zone */}
      <motion.section variants={itemVariants}>
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300',
            isDragging
              ? 'border-[#365CF5] bg-[#365CF5]/5 scale-[1.01]'
              : 'border-[#E5E7EB] bg-white hover:border-[#365CF5]/40 hover:bg-[#365CF5]/[0.02]'
          )}
          style={{ padding: '48px 24px' }}
          role="button"
          tabIndex={0}
          aria-label="Upload PDF document"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
            aria-hidden="true"
          />

          <div className="flex flex-col items-center text-center">
            <motion.div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-300',
                isDragging ? 'bg-[#365CF5]/15' : 'bg-[#EEF2FF]'
              )}
              animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.6, repeat: isDragging ? Infinity : 0 }}
            >
              <CloudUpload
                className={cn(
                  'h-8 w-8 transition-colors duration-300',
                  isDragging ? 'text-[#365CF5]' : 'text-[#365CF5]/70'
                )}
                strokeWidth={1.5}
              />
            </motion.div>

            <p className="mt-4 text-base font-semibold text-[#111827]">
              {isDragging ? 'Drop your files here' : 'Drag and drop your PDF here'}
            </p>
            <p className="mt-1.5 text-sm text-[#6B7280]">
              or click to browse from your computer
            </p>
            <p className="mt-3 text-xs text-[#9CA3AF]">
              PDF only &middot; Max 25 MB per file
            </p>
          </div>
        </div>
      </motion.section>

      {/* File List */}
      {files.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111827]">
              Uploaded Files ({files.length})
            </h2>
            {hasErrors && (
              <p className="text-xs text-[#EF4444] font-medium">
                Some files could not be uploaded
              </p>
            )}
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  variants={fileVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                >
                  <Card
                    className={cn(
                      'rounded-xl border transition-colors',
                      file.status === 'error'
                        ? 'border-red-200 bg-red-50/50'
                        : 'border-[#E5E7EB] bg-white'
                    )}
                    style={{ padding: 0 }}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      {/* File Icon */}
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          file.status === 'error'
                            ? 'bg-red-100'
                            : file.status === 'complete'
                              ? 'bg-emerald-50'
                              : 'bg-[#EEF2FF]'
                        )}
                      >
                        {file.status === 'complete' ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        ) : file.status === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : file.status === 'processing' ? (
                          <Loader2 className="h-5 w-5 text-[#365CF5] animate-spin" />
                        ) : (
                          <FileText className="h-5 w-5 text-[#365CF5]" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-medium',
                            file.status === 'error'
                              ? 'text-red-700'
                              : 'text-[#111827]'
                          )}
                        >
                          {file.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-xs text-[#6B7280]">
                            {formatFileSize(file.size)}
                          </p>
                          {file.status === 'uploading' && (
                            <>
                              <span className="text-xs text-[#9CA3AF]">&middot;</span>
                              <p className="text-xs font-medium text-[#365CF5]">
                                {Math.round(file.progress)}%
                              </p>
                            </>
                          )}
                          {file.status === 'processing' && (
                            <>
                              <span className="text-xs text-[#9CA3AF]">&middot;</span>
                              <p className="text-xs font-medium text-[#365CF5]">
                                Processing...
                              </p>
                            </>
                          )}
                          {file.status === 'error' && (
                            <>
                              <span className="text-xs text-red-400">&middot;</span>
                              <p className="text-xs font-medium text-red-600">
                                {file.type !== 'application/pdf'
                                  ? 'Only PDF files are accepted'
                                  : 'File exceeds 25 MB limit'}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {(file.status === 'uploading' ||
                          file.status === 'processing') && (
                          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#EEF2FF]">
                            <motion.div
                              className="h-full rounded-full bg-[#365CF5]"
                              initial={{ width: 0 }}
                              animate={{
                                width:
                                  file.status === 'processing'
                                    ? '100%'
                                    : `${file.progress}%`,
                              }}
                              transition={{
                                duration: 0.3,
                                ease: 'easeOut',
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-[#9CA3AF] hover:text-[#EF4444]"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          {completedFiles.length > 0 && (
            <motion.div
              className="flex items-center justify-end gap-3 pt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="outline"
                className="rounded-xl border-[#E5E7EB] text-[#6B7280] hover:text-[#111827]"
                onClick={() => setFiles([])}
                disabled={isUploading}
              >
                Clear All
              </Button>
              <Button
                className="rounded-xl bg-[#365CF5] text-white hover:bg-[#2B4FE0] gap-2"
                onClick={() => {
                  if (completedFiles.length > 0) {
                    setSelectedDocumentId('doc_001');
                    setCurrentPage('signature-placement');
                  }
                }}
                disabled={isUploading}
              >
                Prepare for Signing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </motion.section>
      )}
    </motion.div>
  );
}
