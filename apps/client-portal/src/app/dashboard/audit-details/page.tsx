'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, User, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAudits } from '@/lib/hooks';
import type { Audit } from '@/lib/api';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AuditDetailsPage() {
  const { data: auditData, isLoading, error } = useAudits({ page: 1, limit: 20 });

  // Use mock data when API is not available
  const audits: Audit[] = auditData?.data?.length ? auditData.data : [
    { _id: '1', agentName: 'John Doe', callId: 'CALL-001', auditType: 'ai', overallScore: 92, createdAt: '2026-01-10T10:30:00Z', sentiment: { overall: 'positive' }, auditResults: [] },
    { _id: '2', agentName: 'Jane Smith', callId: 'CALL-002', auditType: 'ai', overallScore: 87, createdAt: '2026-01-09T14:45:00Z', sentiment: { overall: 'neutral' }, auditResults: [] },
    { _id: '3', agentName: 'Bob Wilson', callId: 'CALL-003', auditType: 'manual', overallScore: 78, createdAt: '2026-01-09T09:15:00Z', disputeStatus: 'pending', sentiment: { overall: 'negative' }, auditResults: [] },
    { _id: '4', agentName: 'Alice Brown', callId: 'CALL-004', auditType: 'ai', overallScore: 95, createdAt: '2026-01-08T16:20:00Z', sentiment: { overall: 'positive' }, auditResults: [] },
    { _id: '5', agentName: 'Charlie Green', callId: 'CALL-005', auditType: 'ai', overallScore: 71, createdAt: '2026-01-08T11:00:00Z', sentiment: { overall: 'neutral' }, auditResults: [] },
  ];

  // Generate trend data from audits
  const trendData = audits
    .slice()
    .reverse()
    .map((audit) => ({
      name: new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: audit.overallScore,
    }));

  const chartConfig = {
    score: { label: 'Score', color: 'hsl(var(--primary))' },
  };

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
          <h2 className="text-2xl font-bold tracking-tight">Audit Details</h2>
          <p className="text-muted-foreground">View all audit records</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Using demo data. Connect API at NEXT_PUBLIC_API_URL
        </div>
      )}

      {/* Score Trend Chart */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Audits Table */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Audits ({audits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {audits.map((audit) => (
              <div key={audit._id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{audit.callId || audit._id.slice(-6).toUpperCase()}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{audit.agentName}</span>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>{new Date(audit.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    audit.auditType === 'ai' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {audit.auditType.toUpperCase()}
                  </span>
                  {audit.sentiment && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      audit.sentiment.overall === 'positive' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : audit.sentiment.overall === 'negative'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {audit.sentiment.overall}
                    </span>
                  )}
                  {audit.overallConfidence && (
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                      audit.overallConfidence >= 85 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : audit.overallConfidence >= 60 
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      🛡️ {audit.overallConfidence}%
                    </span>
                  )}
                  {audit.timing?.processingDurationMs && (
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                      audit.timing.processingDurationMs < 5000 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : audit.timing.processingDurationMs < 15000 
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      ⚡ {audit.timing.processingDurationMs < 1000 
                        ? `${audit.timing.processingDurationMs}ms` 
                        : `${(audit.timing.processingDurationMs / 1000).toFixed(1)}s`}
                    </span>
                  )}
                  <div className={`text-lg font-bold ${
                    audit.overallScore >= 90 ? 'text-emerald-500' : 
                    audit.overallScore >= 80 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {audit.overallScore}%
                  </div>
                  {audit.disputeStatus ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-500 flex items-center gap-1">
                      {audit.disputeStatus}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
