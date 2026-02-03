'use client';

import { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { ticketApi, userApi, Ticket as TicketType } from '@/lib/api';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500',
  in_progress: 'bg-yellow-500/10 text-yellow-500',
  pending_customer: 'bg-orange-500/10 text-orange-500',
  resolved: 'bg-green-500/10 text-green-500',
  closed: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/10 text-slate-500',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  critical: 'bg-red-500/10 text-red-500',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending_customer: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
};

const categoryLabels: Record<string, string> = {
  technical: 'Technical',
  billing: 'Billing',
  feature_request: 'Feature',
  bug_report: 'Bug',
  other: 'Other',
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      if (searchQuery) filters.search = searchQuery;

      const [ticketsData, statsData] = await Promise.all([
        ticketApi.list(filters),
        ticketApi.getStats(),
      ]);
      setTickets(ticketsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setActionLoading(ticketId);
    try {
      await ticketApi.updateStatus(ticketId, newStatus);
      // Update local state
      setTickets(prev => prev.map(t =>
        t._id === ticketId ? { ...t, status: newStatus } : t
      ));
      // Refresh stats
      const statsData = await ticketApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-3 w-3" />;
      case 'in_progress':
        return <Clock className="h-3 w-3" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <p className="text-muted-foreground">Manage and respond to customer support requests</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total</p>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total || 0}</p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Open</p>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-blue-500">{stats.open || 0}</p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-500">{stats.inProgress || 0}</p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending</p>
              <MessageSquare className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-orange-500">{stats.pendingCustomer || 0}</p>
          </div>
          <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-green-500">{stats.resolved || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ticket # or subject..."
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
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_customer">Pending Customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Tickets Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-card/50 rounded-xl border border-border">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No support tickets yet'}
          </p>
        </div>
      ) : (
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">{ticket.ticketNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium truncate max-w-[200px] block">{ticket.subject}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{ticket.createdByName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full border border-border">
                      {categoryLabels[ticket.category] || ticket.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                      disabled={actionLoading === ticket._id}
                      className={`px-2 py-1 text-xs rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${statusColors[ticket.status]}`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending_customer">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => window.location.href = `/dashboard/tickets/${ticket._id}`}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
