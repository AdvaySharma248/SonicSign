'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Upload,
  LayoutGrid,
  List,
  MoreHorizontal,
  Eye,
  Send,
  Download,
  Trash2,
  ArrowUpDown,
  File,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/store/useAppStore';
import { mockDocuments } from '@/data/mock';
import type { Document, DocumentStatus } from '@/types';

// ─── Status Config ───────────────────────────────────────────────────────────

const statusConfig: Record<
  DocumentStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: <Clock className="size-3" />,
  },
  signed: {
    label: 'Signed',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 className="size-3" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: <XCircle className="size-3" />,
  },
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <Edit3 className="size-3" />,
  },
  expired: {
    label: 'Expired',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: <AlertTriangle className="size-3" />,
  },
};

type FilterStatus = 'all' | DocumentStatus;

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'signed', label: 'Signed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
];

// ─── Status Badge Component ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Sort Types ──────────────────────────────────────────────────────────────

type SortKey = 'name' | 'owner' | 'date' | 'status' | 'pages';
type SortDir = 'asc' | 'desc';

// ─── Sort Icon Component ─────────────────────────────────────────────────────

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) {
    return <ArrowUpDown className="size-3 text-muted-foreground/50" />;
  }
  return (
    <ArrowUpDown
      className={cn(
        'size-3',
        sortDir === 'asc' ? 'text-primary' : 'text-primary rotate-180'
      )}
    />
  );
}

// ─── Empty State Component ────────────────────────────────────────────────────

function EmptyState({ hasSearch, onUpload }: { hasSearch: boolean; onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 mb-4">
        <Inbox className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        No documents found
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {hasSearch
          ? "Try adjusting your search or filter to find what you're looking for."
          : 'Upload your first document to get started with SonicSign.'}
      </p>
      {!hasSearch && (
        <Button
          className="mt-6 rounded-xl"
          onClick={onUpload}
        >
          <Upload className="size-4" />
          Upload Document
        </Button>
      )}
    </motion.div>
  );
}

// ─── Sort helpers ────────────────────────────────────────────────────────────

function sortDocuments(
  docs: Document[],
  key: SortKey,
  dir: SortDir
): Document[] {
  return [...docs].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'owner':
        cmp = a.owner.localeCompare(b.owner);
        break;
      case 'date':
        cmp = a.date.localeCompare(b.date);
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'pages':
        cmp = a.pages - b.pages;
        break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { setCurrentPage, setSelectedDocumentId, documentViewMode, setDocumentViewMode } =
    useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filter & search
  const filteredDocuments = useMemo(() => {
    let docs = mockDocuments;

    // Status filter
    if (activeFilter !== 'all') {
      docs = docs.filter((d) => d.status === activeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.owner.toLowerCase().includes(q)
      );
    }

    // Sort
    return sortDocuments(docs, sortKey, sortDir);
  }, [searchQuery, activeFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleCardClick = (doc: Document) => {
    setSelectedDocumentId(doc.id);
    setCurrentPage('document-details');
  };

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Documents
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage and track all your documents
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[220px] sm:w-[280px] rounded-xl bg-white border-sonic-border"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-xl border border-sonic-border bg-white p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center justify-center size-8 rounded-lg transition-all',
                      documentViewMode === 'grid'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setDocumentViewMode('grid')}
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center justify-center size-8 rounded-lg transition-all',
                      documentViewMode === 'list'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setDocumentViewMode('list')}
                  >
                    <List className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
            </div>

            {/* Upload button */}
            <Button
              className="rounded-xl shadow-sm"
              onClick={() => setCurrentPage('upload')}
            >
              <Upload className="size-4" />
              <span className="hidden sm:inline">Upload Document</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>

        {/* ─── Filter Pills ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {filterOptions.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white text-muted-foreground border border-sonic-border hover:border-primary/30 hover:text-foreground'
              )}
            >
              {filter.value !== 'all' && statusConfig[filter.value].icon}
              {filter.label}
              {filter.value !== 'all' && (
                <span
                  className={cn(
                    'ml-0.5 text-xs',
                    activeFilter === filter.value
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {mockDocuments.filter((d) => d.status === filter.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {filteredDocuments.length === 0 ? (
          <EmptyState
            hasSearch={!!searchQuery || activeFilter !== 'all'}
            onUpload={() => setCurrentPage('upload')}
          />
        ) : documentViewMode === 'grid' ? (
          /* ─── Grid View ──────────────────────────────────────────────────── */
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredDocuments.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Card
                    className="group cursor-pointer rounded-2xl border-sonic-border bg-white hover:shadow-md hover:border-primary/20 transition-all duration-200 py-0 gap-0 overflow-hidden"
                    onClick={() => handleCardClick(doc)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-foreground truncate leading-tight">
                              {doc.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {doc.owner}
                            </p>
                          </div>
                        </div>

                        {/* Actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 -mt-1 -mr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl"
                          >
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(doc);
                              }}
                            >
                              <Eye className="size-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Send className="size-4" />
                              Request Signature
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="size-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="rounded-lg cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <StatusBadge status={doc.status} />
                        <span className="text-xs text-muted-foreground">
                          {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-sonic-border/60 pt-3">
                        <span className="text-xs text-muted-foreground">
                          {doc.lastModified}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doc.size}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ─── List View ──────────────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="rounded-2xl border-sonic-border bg-white overflow-hidden py-0 gap-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-sonic-border">
                    <TableHead className="pl-5">
                      <button
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        Name
                        <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <button
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleSort('owner')}
                      >
                        Owner
                        <SortIcon column="owner" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <button
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        Date
                        <SortIcon column="date" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <button
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => handleSort('pages')}
                      >
                        Pages
                        <SortIcon column="pages" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc, i) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.02 }}
                      className="group cursor-pointer border-sonic-border/60 hover:bg-primary/[0.02] transition-colors"
                      onClick={() => handleCardClick(doc)}
                    >
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                            <File className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate max-w-[220px]">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {doc.owner}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {doc.owner}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {doc.lastModified}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {doc.pages}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl"
                          >
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(doc);
                              }}
                            >
                              <Eye className="size-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Send className="size-4" />
                              Request Signature
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="size-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="rounded-lg cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
