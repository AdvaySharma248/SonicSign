'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Bell,
  FileText,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Ban,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { mockSignRequests } from '@/data/mock';
import type { RequestStatus, SignRequest } from '@/types';

const statusConfig: Record<
  RequestStatus,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  sent: {
    label: 'Sent',
    color: 'text-sonic-primary',
    bgColor: 'bg-sonic-secondary',
    icon: Send,
  },
  viewed: {
    label: 'Viewed',
    color: 'text-sonic-warning',
    bgColor: 'bg-amber-50',
    icon: Eye,
  },
  signed: {
    label: 'Signed',
    color: 'text-sonic-success',
    bgColor: 'bg-emerald-50',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-sonic-danger',
    bgColor: 'bg-red-50',
    icon: XCircle,
  },
  expired: {
    label: 'Expired',
    color: 'text-sonic-text-secondary',
    bgColor: 'bg-gray-50',
    icon: Clock,
  },
};

const statusTabs: { label: string; value: RequestStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Sent', value: 'sent' },
  { label: 'Viewed', value: 'viewed' },
  { label: 'Signed', value: 'signed' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
];

type SortField = 'documentName' | 'recipientName' | 'status' | 'sentDate' | 'completedDate';
type SortDirection = 'asc' | 'desc';

export default function SignRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('sentDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredRequests = useMemo(() => {
    let filtered = [...mockSignRequests];

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter((req) => req.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.recipientEmail.toLowerCase().includes(query) ||
          req.recipientName.toLowerCase().includes(query) ||
          req.documentName.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'documentName':
          comparison = a.documentName.localeCompare(b.documentName);
          break;
        case 'recipientName':
          comparison = a.recipientName.localeCompare(b.recipientName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'sentDate':
          comparison = new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime();
          break;
        case 'completedDate':
          const aDate = a.completedDate ? new Date(a.completedDate).getTime() : 0;
          const bDate = b.completedDate ? new Date(b.completedDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [activeTab, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: RequestStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge
        variant="outline"
        className={cn(
          'gap-1 border-0 font-medium',
          config.bgColor,
          config.color
        )}
      >
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-6">
        <div>
          <h1 className="text-2xl text-page-title text-sonic-text">
            Sign Requests
          </h1>
          <p className="text-sm text-body text-sonic-text-secondary mt-1">
            Manage and track your document signature requests
          </p>
        </div>
        <Button className="bg-sonic-primary hover:bg-sonic-primary/90 text-white shadow-sm text-button">
          <Plus className="size-4" />
          New Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                activeTab === tab.value
                  ? 'bg-white text-sonic-text shadow-sm'
                  : 'text-sonic-text-secondary hover:text-sonic-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-sonic-text-secondary" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-sonic-border"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-sonic-border shadow-sm overflow-hidden flex-1">
        {filteredRequests.length === 0 ? (
          <EmptyState searchQuery={searchQuery} activeTab={activeTab} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-sonic-border">
                <TableHead
                  className="cursor-pointer select-none text-label"
                  onClick={() => handleSort('documentName')}
                >
                  <span className="inline-flex items-center">
                    Document Name
                    <ArrowUpDown className={cn('ml-1 inline size-3 transition-colors', sortField === 'documentName' ? 'text-sonic-primary' : 'text-sonic-text-secondary/40')} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-label"
                  onClick={() => handleSort('recipientName')}
                >
                  <span className="inline-flex items-center">
                    Recipient
                    <ArrowUpDown className={cn('ml-1 inline size-3 transition-colors', sortField === 'recipientName' ? 'text-sonic-primary' : 'text-sonic-text-secondary/40')} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-label"
                  onClick={() => handleSort('status')}
                >
                  <span className="inline-flex items-center">
                    Status
                    <ArrowUpDown className={cn('ml-1 inline size-3 transition-colors', sortField === 'status' ? 'text-sonic-primary' : 'text-sonic-text-secondary/40')} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-label"
                  onClick={() => handleSort('sentDate')}
                >
                  <span className="inline-flex items-center">
                    Sent Date
                    <ArrowUpDown className={cn('ml-1 inline size-3 transition-colors', sortField === 'sentDate' ? 'text-sonic-primary' : 'text-sonic-text-secondary/40')} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-label"
                  onClick={() => handleSort('completedDate')}
                >
                  <span className="inline-flex items-center">
                    Completed
                    <ArrowUpDown className={cn('ml-1 inline size-3 transition-colors', sortField === 'completedDate' ? 'text-sonic-primary' : 'text-sonic-text-secondary/40')} />
                  </span>
                </TableHead>
                <TableHead className="w-12 text-label">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredRequests.map((request, index) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    index={index}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer count */}
      {filteredRequests.length > 0 && (
        <div className="mt-4 text-sm text-sonic-text-secondary px-1">
          Showing {filteredRequests.length} of {mockSignRequests.length} requests
        </div>
      )}
    </div>
  );
}

function RequestRow({
  request,
  index,
  formatDate,
  getStatusBadge,
}: {
  request: SignRequest;
  index: number;
  formatDate: (d: string) => string;
  getStatusBadge: (s: RequestStatus) => React.ReactNode;
}) {
  const canRemind = request.status === 'sent' || request.status === 'viewed';
  const canCancel = request.status === 'sent' || request.status === 'viewed';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group border-b border-sonic-border last:border-0 hover:bg-sonic-bg/50 transition-colors"
    >
      <TableCell className="py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-sonic-secondary">
            <FileText className="size-4 text-sonic-primary" />
          </div>
          <span className="text-card-title text-sonic-text text-sm">
            {request.documentName}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-3.5">
        <div>
          <div className="text-sm text-card-title text-sonic-text">
            {request.recipientName}
          </div>
          <div className="text-xs text-sonic-text-secondary">
            {request.recipientEmail}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3.5">{getStatusBadge(request.status)}</TableCell>
      <TableCell className="py-3.5 text-sm text-sonic-text-secondary">
        {formatDate(request.sentDate)}
      </TableCell>
      <TableCell className="py-3.5 text-sm text-sonic-text-secondary">
        {request.completedDate ? formatDate(request.completedDate) : (
          <span className="text-sonic-text-secondary/40">—</span>
        )}
      </TableCell>
      <TableCell className="py-3.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="gap-2">
              <ExternalLink className="size-4" />
              View Document
            </DropdownMenuItem>
            {canRemind && (
              <DropdownMenuItem className="gap-2">
                <Bell className="size-4" />
                Send Reminder
              </DropdownMenuItem>
            )}
            {canCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-sonic-danger focus:text-sonic-danger">
                  <Ban className="size-4" />
                  Cancel Request
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  );
}

function EmptyState({
  searchQuery,
  activeTab,
}: {
  searchQuery: string;
  activeTab: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="flex items-center justify-center size-14 rounded-2xl bg-muted/50 mb-4">
        <Inbox className="size-7 text-sonic-text-secondary" />
      </div>
      <h3 className="text-lg text-section-title text-sonic-text mb-1">
        No requests found
      </h3>
      <p className="text-sm text-sonic-text-secondary text-center max-w-sm">
        {searchQuery
          ? `No results for "${searchQuery}". Try a different search term.`
          : activeTab !== 'all'
            ? `No ${activeTab} requests at the moment.`
            : 'No signature requests have been sent yet.'}
      </p>
    </motion.div>
  );
}
