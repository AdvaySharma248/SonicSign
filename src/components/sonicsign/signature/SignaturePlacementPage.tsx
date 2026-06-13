'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  X,
  Undo2,
  Trash2,
  Type,
  Calendar,
  PenTool,
  Hash,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  GripVertical,
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SignaturePlacement } from '@/types';

type SignatureType = 'signature' | 'initials' | 'date' | 'text';

const signatureTypeConfig: Record<
  SignatureType,
  { label: string; icon: React.ReactNode; shortLabel: string }
> = {
  signature: {
    label: 'Signature',
    icon: <PenTool className="h-3.5 w-3.5" />,
    shortLabel: 'Sig',
  },
  initials: {
    label: 'Initials',
    icon: <Hash className="h-3.5 w-3.5" />,
    shortLabel: 'Ini',
  },
  date: {
    label: 'Date',
    icon: <Calendar className="h-3.5 w-3.5" />,
    shortLabel: 'Date',
  },
  text: {
    label: 'Text',
    icon: <Type className="h-3.5 w-3.5" />,
    shortLabel: 'Txt',
  },
};

const signerColors = [
  { bg: 'bg-sonic-primary/10', border: 'border-sonic-primary/40', text: 'text-sonic-primary', dot: 'bg-sonic-primary', tag: 'bg-sonic-primary' },
  { bg: 'bg-sonic-accent/10', border: 'border-sonic-accent/40', text: 'text-sonic-accent', dot: 'bg-sonic-accent', tag: 'bg-sonic-accent' },
  { bg: 'bg-sonic-warning/10', border: 'border-sonic-warning/40', text: 'text-amber-600', dot: 'bg-sonic-warning', tag: 'bg-sonic-warning' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-600', dot: 'bg-purple-500', tag: 'bg-purple-500' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-600', dot: 'bg-pink-500', tag: 'bg-pink-500' },
];

interface ExtendedSigner {
  id: string;
  name: string;
  email: string;
  colorIndex: number;
}

