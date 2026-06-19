'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Eye,
  Pen,
  X,
  Trash2,
  Download,
  Send,
  Check,
  LogIn,
  LogOut,
  Settings,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  FileText,
  DownloadCloud,
  Shield,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { auditApi } from '@/services/api';
import type { AuditEvent, AuditLog } from '@/types';

const eventIconMap: Record<AuditEvent, React.ElementType> = {
  'document.uploaded': Upload,
  'document.viewed': Eye,
  'document.signed': Pen,
  'document.rejected': X,
  'document.deleted': Trash2,
  'document.downloaded': Download,
  'signature.requested': Send,
  'signature.completed': Check,
  'email.queued': Mail,
  'email.delivered': Mail,
  'email.failed': AlertTriangle,
  'field.completed': Check,
  'document.finalized': Check,
  'user.login': LogIn,
  'user.logout': LogOut,
  'settings.updated': Settings,
};

const eventColorMap: Record<AuditEvent, string> = {
  'document.uploaded': 'text-blue-500 bg-blue-50',
  'document.viewed': 'text-amber-500 bg-amber-50',
  'document.signed': 'text-emerald-500 bg-emerald-50',
  'document.rejected': 'text-red-500 bg-red-50',
  'document.deleted': 'text-gray-500 bg-gray-50',
  'document.downloaded': 'text-purple-500 bg-purple-50',
  'signature.requested': 'text-sonic-primary bg-sonic-secondary',
  'signature.completed': 'text-teal-500 bg-teal-50',
  'email.queued': 'text-blue-500 bg-blue-50',
  'email.delivered': 'text-emerald-500 bg-emerald-50',
  'email.failed': 'text-red-500 bg-red-50',
  'field.completed': 'text-cyan-500 bg-cyan-50',
  'document.finalized': 'text-green-600 bg-green-50',
  'user.login': 'text-green-500 bg-green-50',
  'user.logout': 'text-gray-500 bg-gray-50',
  'settings.updated': 'text-indigo-500 bg-indigo-50',
};

const eventLabelMap: Record<AuditEvent, string> = {
  'document.uploaded': 'Document Uploaded',
  'document.viewed': 'Document Viewed',
  'document.signed': 'Document Signed',
  'document.rejected': 'Document Rejected',
  'document.deleted': 'Document Deleted',
  'document.downloaded': 'Document Downloaded',
  'signature.requested': 'Signature Requested',
  'signature.completed': 'Signature Completed',
  'email.queued': 'Email Queued',
  'email.delivered': 'Email Delivered',
  'email.failed': 'Email Failed',
  'field.completed': 'Field Completed',
  'document.finalized': 'Document Completed',
  'user.login': 'User Login',
  'user.logout': 'User Logout',
  'settings.updated': 'Settings Updated',
};

const eventTypeOptions: { label: string; value: AuditEvent | 'all' }[] = [
  { label: 'All Events', value: 'all' },
  { label: 'Document Uploaded', value: 'document.uploaded' },
  { label: 'Document Viewed', value: 'document.viewed' },
  { label: 'Document Signed', value: 'document.signed' },
  { label: 'Document Rejected', value: 'document.rejected' },
  { label: 'Document Deleted', value: 'document.deleted' },
  { label: 'Document Downloaded', value: 'document.downloaded' },
  { label: 'Signature Requested', value: 'signature.requested' },
  { label: 'Signature Completed', value: 'signature.completed' },
  { label: 'Email Queued', value: 'email.queued' },
  { label: 'Email Delivered', value: 'email.delivered' },
  { label: 'Email Failed', value: 'email.failed' },
  { label: 'Field Completed', value: 'field.completed' },
  { label: 'Document Completed', value: 'document.finalized' },
  { label: 'User Login', value: 'user.login' },
  { label: 'User Logout', value: 'user.logout' },
  { label: 'Settings Updated', value: 'settings.updated' },
];

const dateRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'All Time', value: 'all' },
];

