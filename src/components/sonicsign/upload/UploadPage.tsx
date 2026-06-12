'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileUp,
  FileText,
  CheckCircle2,
  X,
  Plus,
  Eye,
  Users,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/useAppStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadPhase = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface UploadFileInfo {
  file: File;
  name: string;
  size: number;
  progress: number;
  phase: UploadPhase;
  errorMessage?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = ['application/pdf'];

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Only PDF files are accepted. Please select a .pdf file.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds the 25MB limit. Your file is ${formatFileSize(file.size)}.`;
  }
  if (file.size === 0) {
    return 'The file appears to be empty. Please select a valid PDF.';
  }
  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UploadPage() {
  const { setCurrentPage, setSelectedDocumentId } = useAppStore();

  const [uploadInfo, setUploadInfo] = useState<UploadFileInfo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  // ─── Upload Simulation ────────────────────────────────────────────────────

  const startUploadSimulation = useCallback((file: File) => {
    const info: UploadFileInfo = {
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      phase: 'uploading',
    };
    setUploadInfo(info);
    setValidationError(null);

    // Simulate upload progress
    let progress = 0;
    simulationRef.current = setInterval(() => {
      progress += Math.random() * 12 + 3;
      if (progress >= 100) {
        progress = 100;
        if (simulationRef.current) clearInterval(simulationRef.current);

        setUploadInfo((prev) =>
          prev ? { ...prev, progress: 100, phase: 'processing' } : null
        );

        // Simulate processing
        setTimeout(() => {
          setUploadInfo((prev) =>
            prev ? { ...prev, phase: 'complete' } : null
          );
        }, 1200);
      } else {
        setUploadInfo((prev) =>
          prev ? { ...prev, progress: Math.min(progress, 99) } : null
        );
      }
    }, 150);
  }, []);

  // ─── File Handling ─────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }
      setValidationError(null);
      startUploadSimulation(file);
    },
    [startUploadSimulation]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFileSelect]
  );

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    setUploadInfo(null);
    setValidationError(null);
  }, []);

  const handleViewDocument = useCallback(() => {
    // Navigate to document details with the first mock doc as placeholder
    setSelectedDocumentId('doc_001');
    setCurrentPage('document-details');
  }, [setCurrentPage, setSelectedDocumentId]);

  const handleAddSigners = useCallback(() => {
    setSelectedDocumentId('doc_001');
    setCurrentPage('document-details');
  }, [setCurrentPage, setSelectedDocumentId]);

  // ─── Status text ───────────────────────────────────────────────────────────

  const getStatusText = (phase: UploadPhase): string => {
    switch (phase) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Complete!';
      case 'error':
        return 'Upload failed';
      default:
        return '';
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pb-6">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-xl"
          onClick={() => setCurrentPage('documents')}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Upload Document
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add a new PDF document to your workspace
          </p>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* ─── Idle / Drop Zone State ──────────────────────────────────────── */}
            {!uploadInfo && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-200 cursor-pointer',
                    isDragOver
                      ? 'border-primary bg-primary/[0.03] scale-[1.01]'
                      : 'border-sonic-border bg-white hover:border-primary/40 hover:bg-primary/[0.01]'
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleInputChange}
                    className="hidden"
                  />

                  <motion.div
                    animate={isDragOver ? { scale: 1.05, y: -4 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={cn(
                      'flex size-16 items-center justify-center rounded-2xl mb-5 transition-colors duration-200',
                      isDragOver
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/60 text-muted-foreground'
                    )}
                  >
                    <FileUp className="size-8" />
                  </motion.div>

                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {isDragOver
                      ? 'Drop your PDF here'
                      : 'Drag and drop your PDF here'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isDragOver ? (
                      'Release to upload'
                    ) : (
                      <>
                        or{' '}
                        <span className="text-primary font-medium underline underline-offset-2">
                          click to browse
                        </span>
                      </>
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground/70">
                    PDF only &middot; Max 25MB
                  </span>
                </div>

                {/* Validation Error */}
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="mt-4"
                    >
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            Upload Error
                          </p>
                          <p className="text-sm text-red-600 mt-0.5">
                            {validationError}
                          </p>
                        </div>
                        <button
                          className="ml-auto shrink-0 text-red-400 hover:text-red-600 transition-colors"
                          onClick={() => setValidationError(null)}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ─── Uploading / Processing / Complete State ─────────────────────── */}
            {uploadInfo && (
              <motion.div
                key="upload-progress"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="rounded-2xl border border-sonic-border bg-white p-6">
                  {/* File Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300',
                        uploadInfo.phase === 'complete'
                          ? 'bg-emerald-50 text-emerald-600'
                          : uploadInfo.phase === 'error'
                            ? 'bg-red-50 text-red-500'
                            : 'bg-primary/5 text-primary'
                      )}
                    >
                      {uploadInfo.phase === 'complete' ? (
                        <CheckCircle2 className="size-6" />
                      ) : (
                        <FileText className="size-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-foreground truncate pr-8">
                        {uploadInfo.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFileSize(uploadInfo.size)}
                      </p>
                    </div>
                    {/* Cancel / Reset button */}
                    {uploadInfo.phase !== 'complete' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 rounded-lg -mt-0.5 -mr-2"
                        onClick={handleReset}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          'text-sm font-medium transition-colors duration-300',
                          uploadInfo.phase === 'complete'
                            ? 'text-emerald-600'
                            : uploadInfo.phase === 'processing'
                              ? 'text-amber-600'
                              : 'text-foreground'
                        )}
                      >
                        {getStatusText(uploadInfo.phase)}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {uploadInfo.phase === 'complete'
                          ? '100%'
                          : `${Math.round(uploadInfo.progress)}%`}
                      </span>
                    </div>
                    <Progress
                      value={
                        uploadInfo.phase === 'complete'
                          ? 100
                          : uploadInfo.progress
                      }
                      className={cn(
                        'h-2 rounded-full transition-colors duration-300',
                        uploadInfo.phase === 'complete'
                          ? '[&>[data-slot=progress-indicator]]:bg-emerald-500'
                          : uploadInfo.phase === 'processing'
                            ? '[&>[data-slot=progress-indicator]]:bg-amber-500'
                            : '[&>[data-slot=progress-indicator]]:bg-primary'
                      )}
                    />
                  </div>
                </div>

                {/* ─── Complete State Actions ──────────────────────────────────── */}
                <AnimatePresence>
                  {uploadInfo.phase === 'complete' && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                      className="mt-4 flex flex-col sm:flex-row gap-3"
                    >
                      <Button
                        className="flex-1 rounded-xl"
                        onClick={handleAddSigners}
                      >
                        <Users className="size-4" />
                        Add Signers
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-sonic-border"
                        onClick={handleViewDocument}
                      >
                        <Eye className="size-4" />
                        View Document
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-xl"
                        onClick={handleReset}
                      >
                        <Plus className="size-4" />
                        Upload Another
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
