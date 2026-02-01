'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, User, CheckCircle, Loader2, AlertCircle, Search, Calendar as CalendarIcon, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAudits } from '@/lib/hooks';
import type { Audit, User as ApiUser, AuditResult } from '@/lib/api';
import type { SavedAuditItem } from '@/types/audit';
import { authApi } from '@/lib/api';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuditDetailsModalContent } from "../AuditDetailsModalContent";
import { useToast } from "@/hooks/use-toast";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

function convertAuditDocumentToSavedAuditItem(
  doc: Audit
): SavedAuditItem {
  const createdAtVal = doc.createdAt as any;
  let auditDate: string;
  if (createdAtVal) {
    if (typeof createdAtVal === "string") {
      auditDate = createdAtVal;
    } else if (createdAtVal instanceof Date) {
      auditDate = createdAtVal.toISOString();
    } else {
      auditDate = new Date(createdAtVal).toISOString();
    }
  } else {
    auditDate = new Date().toISOString();
  }

  return {
    id: doc.id || doc._id,
    callId: doc.callId,
    auditDate,
    agentName: doc.agentName,
    agentUserId: doc.agentUserId || doc.agentName,
    campaignName: doc.campaignName,
    projectId: doc.projectId,
    overallScore: doc.overallScore,
    auditedBy: doc.auditedBy,
    auditData: {
      agentUserId: doc.agentUserId || doc.agentName,
      campaignName: doc.campaignName,
      identifiedAgentName: doc.agentName,
      transcriptionInOriginalLanguage: doc.transcript || "",
      englishTranslation: doc.englishTranslation || "",
      additionalTranslation: doc.additionalTranslation || "",
      additionalTranslationLanguage: doc.additionalTranslationLanguage || "",
      callSummary: doc.callSummary || `Audit for ${doc.agentName}`,
      auditResults: doc.auditResults.map((result: AuditResult) => ({
        parameter: result.parameterName,
        score: result.score,
        weightedScore: result.maxScore,
        comments: result.comments || "",
        type: result.type,
        confidence: result.confidence,
        evidence: result.evidence || [],
      })),
      overallScore: doc.overallScore,
      overallConfidence: doc.overallConfidence,
      summary: `Overall score: ${doc.overallScore}/${doc.maxPossibleScore}`,
      tokenUsage: doc.tokenUsage,
      auditDurationMs: doc.auditDurationMs,
      startTime: doc.timing?.startTime,
      endTime: doc.timing?.endTime,
      callDuration: doc.metrics?.callDuration,
      audioDuration: doc.metrics?.callDuration,
      audioDataUri: doc.audioUrl,
    },
    auditType: doc.auditType,
  };
}

export default function AuditDetailsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data: auditData, isLoading, error, isPlaceholderData } = useAudits({ page, limit });
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await authApi.me();
        setCurrentUser(user);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    }
    fetchUser();
  }, []);

  // Get audits from API
  const audits: Audit[] = auditData?.data || [];
  const totalPages = auditData?.pagination?.totalPages || 1;

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

  const openAuditDetailsModal = (auditDoc: Audit) => {
    const audit = convertAuditDocumentToSavedAuditItem(auditDoc);

    const handleDispute = () => {
      toast({
        title: "Dispute Logged",
        description: "Your dispute for this audit has been logged for review.",
      });
      setIsModalOpen(false);
    };

    const handleAcknowledge = () => {
      toast({
        title: "Audit Acknowledged",
        description: "Thank you for acknowledging this audit.",
      });
      setIsModalOpen(false);
    };

    setModalContent(
      <AuditDetailsModalContent
        audit={audit}
        currentUserRole={currentUser?.role}
        onClose={() => setIsModalOpen(false)}
        onDispute={handleDispute}
        onAcknowledge={handleAcknowledge}
      />
    );
    setIsModalOpen(true);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Details</h2>
          <p className="text-muted-foreground">Detailed view of all quality assurance audits</p>
        </div>
        {/* Placeholder for filters if needed in future */}
        {/* <div className="flex gap-2">
            <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
            </Button>
        </div> */}
      </div>

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Connection issue detected. Displayed data may be cached.
        </div>
      )}

      {/* Score Trend Chart */}
      {audits.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>Score Trend (Recent)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
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
      )}

      {/* Audits Table */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit History
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No Audits Found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Start by creating your first QA audit to see results here.
              </p>
            </div>
          ) : (
            <div className={`rounded-md border transition-opacity duration-200 ${isPlaceholderData ? "opacity-50" : "opacity-100"}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit._id} className="cursor-pointer hover:bg-muted/50" onClick={() => openAuditDetailsModal(audit)}>
                      <TableCell>
                        <div className={`px-2 py-1 text-xs w-fit rounded-full uppercase font-medium ${audit.auditType === 'ai'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                          }`}>
                          {audit.auditType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{audit.agentName}</div>
                        <div className="text-xs text-muted-foreground">{audit.callId || audit._id.slice(-6).toUpperCase()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                          <span>{new Date(audit.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground pl-4">
                          {new Date(audit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`text-lg font-bold ${audit.overallScore >= 90 ? 'text-emerald-500' :
                          audit.overallScore >= 80 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                          {audit.overallScore}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {audit.sentiment ? (
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${audit.sentiment.overall === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : audit.sentiment.overall === 'negative'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-amber-500/10 text-amber-500'
                            }`}>
                            {audit.sentiment.overall}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openAuditDetailsModal(audit); }}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {modalContent}
      </Dialog>
    </div>
  );
}
