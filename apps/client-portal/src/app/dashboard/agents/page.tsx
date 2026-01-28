'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, TrendingUp, TrendingDown, AlertTriangle, Award, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  email: string;
  team: string;
  totalAudits: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'needs_improvement' | 'at_risk';
  lastAuditDate: string;
}

const mockAgents: Agent[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@company.com', team: 'Team Alpha', totalAudits: 156, avgScore: 94.2, trend: 'up', status: 'excellent', lastAuditDate: '2026-01-10' },
  { id: '2', name: 'Mike Chen', email: 'mike@company.com', team: 'Team Alpha', totalAudits: 143, avgScore: 91.8, trend: 'up', status: 'excellent', lastAuditDate: '2026-01-10' },
  { id: '3', name: 'Emily Davis', email: 'emily@company.com', team: 'Team Beta', totalAudits: 138, avgScore: 89.5, trend: 'stable', status: 'good', lastAuditDate: '2026-01-09' },
  { id: '4', name: 'David Kim', email: 'david@company.com', team: 'Team Beta', totalAudits: 127, avgScore: 87.3, trend: 'down', status: 'good', lastAuditDate: '2026-01-09' },
  { id: '5', name: 'Lisa Wang', email: 'lisa@company.com', team: 'Team Alpha', totalAudits: 119, avgScore: 85.9, trend: 'stable', status: 'good', lastAuditDate: '2026-01-08' },
  { id: '6', name: 'James Brown', email: 'james@company.com', team: 'Team Gamma', totalAudits: 112, avgScore: 78.4, trend: 'down', status: 'needs_improvement', lastAuditDate: '2026-01-08' },
  { id: '7', name: 'Anna Wilson', email: 'anna@company.com', team: 'Team Gamma', totalAudits: 98, avgScore: 72.1, trend: 'down', status: 'at_risk', lastAuditDate: '2026-01-07' },
];

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const teams = [...new Set(mockAgents.map(a => a.team))];

  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesTeam = teamFilter === 'all' || agent.team === teamFilter;
    return matchesSearch && matchesStatus && matchesTeam;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-500 bg-emerald-500/10';
      case 'good': return 'text-blue-500 bg-blue-500/10';
      case 'needs_improvement': return 'text-amber-500 bg-amber-500/10';
      case 'at_risk': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <span className="text-muted-foreground">—</span>;
    }
  };

  // Stats
  const atRiskCount = mockAgents.filter(a => a.status === 'at_risk').length;
  const avgTeamScore = Math.round(mockAgents.reduce((sum, a) => sum + a.avgScore, 0) / mockAgents.length * 10) / 10;
  const topPerformers = mockAgents.filter(a => a.status === 'excellent').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Performance</h2>
          <p className="text-muted-foreground">Monitor and compare agent performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAgents.length}</p>
                <p className="text-xs text-muted-foreground">Total Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Award className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{topPerformers}</p>
                <p className="text-xs text-muted-foreground">Top Performers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgTeamScore}%</p>
                <p className="text-xs text-muted-foreground">Team Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-card/50 backdrop-blur ${atRiskCount > 0 ? 'border-red-500/50' : 'border-border/50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{atRiskCount}</p>
                <p className="text-xs text-muted-foreground">At Risk Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="needs_improvement">Needs Improvement</option>
                <option value="at_risk">At Risk</option>
              </select>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Agents ({filteredAgents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agent</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Team</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Audits</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Avg Score</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Trend</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent, index) => (
                  <tr key={agent.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{agent.team}</td>
                    <td className="text-center py-3 px-4">{agent.totalAudits}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-bold ${agent.avgScore >= 90 ? 'text-emerald-500' : agent.avgScore >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                        {agent.avgScore}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">{getTrendIcon(agent.trend)}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(agent.status)}`}>
                        {agent.status === 'needs_improvement' ? 'Needs Impr.' : agent.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Link href={`/dashboard/agents/${agent.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
