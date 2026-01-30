'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, FileText, AlertCircle, Clock, User, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAudit } from '@/lib/hooks';

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = params.id as string;

  const { data: audit, isLoading, error } = useAudit(auditId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !audit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/audit-details">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Audit Details</h2>
            <p className="text-muted-foreground">Audit ID: {auditId}</p>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Audit Not Found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              The requested audit could not be loaded. It may have been deleted or the ID is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract audit results with proper fallbacks
  const auditResults = audit.auditResults || [];
  const sentiment = audit.sentiment || { overall: 'neutral' as const };
  const transcript = audit.transcript || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/audit-details">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Audit Details</h2>
            <p className="text-muted-foreground">
              Audit ID: {auditId} {audit.callId && `• Call: ${audit.callId}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 text-sm rounded-full ${audit.overallScore >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
            audit.overallScore >= 80 ? 'bg-amber-500/10 text-amber-500' :
              'bg-red-500/10 text-red-500'
            }`}>
            Score: {audit.overallScore}%
          </span>
          <span className={`px-3 py-1 text-sm rounded-full ${sentiment.overall === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
            sentiment.overall === 'negative' ? 'bg-red-500/10 text-red-500' :
              'bg-amber-500/10 text-amber-500'
            }`}>
            {sentiment.overall.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Audit Info */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Agent</p>
                  <p className="font-medium">{audit.agentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audit Type</p>
                  <p className="font-medium capitalize">{audit.auditType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(audit.createdAt).toLocaleDateString()}</p>
                </div>
                {audit.campaignName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Campaign</p>
                    <p className="font-medium">{audit.campaignName}</p>
                  </div>
                )}
                {audit.auditDurationMs && (
                  <div>
                    <p className="text-sm text-muted-foreground">Audit Duration</p>
                    <p className="font-medium">{(audit.auditDurationMs / 1000).toFixed(1)}s</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Call Summary */}
          {audit.callSummary && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Call Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{audit.callSummary}</p>
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          {transcript && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto pr-2">
                  <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Transcript */}
          {!transcript && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No Transcript Available</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  This audit does not have transcript data.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Parameter Scores */}
        <div className="space-y-4">
          {/* Overall Score */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold mb-2" style={{
                  color: audit.overallScore >= 90 ? 'rgb(16 185 129)' :
                    audit.overallScore >= 80 ? 'rgb(245 158 11)' : 'rgb(239 68 68)'
                }}>
                  {audit.overallScore}%
                </p>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>
            </CardContent>
          </Card>

          {/* Parameter Scores */}
          {auditResults.length > 0 && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Parameter Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditResults.map((result, index) => (
                    <div key={result.parameterId || index} className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{result.parameterName}</span>
                        <span className={`font-bold ${result.score >= 90 ? 'text-emerald-500' :
                          result.score >= 80 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                          {result.score}%
                        </span>
                      </div>
                      {result.comments && (
                        <p className="text-xs text-muted-foreground mt-1">{result.comments}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token Usage */}
          {audit.tokenUsage && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Token Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Input Tokens</span>
                    <span>{audit.tokenUsage.inputTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Output Tokens</span>
                    <span>{audit.tokenUsage.outputTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className="font-medium">{audit.tokenUsage.totalTokens.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
