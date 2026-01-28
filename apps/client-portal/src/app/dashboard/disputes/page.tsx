'use client';

import { useState } from 'react';
import { AlertCircle, Search, Clock, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';

interface Dispute {
  id: string;
  auditId: string;
  agentName: string;
  reason: string;
  details?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  resolution?: string;
  originalScore: number;
  adjustedScore?: number;
  createdAt: string;
  resolvedAt?: string;
}

const mockDisputes: Dispute[] = [
  { id: '1', auditId: 'AUD-2024-001', agentName: 'John Smith', reason: 'Incorrect Parameter Scoring', details: 'The compliance check was marked as failed but I followed the script exactly as required.', status: 'pending', originalScore: 72, createdAt: '2026-01-17' },
  { id: '2', auditId: 'AUD-2024-002', agentName: 'Sarah Johnson', reason: 'Audio Quality Issues', details: 'The customer side audio was unclear which affected the transcription accuracy.', status: 'under_review', originalScore: 68, createdAt: '2026-01-16' },
  { id: '3', auditId: 'AUD-2024-003', agentName: 'Mike Davis', reason: 'Wrong Agent Attribution', details: 'This call was handled by another agent, not me.', status: 'resolved', resolution: 'Verified with call records - reassigned to correct agent.', originalScore: 45, adjustedScore: 0, createdAt: '2026-01-15', resolvedAt: '2026-01-16' },
  { id: '4', auditId: 'AUD-2024-004', agentName: 'Emily Brown', reason: 'Unfair Scoring', details: 'The hold time penalty was too harsh given the system was slow.', status: 'rejected', resolution: 'System logs show normal response times. Original score stands.', originalScore: 65, createdAt: '2026-01-14', resolvedAt: '2026-01-15' },
];

export default function DisputesPage() {
  const [disputes, setDisputes] = useState(mockDisputes);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [adjustedScore, setAdjustedScore] = useState<number | undefined>();
  const [processing, setProcessing] = useState(false);

  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = d.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         d.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         d.auditId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleResolve = async () => {
    if (!selectedDispute || !resolution.trim()) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    setDisputes(prev => prev.map(d => 
      d.id === selectedDispute.id ? { 
        ...d, 
        status: 'resolved' as const, 
        resolution, 
        adjustedScore,
        resolvedAt: new Date().toISOString().split('T')[0] 
      } : d
    ));
    setSelectedDispute(null);
    setResolution('');
    setAdjustedScore(undefined);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedDispute || !resolution.trim()) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    setDisputes(prev => prev.map(d => 
      d.id === selectedDispute.id ? { 
        ...d, 
        status: 'rejected' as const, 
        resolution,
        resolvedAt: new Date().toISOString().split('T')[0] 
      } : d
    ));
    setSelectedDispute(null);
    setResolution('');
    setProcessing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500';
      case 'under_review': return 'bg-blue-500/10 text-blue-500';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500';
      case 'rejected': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'under_review': return <MessageSquare className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const stats = {
    total: disputes.length,
    pending: disputes.filter(d => d.status === 'pending').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    rejected: disputes.filter(d => d.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dispute Management</h2>
          <p className="text-muted-foreground">Review and resolve agent audit disputes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Disputes</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-amber-500/30 p-4">
          <p className="text-sm text-amber-500">Pending</p>
          <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-emerald-500/30 p-4">
          <p className="text-sm text-emerald-500">Resolved</p>
          <p className="text-2xl font-bold text-emerald-500">{stats.resolved}</p>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-red-500/30 p-4">
          <p className="text-sm text-red-500">Rejected</p>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search disputes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Disputes Table */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Audit ID</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agent</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reason</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Score</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Date</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDisputes.map((dispute) => (
              <tr key={dispute.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-mono text-xs">{dispute.auditId}</span>
                </td>
                <td className="py-3 px-4">{dispute.agentName}</td>
                <td className="py-3 px-4">
                  <p className="line-clamp-1">{dispute.reason}</p>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="font-medium">{dispute.originalScore}</span>
                  {dispute.adjustedScore !== undefined && (
                    <span className="text-emerald-500 ml-1">→ {dispute.adjustedScore}</span>
                  )}
                </td>
                <td className="text-center py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(dispute.status)}`}>
                    {getStatusIcon(dispute.status)}
                    {dispute.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="text-center py-3 px-4 text-muted-foreground">{dispute.createdAt}</td>
                <td className="text-right py-3 px-4">
                  {(dispute.status === 'pending' || dispute.status === 'under_review') && (
                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      className="px-3 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Review Dispute</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Audit ID</p>
                <p className="font-mono">{selectedDispute.auditId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agent</p>
                <p>{selectedDispute.agentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="font-medium">{selectedDispute.reason}</p>
              </div>
              {selectedDispute.details && (
                <div>
                  <p className="text-sm text-muted-foreground">Details</p>
                  <p className="text-sm">{selectedDispute.details}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Original Score</p>
                <p className="font-bold">{selectedDispute.originalScore}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Resolution *</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="Explain the resolution..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Adjusted Score (optional)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={adjustedScore ?? ''}
                  onChange={(e) => setAdjustedScore(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="New score if applicable"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleResolve}
                disabled={processing || !resolution.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                Resolve
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !resolution.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => { setSelectedDispute(null); setResolution(''); setAdjustedScore(undefined); }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
