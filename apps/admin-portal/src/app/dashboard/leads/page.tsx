'use client';

import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Building, MessageSquare, Calendar, Loader2 } from 'lucide-react';
import { contactApi, Lead } from '@/lib/api';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await contactApi.getLeads();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead =>
    (lead.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500';
      case 'contacted': return 'bg-yellow-500/10 text-yellow-500';
      case 'qualified': return 'bg-green-500/10 text-green-500';
      case 'lost': return 'bg-red-500/10 text-red-500';
      case 'converted': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'demo' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leads & Inquiries</h2>
          <p className="text-muted-foreground">Manage contact form submissions and demo requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLeads}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Refresh"
          >
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Leads Table */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Lead Info</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Message</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No leads found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{lead.name}</span>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                          <Mail className="h-3 w-3" />
                          <span>{lead.email}</span>
                        </div>
                        {lead.company && (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                            <Building className="h-3 w-3" />
                            <span>{lead.company}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase tracking-wider ${getTypeColor(lead.type)}`}>
                        {lead.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lead.message ? (
                        <div className="max-w-xs truncate text-muted-foreground" title={lead.message}>
                          {lead.message}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No message</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString()}
                      <span className="block text-xs opacity-70">
                        {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
