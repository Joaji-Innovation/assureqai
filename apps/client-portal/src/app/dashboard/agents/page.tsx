'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, TrendingUp, TrendingDown, AlertTriangle, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLeaderboard } from '@/lib/hooks';
import { useState } from 'react';

export default function AgentsPage() {
  const { data: agents = [], isLoading, error } = useLeaderboard(undefined, 50);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Calculate status based on score
  const getAgentStatus = (avgScore: number) => {
    if (avgScore >= 90) return 'excellent';
    if (avgScore >= 80) return 'good';
    if (avgScore >= 70) return 'needs_improvement';
    return 'at_risk';
  };

  // Transform leaderboard data to agent format
  const transformedAgents = agents.map((agent: any) => ({
    id: agent.agentUserId || agent._id || agent.id,
    name: agent.agentName || agent.name || 'Unknown Agent',
    email: agent.email || '',
    team: agent.team || 'Unassigned',
    totalAudits: agent.totalAudits || agent.auditCount || 0,
    avgScore: agent.avgScore || agent.averageScore || 0,
    trend: agent.trend || 'stable',
    status: getAgentStatus(agent.avgScore || agent.averageScore || 0),
    lastAuditDate: agent.lastAuditDate || '',
  }));

  const teams = [...new Set(transformedAgents.map(a => a.team))].filter(Boolean);

  const filteredAgents = transformedAgents.filter(agent => {
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
  const atRiskCount = transformedAgents.filter(a => a.status === 'at_risk').length;
  const avgTeamScore = transformedAgents.length > 0
    ? Math.round(transformedAgents.reduce((sum, a) => sum + a.avgScore, 0) / transformedAgents.length * 10) / 10
    : 0;
  const topPerformers = transformedAgents.filter(a => a.status === 'excellent').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                <p className="text-2xl font-bold">{transformedAgents.length}</p>
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
              {teams.length > 0 && (
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
              )}
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
          {filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No Agents Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {transformedAgents.length === 0
                  ? 'Agent performance data will appear here once audits are processed.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          ) : (
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
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {agent.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            {agent.email && <p className="text-xs text-muted-foreground">{agent.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{agent.team}</td>
                      <td className="text-center py-3 px-4">{agent.totalAudits}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`font-bold ${agent.avgScore >= 90 ? 'text-emerald-500' : agent.avgScore >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                          {agent.avgScore.toFixed(1)}%
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
