'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  Search,
  Loader2,
  Bot,
  User,
  BarChart2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Filter,
} from 'lucide-react';
import { auditApi, type Audit, type AuditStats } from '@/lib/api';

const auditTypeColors: Record<string, string> = {
  ai: 'bg-purple-500/10 text-purple-500',
  manual: 'bg-blue-500/10 text-blue-500',
  bulk: 'bg-emerald-500/10 text-emerald-500',
};

function getScoreColor(score?: number): string {
  if (score === undefined || score === null) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminAuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filters
  const [auditType, setAuditType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail view
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, any> = { page, limit };
      if (auditType !== 'all') filters.auditType = auditType;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const [auditsRes, statsRes] = await Promise.allSettled([
        auditApi.list(filters),
        auditApi.getStats(auditType !== 'all' ? { auditType } : undefined),
      ]);

      if (auditsRes.status === 'fulfilled') {
        let data = auditsRes.value.data || [];
        // Client-side search filter (agent name / call ID)
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          data = data.filter(
            (a) =>
              (a.agentName || '').toLowerCase().includes(q) ||
              (a.callId || '').toLowerCase().includes(q) ||
              (a.campaignName || '').toLowerCase().includes(q),
          );
        }
        setAudits(data);
        setTotalPages(auditsRes.value.pagination?.totalPages || 1);
        setTotal(auditsRes.value.pagination?.total || data.length);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (error) {
      console.error('Failed to fetch audits', error);
    } finally {
      setLoading(false);
    }
  }, [page, auditType, startDate, endDate, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [auditType, searchQuery, startDate, endDate]);

  const handleViewDetails = async (audit: Audit) => {
    setDetailLoading(true);
    try {
      const fullAudit = await auditApi.getById(audit._id);
      setSelectedAudit(fullAudit);
    } catch {
      // fallback to list data
      setSelectedAudit(audit);
    } finally {
      setDetailLoading(false);
    }
  };

  // Detail view
  if (selectedAudit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedAudit(null)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Audit Details</h2>
            <p className="text-muted-foreground">
              {selectedAudit.callId || selectedAudit._id}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Agent</p>
            <p className="font-semibold">{selectedAudit.agentName || '—'}</p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Type</p>
            <span
              className={`px-2 py-1 text-xs rounded-full ${auditTypeColors[selectedAudit.auditType] || ''}`}
            >
              {selectedAudit.auditType?.toUpperCase()}
            </span>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
            <p
              className={`text-2xl font-bold ${getScoreColor(selectedAudit.overallScore)}`}
            >
              {selectedAudit.overallScore !== undefined
                ? `${Math.round(selectedAudit.overallScore)}%`
                : '—'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Campaign</p>
            <p className="font-medium">{selectedAudit.campaignName || '—'}</p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Parameter Set</p>
            <p className="font-medium">
              {selectedAudit.qaParameterSetName || '—'}
            </p>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Date</p>
          <p className="font-medium">
            {formatDate(selectedAudit.auditDate || selectedAudit.createdAt)}
          </p>
        </div>

        {/* Billing & Usage Info */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Project ID</p>
            <p className="font-mono text-sm">
              {selectedAudit.projectId || '—'}
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Token Usage</p>
            {selectedAudit.tokenUsage ? (
              <div>
                <p className="font-bold text-lg">
                  {selectedAudit.tokenUsage.totalTokens?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  In: {selectedAudit.tokenUsage.inputTokens?.toLocaleString() || 0} /
                  Out: {selectedAudit.tokenUsage.outputTokens?.toLocaleString() || 0}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Sentiment</p>
            {selectedAudit.sentiment?.overall ? (
              <span className={`px-2 py-1 text-xs rounded-full ${
                selectedAudit.sentiment.overall === 'positive'
                  ? 'bg-green-500/10 text-green-500'
                  : selectedAudit.sentiment.overall === 'negative'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {selectedAudit.sentiment.overall.toUpperCase()}
              </span>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Confidence</p>
            <p className={`font-bold text-lg ${getScoreColor(selectedAudit.overallConfidence)}`}>
              {selectedAudit.overallConfidence !== undefined
                ? `${Math.round(selectedAudit.overallConfidence)}%`
                : '—'}
            </p>
          </div>
        </div>

        {/* Call Summary */}
        {selectedAudit.callSummary && (
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-2">Call Summary</p>
            <p className="text-sm leading-relaxed">{selectedAudit.callSummary}</p>
          </div>
        )}

        {/* Transcript */}
        {selectedAudit.transcript && (
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-2">Transcript</p>
            <pre className="text-xs bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
              {selectedAudit.transcript}
            </pre>
          </div>
        )}

        {/* Audit Results */}
        {selectedAudit.auditResults &&
          selectedAudit.auditResults.length > 0 && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold">
                  Audit Results ({selectedAudit.auditResults.length} parameters)
                </h3>
              </div>
              <div className="divide-y divide-border">
                {selectedAudit.auditResults.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {result.parameterName ||
                          result.parameter ||
                          `Parameter ${idx + 1}`}
                      </p>
                      {(result.comments || result.feedback) && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {result.comments || result.feedback}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {result.score !== undefined && (
                        <span
                          className={`text-sm font-bold ${getScoreColor(result.score)}`}
                        >
                          {Math.round(result.score)}%
                        </span>
                      )}
                      {result.pass !== undefined && (
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${result.pass ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                        >
                          {result.pass ? 'Pass' : 'Fail'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Audits</h2>
        <p className="text-muted-foreground">
          View all audit data across client instances
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Audits</p>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {stats.total?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">AI Audits</p>
              <Bot className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-purple-500">
              {stats.aiAudits?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Manual Audits</p>
              <User className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-blue-500">
              {stats.manualAudits?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Avg Score</p>
              <BarChart2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p
              className={`text-2xl font-bold mt-1 ${getScoreColor(stats.avgScore)}`}
            >
              {stats.avgScore ? `${Math.round(stats.avgScore)}%` : '—'}
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p
              className={`text-2xl font-bold mt-1 ${getScoreColor(stats.passRate)}`}
            >
              {stats.passRate ? `${Math.round(stats.passRate)}%` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by agent, call ID, or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={auditType}
          onChange={(e) => setAuditType(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="ai">AI</option>
          <option value="manual">Manual</option>
          <option value="bulk">Bulk</option>
        </select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Audits Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : audits.length === 0 ? (
        <div className="text-center py-12 bg-card/50 rounded-xl border border-border">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No audits found</h3>
          <p className="text-muted-foreground">
            {searchQuery || auditType !== 'all' || startDate || endDate
              ? 'Try adjusting your filters'
              : 'No audit data available yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Call ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Tokens
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audits.map((audit) => (
                  <tr
                    key={audit._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">
                        {audit.callId || audit._id.slice(-8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {audit.agentName || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${auditTypeColors[audit.auditType] || ''}`}
                      >
                        {audit.auditType?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm truncate max-w-[150px] block">
                        {audit.campaignName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        {audit.projectId
                          ? String(audit.projectId).slice(-8)
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${getScoreColor(audit.overallScore)}`}
                      >
                        {audit.overallScore !== undefined
                          ? `${Math.round(audit.overallScore)}%`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {audit.tokenUsage?.totalTokens
                          ? audit.tokenUsage.totalTokens.toLocaleString()
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(audit.auditDate || audit.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewDetails(audit)}
                        disabled={detailLoading}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{' '}
              of {total} audits
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