export default function SignaturePlacementPage() {
  const { selectedDocumentId, setSelectedDocumentId, setCurrentPage } =
    useAppStore();

  const document = useMemo(
    () => mockDocuments.find((d) => d.id === selectedDocumentId),
    [selectedDocumentId]
  );

  // State
  const [currentPage, setCurrentPageNum] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [selectedType, setSelectedType] = useState<SignatureType>('signature');
  const [selectedSignerEmail, setSelectedSignerEmail] = useState<string>('');
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [undoStack, setUndoStack] = useState<SignaturePlacement[][]>([]);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredPlacementId, setHoveredPlacementId] = useState<string | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);

  // Build signers list from document + any added ones
  const signers: ExtendedSigner[] = useMemo(() => {
    if (!document) return [];
    const base = document.signers.map((s, i) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      colorIndex: i % signerColors.length,
    }));
    return base;
  }, [document]);

  // Set default selected signer
  React.useEffect(() => {
    if (signers.length > 0 && !selectedSignerEmail) {
      setSelectedSignerEmail(signers[0].email);
    }
  }, [signers, selectedSignerEmail]);

  const totalPages = document?.pages || 1;

  const getSignerColor = (email: string) => {
    const signer = signers.find((s) => s.email === email);
    const idx = signer ? signer.colorIndex : 0;
    return signerColors[idx % signerColors.length];
  };

  const getSignerName = (email: string) => {
    const signer = signers.find((s) => s.email === email);
    return signer?.name || email;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Save to undo stack before changes
  const saveUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-20), [...placements]]);
  }, [placements]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setPlacements(prev);
    setUndoStack((stack) => stack.slice(0, -1));
  };

  const handleClearAll = () => {
    if (placements.length === 0) return;
    saveUndo();
    setPlacements([]);
  };

  // Place a signature box at click position
  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewerRef.current) return;
    if (!selectedSignerEmail) return;

    // Don't place if clicking on an existing placement
    const target = e.target as HTMLElement;
    if (target.closest('[data-placement-id]')) return;

    const rect = viewerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const defaultSizes: Record<SignatureType, { w: number; h: number }> = {
      signature: { w: 25, h: 8 },
      initials: { w: 10, h: 6 },
      date: { w: 15, h: 6 },
      text: { w: 20, h: 6 },
    };

    const size = defaultSizes[selectedType];

    const newPlacement: SignaturePlacement = {
      id: `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      page: currentPage,
      x: Math.max(0, Math.min(100 - size.w, x - size.w / 2)),
      y: Math.max(0, Math.min(100 - size.h, y - size.h / 2)),
      width: size.w,
      height: size.h,
      signerEmail: selectedSignerEmail,
      signerName: getSignerName(selectedSignerEmail),
      type: selectedType,
    };

    saveUndo();
    setPlacements((prev) => [...prev, newPlacement]);
  };

  const handleDeletePlacement = (id: string) => {
    saveUndo();
    setPlacements((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDragPlacement = (id: string, deltaX: number, deltaY: number) => {
    setPlacements((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          x: Math.max(0, Math.min(100 - p.width, p.x + deltaX)),
          y: Math.max(0, Math.min(100 - p.height, p.y + deltaY)),
        };
      })
    );
  };

  const handleAddSigner = () => {
    if (!newSignerEmail.trim()) return;
    // In a real app, this would add to the document's signers
    // For now we just close the form
    setShowAddSigner(false);
    setNewSignerEmail('');
  };

  const handleSendRequest = () => {
    if (placements.length === 0) return;
    setSendDialogOpen(true);
  };

  const confirmSend = () => {
    setSendDialogOpen(false);
    setCurrentPage('sign-requests');
  };

  // Render simulated document page (same style as DocumentDetailsPage)
  const renderSimulatedPage = (pageNum: number) => {
    const paragraphWidths = [85, 92, 78, 95, 88, 72, 90, 83, 68, 94];
    const paragraphs = [
      { lines: 4, heading: true },
      { lines: 6, heading: false },
      { lines: 3, heading: false },
      { lines: 8, heading: false },
      { lines: 5, heading: true },
      { lines: 7, heading: false },
      { lines: 4, heading: false },
      { lines: 6, heading: false },
    ];

    let currentY = 5;
    let paraIndex = 0;
    const elements: React.ReactNode[] = [];

    elements.push(
      <div
        key="header"
        className="absolute bg-gray-200/60 rounded-sm"
        style={{ top: '3%', left: '8%', right: '8%', height: '1.5%' }}
      />
    );

    for (const para of paragraphs) {
      if (currentY > 88) break;
      paraIndex = (paraIndex + 1) % paragraphWidths.length;

      if (para.heading) {
        elements.push(
          <div
            key={`heading-${currentY}`}
            className="absolute bg-gray-400/20 rounded-sm"
            style={{
              top: `${currentY}%`,
              left: '8%',
              width: `${paragraphWidths[paraIndex] * 0.6}%`,
              height: '1.5%',
            }}
          />
        );
        currentY += 3;
      }

      for (let i = 0; i < para.lines; i++) {
        if (currentY > 88) break;
        const widthPercent =
          i === para.lines - 1
            ? paragraphWidths[(paraIndex + i) % paragraphWidths.length] * 0.5
            : paragraphWidths[(paraIndex + i) % paragraphWidths.length];

        elements.push(
          <div
            key={`line-${currentY}-${i}`}
            className="absolute bg-gray-300/30 rounded-sm"
            style={{
              top: `${currentY}%`,
              left: '8%',
              width: `${widthPercent}%`,
              height: '1%',
            }}
          />
        );
        currentY += 1.8;
      }
      currentY += 1.8;
    }

    elements.push(
      <div
        key="page-num"
        className="absolute text-gray-400/60 text-[10px]"
        style={{ bottom: '4%', left: '50%', transform: 'translateX(-50%)' }}
      >
        Page {pageNum}
      </div>
    );

    return elements;
  };

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-sonic-text">
            No document selected
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setCurrentPage('documents')}
          >
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  // Placements for current page
  const currentPagePlacements = placements.filter(
    (p) => p.page === currentPage
  );

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
            onClick={() => setCurrentPage('document-details')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-sonic-text sm:text-lg">
              {document.name}
            </h1>
            <p className="text-xs text-sonic-text-secondary">
              Place signature fields for signers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage('document-details')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendRequest}
            disabled={placements.length === 0}
            className="bg-sonic-primary hover:bg-sonic-primary/90 text-white"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Request
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-sonic-border bg-sonic-surface px-4 py-2 flex-wrap">
        {/* Signature Type Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-sonic-border p-0.5">
          {(Object.keys(signatureTypeConfig) as SignatureType[]).map((type) => {
            const config = signatureTypeConfig[type];
            return (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 gap-1.5 text-xs',
                  selectedType === type &&
                    'bg-sonic-primary text-white hover:bg-sonic-primary/90'
                )}
                onClick={() => setSelectedType(type)}
              >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
              </Button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Signer Selector */}
        <Select
          value={selectedSignerEmail}
          onValueChange={setSelectedSignerEmail}
        >
          <SelectTrigger className="h-7 w-auto min-w-[140px] text-xs">
            <SelectValue placeholder="Select signer" />
          </SelectTrigger>
          <SelectContent>
            {signers.map((signer) => (
              <SelectItem key={signer.id} value={signer.email}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      signerColors[signer.colorIndex % signerColors.length].dot
                    )}
                  />
                  {signer.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Undo / Clear */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-sonic-danger hover:text-sonic-danger"
          onClick={handleClearAll}
          disabled={placements.length === 0}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All
        </Button>

        <div className="flex-1" />

        {/* Placement count */}
        <span className="text-xs text-sonic-text-secondary">
          {placements.length} field{placements.length !== 1 ? 's' : ''} placed
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* PDF Viewer Area */}
        <main className="flex flex-1 flex-col bg-sonic-bg overflow-hidden">
          {/* Zoom Controls */}
          <div className="flex items-center justify-between border-b border-sonic-border bg-sonic-surface/80 px-4 py-1.5">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="min-w-[2.5rem] text-center text-[11px] font-medium text-sonic-text-secondary">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
            <span className="text-[11px] font-medium text-sonic-text-secondary">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Document Viewer */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 scrollbar-thin">
            <div className="mx-auto flex justify-center" style={{ maxWidth: `${zoom * 6}px` }}>
              <div
                ref={viewerRef}
                className="relative bg-white shadow-lg ring-1 ring-sonic-border/50 cursor-crosshair"
                style={{
                  width: `${zoom * 6}px`,
                  height: `${zoom * 8}px`,
                  borderRadius: '2px',
                }}
                onClick={handleDocumentClick}
              >
                {/* Simulated page content */}
                {renderSimulatedPage(currentPage)}

                {/* Signature Placements */}
                <AnimatePresence>
                  {currentPagePlacements.map((placement) => {
                    const color = getSignerColor(placement.signerEmail);
                    const typeConfig = signatureTypeConfig[placement.type];
                    const isHovered = hoveredPlacementId === placement.id;

                    return (
                      <DraggablePlacement
                        key={placement.id}
                        placement={placement}
                        color={color}
                        typeConfig={typeConfig}
                        isHovered={isHovered}
                        onHover={setHoveredPlacementId}
                        onDelete={() => handleDeletePlacement(placement.id)}
                        onDrag={(deltaX, deltaY) =>
                          handleDragPlacement(placement.id, deltaX, deltaY)
                        }
                        onDragStart={() => setDraggingId(placement.id)}
                        onDragEnd={() => setDraggingId(null)}
                        containerRef={viewerRef}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
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
            <span className="text-sm font-medium text-sonic-text">
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

        {/* Signer Panel */}
        <aside className="w-full shrink-0 border-t border-sonic-border bg-sonic-surface lg:w-72 lg:border-t-0 lg:border-l">
          <ScrollArea className="h-full max-h-64 lg:max-h-none">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-sonic-text uppercase tracking-wide">
                  Signers
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-sonic-primary"
                  onClick={() => setShowAddSigner(!showAddSigner)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>

              {/* Add signer form */}
              <AnimatePresence>
                {showAddSigner && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={newSignerEmail}
                        onChange={(e) => setNewSignerEmail(e.target.value)}
                        className="h-7 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddSigner();
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-7 bg-sonic-primary hover:bg-sonic-primary/90 text-white text-xs shrink-0"
                        onClick={handleAddSigner}
                      >
                        Add
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Signers list */}
              <div className="space-y-3">
                {signers.map((signer) => {
                  const color = signerColors[signer.colorIndex % signerColors.length];
                  const signerPlacements = placements.filter(
                    (p) => p.signerEmail === signer.email
                  );

                  return (
                    <div key={signer.id} className="space-y-1.5">
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors',
                          selectedSignerEmail === signer.email
                            ? cn(color.bg, color.border, 'border')
                            : 'border-sonic-border hover:bg-gray-50'
                        )}
                        onClick={() => setSelectedSignerEmail(signer.email)}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback
                            className={cn(
                              color.bg,
                              color.text,
                              'text-[10px] font-medium'
                            )}
                          >
                            {getInitials(signer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-sonic-text">
                            {signer.name}
                          </p>
                          <p className="truncate text-xs text-sonic-text-secondary">
                            {signer.email}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white',
                            color.tag
                          )}
                        >
                          {signerPlacements.length}
                        </span>
                      </div>

                      {/* Placement list for this signer */}
                      {signerPlacements.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {signerPlacements.map((p) => {
                            const typeConf = signatureTypeConfig[p.type];
                            return (
                              <div
                                key={p.id}
                                className="flex items-center justify-between rounded border border-sonic-border bg-white px-2 py-1"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full shrink-0',
                                      color.dot
                                    )}
                                  />
                                  <span className="text-[11px] text-sonic-text truncate">
                                    {typeConf.label}
                                  </span>
                                  <span className="text-[10px] text-sonic-text-secondary">
                                    p{p.page}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 shrink-0 text-sonic-text-secondary hover:text-sonic-danger"
                                  onClick={() => handleDeletePlacement(p.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Send Request Confirmation Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Signature Request</DialogTitle>
            <DialogDescription>
              You are about to send signature requests for{' '}
              <strong>{document.name}</strong> with {placements.length} field
              {placements.length !== 1 ? 's' : ''} placed across{' '}
              {new Set(placements.map((p) => p.page)).size} page
              {new Set(placements.map((p) => p.page)).size !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>

          {/* Summary */}
          <div className="rounded-lg border border-sonic-border bg-sonic-bg p-3 space-y-2">
            <h4 className="text-xs font-semibold text-sonic-text-secondary uppercase tracking-wide">
              Recipients
            </h4>
            {signers
              .filter((s) =>
                placements.some((p) => p.signerEmail === s.email)
              )
              .map((signer) => {
                const count = placements.filter(
                  (p) => p.signerEmail === signer.email
                ).length;
                const color = signerColors[signer.colorIndex % signerColors.length];
                return (
                  <div
                    key={signer.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          color.dot
                        )}
                      />
                      <span className="text-sm text-sonic-text">
                        {signer.name}
                      </span>
                    </div>
                    <span className="text-xs text-sonic-text-secondary">
                      {count} field{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSend}
              className="bg-sonic-primary hover:bg-sonic-primary/90 text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Requests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ============================================
// Draggable Placement Component
// ============================================

interface DraggablePlacementProps {
  placement: SignaturePlacement;
  color: (typeof signerColors)[0];
  typeConfig: { label: string; icon: React.ReactNode; shortLabel: string };
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onDelete: () => void;
  onDrag: (deltaX: number, deltaY: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function DraggablePlacement({
  placement,
  color,
  typeConfig,
  isHovered,
  onHover,
  onDelete,
  onDrag,
  onDragStart,
  onDragEnd,
  containerRef,
}: DraggablePlacementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; placementX: number; placementY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    onDragStart();

    const container = containerRef.current;
    if (!container) return;

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      placementX: placement.x,
      placementY: placement.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStart.current || !container) return;
      const rect = container.getBoundingClientRect();
      const deltaX =
        ((moveEvent.clientX - dragStart.current.x) / rect.width) * 100;
      const deltaY =
        ((moveEvent.clientY - dragStart.current.y) / rect.height) * 100;

      const newX = Math.max(
        0,
        Math.min(100 - placement.width, dragStart.current.placementX + deltaX)
      );
      const newY = Math.max(
        0,
        Math.min(100 - placement.height, dragStart.current.placementY + deltaY)
      );

      onDrag(newX - placement.x, newY - placement.y);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      onDragEnd();
      dragStart.current = null;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <motion.div
      data-placement-id={placement.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'absolute group select-none',
        isDragging && 'z-50'
      )}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        height: `${placement.height}%`,
      }}
      onMouseEnter={() => onHover(placement.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={cn(
          'h-full w-full rounded border-2 border-dashed transition-all',
          color.border,
          isHovered || isDragging ? `${color.bg} border-solid` : 'bg-transparent',
          isDragging && 'shadow-lg'
        )}
      >
        {/* Drag handle + label */}
        <div
          className={cn(
            'absolute -top-5 left-0 flex items-center gap-1 rounded-t px-1.5 py-0.5 text-[9px] font-semibold text-white',
            color.tag,
            isHovered || isDragging ? 'opacity-100' : 'opacity-80'
          )}
          onPointerDown={handlePointerDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <GripVertical className="h-2.5 w-2.5" />
          {placement.signerName.split(' ')[0]} - {typeConfig.label}
        </div>

        {/* Center content */}
        <div className="flex h-full items-center justify-center">
          <div className={cn('flex items-center gap-1 text-[10px]', color.text, (isHovered || isDragging) ? 'opacity-100' : 'opacity-60')}>
            {typeConfig.icon}
            <span className="font-medium">{typeConfig.shortLabel}</span>
          </div>
        </div>

        {/* Coordinates */}
        {(isHovered || isDragging) && (
          <div className="absolute -bottom-4 left-0 text-[8px] text-sonic-text-secondary font-mono">
            x:{Math.round(placement.x)} y:{Math.round(placement.y)}
          </div>
        )}

        {/* Delete button */}
        <button
          className={cn(
            'absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sonic-danger text-white transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </motion.div>
  );
}
