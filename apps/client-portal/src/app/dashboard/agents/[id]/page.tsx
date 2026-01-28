'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, TrendingUp, TrendingDown, AlertTriangle, Award, MessageSquare, BarChart2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

// Mock agent data
const mockAgent = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@company.com',
  role: 'Customer Support Agent',
  team: 'Team Alpha',
  startDate: '2025-06-15',
  totalAudits: 156,
  avgScore: 94.2,
  passRate: 96,
  rank: 1,
  status: 'excellent' as const,
};

const scoreTrend = [
  { month: 'Aug', score: 88, teamAvg: 82 },
  { month: 'Sep', score: 90, teamAvg: 83 },
  { month: 'Oct', score: 91, teamAvg: 84 },
  { month: 'Nov', score: 93, teamAvg: 85 },
  { month: 'Dec', score: 95, teamAvg: 84 },
  { month: 'Jan', score: 94, teamAvg: 86 },
];

const parameterBreakdown = [
  { param: 'Greeting', score: 98, fullMark: 100 },
  { param: 'Problem ID', score: 92, fullMark: 100 },
  { param: 'Solution', score: 95, fullMark: 100 },
  { param: 'Tone', score: 96, fullMark: 100 },
  { param: 'Closing', score: 90, fullMark: 100 },
  { param: 'Compliance', score: 100, fullMark: 100 },
];

const recentAudits = [
  { id: '1', date: '2026-01-10', score: 96, sentiment: 'positive', callId: 'CALL-1234' },
  { id: '2', date: '2026-01-09', score: 92, sentiment: 'positive', callId: 'CALL-1233' },
  { id: '3', date: '2026-01-08', score: 88, sentiment: 'neutral', callId: 'CALL-1232' },
  { id: '4', date: '2026-01-07', score: 95, sentiment: 'positive', callId: 'CALL-1231' },
  { id: '5', date: '2026-01-06', score: 94, sentiment: 'positive', callId: 'CALL-1230' },
];

const coachingNotes = [
  { id: '1', date: '2026-01-08', author: 'Manager Smith', note: 'Great improvement on closing statements. Keep it up!' },
  { id: '2', date: '2025-12-20', author: 'QA Lead', note: 'Work on problem identification timing - sometimes too quick to jump to solutions.' },
];

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.id;
  const [activeTab, setActiveTab] = useState<'overview' | 'audits' | 'coaching'>('overview');

  const agent = mockAgent;

  const chartConfig = {
    score: { label: 'Agent Score', color: 'hsl(var(--primary))' },
    teamAvg: { label: 'Team Average', color: 'hsl(var(--muted-foreground))' },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-500 bg-emerald-500/10';
      case 'good': return 'text-blue-500 bg-blue-500/10';
      case 'needs_improvement': return 'text-amber-500 bg-amber-500/10';
      case 'at_risk': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
      </div>

      {/* Agent Info Card */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {agent.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{agent.name}</h2>
                <p className="text-muted-foreground">{agent.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-muted-foreground">{agent.team}</span>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(agent.status)}`}>
                    {agent.status === 'excellent' ? '⭐ Top Performer' : agent.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{agent.avgScore}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{agent.totalAudits}</div>
                <div className="text-xs text-muted-foreground">Total Audits</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-emerald-500">{agent.passRate}%</div>
                <div className="text-xs text-muted-foreground">Pass Rate</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  <Award className="h-5 w-5 text-amber-500" />
                  #{agent.rank}
                </div>
                <div className="text-xs text-muted-foreground">Team Rank</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {['overview', 'audits', 'coaching'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Score Trend */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score Trend vs Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={scoreTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  <Line type="monotone" dataKey="teamAvg" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} />
                  <Legend />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Parameter Breakdown - Radar Chart */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Parameter Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={parameterBreakdown}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="param" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <Card className="md:col-span-2 bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>Strengths & Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-emerald-500 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Compliance - 100% adherence
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Greeting & Opening - Consistently warm
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Tone & Professionalism - Excellent
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-amber-500 mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Closing - Could be more thorough
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Problem Identification timing
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audits Tab */}
      {activeTab === 'audits' && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAudits.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`text-lg font-bold ${audit.score >= 90 ? 'text-emerald-500' : audit.score >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                      {audit.score}%
                    </div>
                    <div>
                      <p className="font-medium">{audit.callId}</p>
                      <p className="text-sm text-muted-foreground">{audit.date}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    audit.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
                    audit.sentiment === 'negative' ? 'bg-red-500/10 text-red-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {audit.sentiment}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coaching Tab */}
      {activeTab === 'coaching' && (
        <div className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Coaching Notes
              </CardTitle>
              <Button size="sm">Add Note</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coachingNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{note.author}</span>
                      <span className="text-xs text-muted-foreground">{note.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
