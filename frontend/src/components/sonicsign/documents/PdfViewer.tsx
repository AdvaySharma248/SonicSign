'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { documentsApi, type PdfViewFile } from '@/services/api';
import { Button } from '@/components/ui/button';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  documentId: string;
  documentName: string;
}

interface PdfPagePreviewProps {
  documentId: string;
  documentName: string;
  pageNumber: number;
  width: number;
}

function ViewerError() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center text-sonic-text-secondary">
      <AlertCircle className="h-9 w-9 text-sonic-danger" aria-hidden="true" />
      <div>
        <p className="font-medium text-sonic-text">Unable to load PDF.</p>
        <p className="mt-1 text-sm">Please verify the file exists and is accessible.</p>
      </div>
    </div>
  );
}

function PdfSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6" aria-label="Loading PDF">
      {[1, 2, 3].map((page) => (
        <div key={page} className="aspect-[0.772] w-full animate-pulse bg-white shadow-sm ring-1 ring-sonic-border/50" />
      ))}
    </div>
  );
}

function usePdfViewFile(documentId: string) {
  const [file, setFile] = useState<PdfViewFile | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setFile(null);
    setError(false);

    documentsApi
      .getViewFile(documentId)
      .then((viewFile) => {
        if (active) setFile(viewFile);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [documentId]);

  return { file, error };
}

export function PdfPagePreview({ documentId, documentName, pageNumber, width }: PdfPagePreviewProps) {
  const { file, error } = usePdfViewFile(documentId);

  if (error) return <ViewerError />;
  if (!file) return <div className="aspect-[0.772] animate-pulse bg-white" />;

  return (
    <PdfDocument file={file} loading={<div className="aspect-[0.772] animate-pulse bg-white" />} error={<ViewerError />}>
      <Page pageNumber={pageNumber} width={width} renderTextLayer={false} renderAnnotationLayer={false} aria-label={`${documentName}, page ${pageNumber}`} />
    </PdfDocument>
  );
}

export function PdfViewer({ documentId, documentName }: PdfViewerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<'width' | 'page'>('width');
  const [containerSize, setContainerSize] = useState({ width: 800, height: 700 });
  const { file, error } = usePdfViewFile(documentId);

  useEffect(() => {
    const container = scrollAreaRef.current;
    if (!container) return;

    const updateSize = () => setContainerSize({ width: container.clientWidth, height: container.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPageCount(0);
    setCurrentPage(1);
  }, [documentId]);

  useEffect(() => {
    const container = scrollAreaRef.current;
    if (!container || pageCount === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visiblePage = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const page = Number(visiblePage?.target.getAttribute('data-page'));
        if (page) setCurrentPage(page);
      },
      { root: container, threshold: [0.55] }
    );

    pageRefs.current.forEach((page) => page && observer.observe(page));
    return () => observer.disconnect();
  }, [pageCount]);

  const availableWidth = Math.max(280, containerSize.width - 64);
  const pageWidth = Math.round(
    fitMode === 'page'
      ? Math.min(availableWidth, Math.max(280, (containerSize.height - 48) * 0.772))
      : availableWidth * (zoom / 100)
  );

  const goToPage = (page: number) => {
    pageRefs.current[page - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(page);
  };

  if (error) return <ViewerError />;

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label={`${documentName} PDF viewer`}>
      <div className="flex items-center justify-between border-b border-sonic-border bg-sonic-surface px-3 py-2 sm:px-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Zoom out" onClick={() => { setFitMode('width'); setZoom((value) => Math.max(50, value - 10)); }}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-12 text-center text-xs text-sonic-text-secondary">{fitMode === 'width' ? `${zoom}%` : 'Fit page'}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Zoom in" onClick={() => { setFitMode('width'); setZoom((value) => Math.min(200, value + 10)); }}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant={fitMode === 'width' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" aria-label="Fit to width" onClick={() => { setFitMode('width'); setZoom(100); }}>
            <Maximize className="h-4 w-4" />
          </Button>
          <Button variant={fitMode === 'page' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" aria-label="Fit page" onClick={() => setFitMode('page')}>
            <Minimize className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-sonic-text-secondary">Page {currentPage} of {pageCount || '...'}</span>
      </div>

      <div ref={scrollAreaRef} className="min-h-0 flex-1 overflow-auto bg-sonic-bg p-4 sm:p-8 scrollbar-thin">
        {!file ? (
          <PdfSkeleton />
        ) : (
          <PdfDocument
            file={file}
            loading={<PdfSkeleton />}
            error={<ViewerError />}
            onLoadSuccess={({ numPages }) => {
              setPageCount(numPages);
              pageRefs.current = Array.from({ length: numPages }, () => null);
            }}
          >
            <div className="mx-auto flex w-fit flex-col gap-6">
              {Array.from({ length: pageCount }, (_, index) => (
                <div
                  key={index + 1}
                  ref={(element) => {
                    pageRefs.current[index] = element;
                  }}
                  data-page={index + 1}
                  className="bg-white shadow-lg ring-1 ring-sonic-border/50"
                >
                  <Page pageNumber={index + 1} width={pageWidth} renderTextLayer renderAnnotationLayer aria-label={`${documentName}, page ${index + 1}`} />
                </div>
              ))}
            </div>
          </PdfDocument>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-sonic-border bg-sonic-surface px-4 py-2">
        <Button variant="outline" size="sm" className="h-8" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          Previous
        </Button>
        <span className="min-w-14 text-center text-sm text-sonic-text">{currentPage} / {pageCount || '-'}</span>
        <Button variant="outline" size="sm" className="h-8" disabled={!pageCount || currentPage >= pageCount} onClick={() => goToPage(currentPage + 1)}>
          Next
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  );
}
