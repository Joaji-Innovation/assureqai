'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAudit } from '@/lib/hooks';
import ExpandableEvidence from '../../ExpandableEvidence';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = params.id as string;
  const [showTranscript, setShowTranscript] = useState(false);

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
            <h3 className="text-lg font-semibold text-muted-foreground">
              Audit Not Found
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              The requested audit could not be loaded. It may have been deleted
              or the ID is invalid.
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 80) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-500';
    if (score >= 80) return 'bg-amber-500/10 text-amber-500';
    return 'bg-red-500/10 text-red-500';
  };

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
              {audit.agentName} •{' '}
              {new Date(audit.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${getScoreBgColor(audit.overallScore)}`}
          >
            Score: {audit.overallScore}%
          </Badge>
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${
              sentiment.overall === 'positive'
                ? 'bg-emerald-500/10 text-emerald-500'
                : sentiment.overall === 'negative'
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            {sentiment.overall?.toUpperCase() || 'NEUTRAL'}
          </Badge>
        </div>
      </div>

      {/* Audit Info Summary */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Agent</p>
              <p className="font-medium">{audit.agentName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Audit Type</p>
              <p className="font-medium capitalize">{audit.auditType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">
                {new Date(audit.createdAt).toLocaleDateString()}
              </p>
            </div>
            {audit.campaignName && (
              <div>
                <p className="text-muted-foreground">Campaign</p>
                <p className="font-medium">{audit.campaignName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Call Summary */}
      {audit.callSummary && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Call Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {audit.callSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Root Cause Analysis */}
      {audit.rootCauseAnalysis && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Root Cause Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {audit.rootCauseAnalysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* English Translation */}
      {audit.englishTranslation &&
        audit.englishTranslation !== audit.transcript && (
          <Collapsible>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      English Translation
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto pr-2 rounded-md bg-muted/30 p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {audit.englishTranslation}
                    </pre>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

      {/* Coaching Recommendations */}
      {audit.coaching &&
        (audit.coaching.strengths?.length > 0 ||
          audit.coaching.improvements?.length > 0 ||
          audit.coaching.suggestedActions?.length > 0) && (
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Coaching Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {audit.coaching.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-500 uppercase tracking-wide mb-2">
                    Strengths
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {audit.coaching.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {audit.coaching.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-500 uppercase tracking-wide mb-2">
                    Areas for Improvement
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {audit.coaching.improvements.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {audit.coaching.suggestedActions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">
                    Suggested Actions
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {audit.coaching.suggestedActions.map(
                      (s: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          {s}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Compliance */}
      {audit.compliance &&
        (audit.compliance.violations?.length > 0 ||
          audit.compliance.keywordsDetected?.length > 0) && (
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Compliance</CardTitle>
                {audit.compliance.complianceScore !== undefined && (
                  <Badge
                    variant="outline"
                    className={`text-sm px-3 py-1 ${getScoreBgColor(audit.compliance.complianceScore)}`}
                  >
                    Score: {audit.compliance.complianceScore}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {audit.compliance.violations?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-2">
                    Violations
                  </p>
                  <div className="space-y-2">
                    {audit.compliance.violations.map((v: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-red-500/20 bg-red-500/5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{v.rule}</span>
                          <Badge variant="outline" className="text-xs">
                            {v.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {v.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {audit.compliance.keywordsDetected?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Keywords Detected
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {audit.compliance.keywordsDetected.map(
                      (kw: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Parameter Scores with Evidence */}
      {auditResults.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Parameter Scores</CardTitle>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {auditResults.length}
                </span>{' '}
                parameters evaluated
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditResults.map((result: any, index: number) => (
                <div
                  key={result.parameterId || index}
                  className="p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  {/* Parameter Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {result.parameterName}
                        </span>
                        {result.type && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              result.type === 'Fatal'
                                ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                : result.type === 'ZTP'
                                  ? 'bg-orange-500/10 text-orange-500 border-orange-500/30'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {result.type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-bold ${getScoreColor(result.score)}`}
                    >
                      {result.score}%
                    </div>
                  </div>

                  {/* Comments */}
                  {result.comments && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground">
                        {result.comments}
                      </p>
                    </div>
                  )}

                  {/* Evidence Citations */}
                  {result.evidence && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                        Evidence from Transcript
                      </p>
                      <ExpandableEvidence evidence={result.evidence} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript Section */}
      {transcript ? (
        <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Full Transcript
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {showTranscript ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto pr-2 rounded-md bg-muted/30 p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {transcript}
                  </pre>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ) : (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              No Transcript Available
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              This audit does not have transcript data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