const ITEMS_PER_PAGE = 8;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<AuditEvent | 'all'>('all');
  const [dateRange, setDateRange] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    let active = true;
    async function loadLogs() {
      try {
        setLoading(true);
        const data = await auditApi.getLogs();
        if (active) {
          setLogs(data || []);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadLogs();
    return () => {
      active = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    // Event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter((log) => log.event === eventTypeFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoff: Date;
      switch (dateRange) {
        case 'today':
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      filtered = filtered.filter((log) => new Date(log.timestamp) >= cutoff);
    }

    // User filter
    if (userFilter.trim()) {
      const query = userFilter.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.user.toLowerCase().includes(query) ||
          log.userEmail.toLowerCase().includes(query)
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.details.toLowerCase().includes(query) ||
          log.user.toLowerCase().includes(query) ||
          log.event.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp
    filtered.sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortDirection === 'asc' ? diff : -diff;
    });

    return filtered;
  }, [logs, searchQuery, eventTypeFilter, dateRange, userFilter, sortDirection]);

  const visibleLogs = filteredLogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLogs.length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatTimestamp(timestamp);
  };

  const getFullDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-sonic-primary/20 border-t-sonic-primary animate-spin" />
        <p className="text-sm font-medium text-sonic-text-secondary animate-pulse">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-6">
        <div>
          <h1 className="text-2xl text-page-title text-sonic-text">
            Audit Logs
          </h1>
          <p className="text-sm text-body text-sonic-text-secondary mt-1">
            Track all activities and changes across your workspace
          </p>
        </div>
        <Button variant="outline" className="border-sonic-border text-button cursor-pointer">
          <DownloadCloud className="size-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-sonic-text-secondary" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-sonic-border"
          />
        </div>

        {/* Event Type Filter */}
        <Select
          value={eventTypeFilter}
          onValueChange={(value) => setEventTypeFilter(value as AuditEvent | 'all')}
        >
          <SelectTrigger className="w-[200px] bg-white border-sonic-border">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[160px] bg-white border-sonic-border">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {dateRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* User Filter */}
        <div className="relative max-w-xs">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-sonic-text-secondary" />
          <Input
            placeholder="Filter by user..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="pl-9 bg-white border-sonic-border"
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-sonic-border shadow-sm overflow-hidden flex-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-sonic-border">
              <TableHead className="w-8" />
              <TableHead className="text-label">Event</TableHead>
              <TableHead className="text-label">User</TableHead>
              <TableHead
                className="cursor-pointer select-none text-label"
                onClick={toggleSort}
              >
                <span className="inline-flex items-center gap-1">
                  Timestamp
                  <ArrowUpDown
                    className={cn(
                      'size-3 transition-colors',
                      'text-sonic-primary'
                    )}
                  />
                </span>
              </TableHead>
              <TableHead className="text-label">IP Address</TableHead>
              <TableHead className="text-label">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {visibleLogs.map((log, index) => (
                <LogRow
                  key={log.id}
                  log={log}
                  index={index}
                  isExpanded={expandedRow === log.id}
                  onToggle={() =>
                    setExpandedRow(expandedRow === log.id ? null : log.id)
                  }
                  formatTimestamp={formatTimestamp}
                  formatTime={formatTime}
                  getRelativeTime={getRelativeTime}
                  getFullDate={getFullDate}
                />
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-muted/50 mb-4">
              <FileText className="size-7 text-sonic-text-secondary" />
            </div>
            <h3 className="text-lg text-section-title text-sonic-text mb-1">
              No logs found
            </h3>
            <p className="text-sm text-sonic-text-secondary text-center max-w-sm">
              Try adjusting your filters or search query to find what you&apos;re looking for.
            </p>
          </div>
        )}
      </div>

      {/* Load More / Footer */}
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-sm text-sonic-text-secondary">
          Showing {Math.min(visibleCount, filteredLogs.length)} of {filteredLogs.length} entries
        </span>
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
            className="border-sonic-border text-button cursor-pointer"
          >
            Load More
          </Button>
        )}
      </div>
    </div>
  );
}

function LogRow({
  log,
  index,
  isExpanded,
  onToggle,
  formatTimestamp,
  formatTime,
  getRelativeTime,
  getFullDate,
}: {
  log: AuditLog;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  formatTimestamp: (t: string) => string;
  formatTime: (t: string) => string;
  getRelativeTime: (t: string) => string;
  getFullDate: (t: string) => string;
}) {
  const Icon = eventIconMap[log.event] || FileText;
  const colorClasses = eventColorMap[log.event] || 'text-gray-500 bg-gray-50';
  const eventLabel = eventLabelMap[log.event] || log.event;

  return (
    <React.Fragment>
      <motion.tr
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className={cn(
          'border-b border-sonic-border last:border-0 cursor-pointer transition-colors',
          index % 2 === 1 ? 'bg-sonic-bg/30' : '',
          isExpanded ? 'bg-sonic-secondary/30' : 'hover:bg-sonic-bg/50'
        )}
        onClick={onToggle}
      >
        <TableCell className="py-3 w-8">
          {isExpanded ? (
            <ChevronDown className="size-4 text-sonic-text-secondary" />
          ) : (
            <ChevronRight className="size-4 text-sonic-text-secondary/40" />
          )}
        </TableCell>
        <TableCell className="py-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex items-center justify-center size-7 rounded-lg',
                colorClasses
              )}
            >
              <Icon className="size-3.5" />
            </div>
            <span className="text-sm font-medium text-sonic-text">
              {eventLabel}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div>
            <div className="text-sm text-sonic-text font-medium">
              {log.user}
            </div>
            <div className="text-xs text-sonic-text-secondary">
              {log.userEmail}
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm text-sonic-text-secondary">
                <div>{formatTimestamp(log.timestamp)}</div>
                <div className="text-xs text-sonic-text-secondary/70">
                  {formatTime(log.timestamp)} · {getRelativeTime(log.timestamp)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>{getFullDate(log.timestamp)}</p>
            </TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell className="py-3">
          <code className="text-xs text-mono-value text-sonic-text-secondary bg-muted/50 px-1.5 py-0.5 rounded">
            {log.ipAddress || '—'}
          </code>
        </TableCell>
        <TableCell className="py-3 max-w-[240px]">
          <p className="text-sm text-sonic-text-secondary truncate">
            {log.details}
          </p>
        </TableCell>
      </motion.tr>
      {isExpanded && (
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-sonic-secondary/20"
        >
          <TableCell colSpan={6} className="py-4 px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-sonic-text-secondary text-label">
                  Event Type
                </span>
                <p className="text-sonic-text mt-1 text-mono-value text-xs">
                  {log.event}
                </p>
              </div>
              <div>
                <span className="text-sonic-text-secondary text-label">
                  Resource
                </span>
                <p className="text-sonic-text mt-1 text-mono-value text-xs">
                  {log.resource || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-sonic-text-secondary text-label">
                  IP Address
                </span>
                <p className="text-sonic-text mt-1 text-mono-value text-xs">
                  {log.ipAddress || '—'}
                </p>
              </div>
              <div>
                <span className="text-sonic-text-secondary text-label">
                  Full Details
                </span>
                <p className="text-sonic-text mt-1 text-xs">{log.details}</p>
              </div>
            </div>
          </TableCell>
        </motion.tr>
      )}
    </React.Fragment>
  );
}
