"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Volume2, VolumeX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ExpandableEvidence from "./ExpandableEvidence";
import type { SavedAuditItem } from "@/types/audit";

interface AuditDetailsModalContentProps {
  audit: SavedAuditItem;
  currentUserRole: string | undefined;
  onClose: () => void;
  onDispute: () => void;
  onAcknowledge: () => void;
}

export function AuditDetailsModalContent({
  audit,
  currentUserRole,
  onClose,
  onDispute,
  onAcknowledge,
}: AuditDetailsModalContentProps) {
  const [speakingField, setSpeakingField] = useState<string | null>(null);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const handleToggleTTS = (text: string, field: string) => {
    if (!text || !synth) return;

    if (speakingField === field) {
      // Stop speaking
      synth.cancel();
      setSpeakingField(null);
    } else {
      // Start speaking
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingField(null);
      utterance.onerror = () => setSpeakingField(null);
      synth.speak(utterance);
      setSpeakingField(field);
    }
  };

  // Get original transcription with multiple fallbacks
  const originalTranscription =
    audit.auditData?.transcriptionInOriginalLanguage ||
    audit.auditData?.transcript ||
    (audit as any).transcript ||
    (audit as any).transcriptionInOriginalLanguage ||
    "";

  // Get English translation with multiple fallbacks
  // Get English translation with multiple fallbacks
  const englishTranslation =
    audit.auditData?.englishTranslation ||
    (audit as any).englishTranslation ||
    "";

  const additionalTranslation =
    audit.auditData?.additionalTranslation ||
    (audit as any).additionalTranslation ||
    "";

  const additionalLanguage =
    audit.auditData?.additionalTranslationLanguage ||
    (audit as any).additionalTranslationLanguage ||
    "Target Language";

  return (
    <DialogContent className="max-w-6xl w-[90vw]">
      <DialogHeader>
        <DialogTitle>{`Audit Details - ${audit.agentName} (${format(
          new Date(audit.auditDate),
          "PPp"
        )})`}</DialogTitle>
      </DialogHeader>
      <div className="max-h-[70vh] overflow-y-auto pr-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>
              <strong>Agent:</strong> {audit.agentName}
            </p>
            <p>
              <strong>Agent ID:</strong> {audit.agentUserId}
            </p>
            <p>
              <strong>Campaign:</strong> {audit.campaignName || "N/A"}
            </p>
            <p>
              <strong>Overall Score:</strong>{" "}
              <span
                className={`font-bold ${audit.overallScore >= 90
                  ? "text-green-500"
                  : audit.overallScore >= 80
                    ? "text-yellow-500"
                    : "text-red-500"
                  }`}
              >
                {audit.overallScore.toFixed(2)}%
              </span>
            </p>
            <p>
              <strong>Audit Type:</strong>{" "}
              <Badge
                variant={audit.auditType === "ai" ? "default" : "secondary"}
              >
                {audit.auditType.toUpperCase()}
              </Badge>
            </p>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-md">Detailed Scoring</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Processing Time:{" "}
                <span className="font-medium">
                  {audit.auditData?.auditDurationMs
                    ? `${(audit.auditData.auditDurationMs / 1000).toFixed(1)}s`
                    : "N/A"}
                </span>
              </span>
              {audit.auditData?.overallConfidence && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span>
                    Overall Confidence:{" "}
                    <span
                      className={`font-medium ${audit.auditData.overallConfidence >= 85
                        ? "text-emerald-600"
                        : audit.auditData.overallConfidence >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                        }`}
                    >
                      {Math.round(audit.auditData.overallConfidence)}%
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px]">Parameter</TableHead>
                <TableHead className="text-center w-[80px]">Score</TableHead>
                <TableHead className="text-center w-[100px]">
                  Confidence
                </TableHead>
                <TableHead>Comments & Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(
                (audit as any).auditResults ||
                audit.auditData?.auditResults ||
                []
              ).map((res: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium align-top py-4">
                    {res.parameterName || res.parameter || "Unknown"}
                  </TableCell>
                  <TableCell className="text-center font-medium align-top py-4 text-green-500">
                    {res.score}
                  </TableCell>
                  <TableCell className="text-center align-top py-4">
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-none"
                    >
                      {res.confidence
                        ? `${Math.round(res.confidence * 100)}%`
                        : "100%"}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top py-4 space-y-2">
                    <p className="text-sm">{res.comments}</p>
                    <ExpandableEvidence evidence={res.evidence} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {audit.auditType === "ai" && (
            <>
              <Separator />
              <h4 className="font-semibold text-md">Detailed Analysis</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Call Summary</Label>
                  <Textarea
                    readOnly
                    value={
                      (audit as any).callSummary ||
                      audit.auditData?.callSummary ||
                      "No summary available"
                    }
                    className="h-40 bg-muted/50 resize-none header-none focus-visible:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Root Cause Analysis</Label>
                  <Textarea
                    readOnly
                    value={
                      (audit as any).rootCauseAnalysis ||
                      (audit.auditData as any)?.rootCauseAnalysis ||
                      "No significant issues requiring RCA identified."
                    }
                    className="h-40 bg-muted/50 resize-none header-none focus-visible:ring-0"
                  />
                </div>
                <div className="space-y-4 col-span-2">
                  <h5 className="font-semibold text-sm">Sentiment Analysis</h5>
                  <div className="grid grid-cols-3 gap-4 p-4 border rounded-md bg-muted/20">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">
                        Overall
                      </span>
                      <Badge
                        variant="outline"
                        className={`w-fit capitalized ${(audit.auditData?.sentiment?.overall || "neutral") ===
                          "positive"
                          ? "bg-green-500/10 text-green-600 border-green-200"
                          : (audit.auditData?.sentiment?.overall ||
                            "neutral") === "negative"
                            ? "bg-red-500/10 text-red-600 border-red-200"
                            : "bg-gray-500/10 text-gray-600 border-gray-200"
                          }`}
                      >
                        {audit.auditData?.sentiment?.overall || "Neutral"}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">
                        Customer Sentiment
                      </span>
                      <span
                        className={`font-mono text-lg font-medium ${(audit.auditData?.sentiment?.customerScore || 0) > 0
                          ? "text-green-600"
                          : (audit.auditData?.sentiment?.customerScore || 0) <
                            0
                            ? "text-red-600"
                            : "text-gray-600"
                          }`}
                      >
                        {(
                          (audit.auditData?.sentiment?.customerScore || 0) * 100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">
                        Agent Sentiment
                      </span>
                      <span
                        className={`font-mono text-lg font-medium ${(audit.auditData?.sentiment?.agentScore || 0) > 0
                          ? "text-green-600"
                          : (audit.auditData?.sentiment?.agentScore || 0) < 0
                            ? "text-red-600"
                            : "text-gray-600"
                          }`}
                      >
                        {(
                          (audit.auditData?.sentiment?.agentScore || 0) * 100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    Show/Hide Full Transcription
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                  <div className={`grid gap-6 ${additionalTranslation ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                    <div className="space-y-2">
                      <Label>Original Transcription</Label>
                      <ScrollArea className="h-48 mt-2 p-3 border rounded-md">
                        <pre className="text-xs whitespace-pre-wrap">
                          {originalTranscription || "No transcription available"}
                        </pre>
                      </ScrollArea>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>English Translation</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleTTS(englishTranslation, 'english')}
                          disabled={!englishTranslation}
                          title={speakingField === 'english' ? "Stop" : "Speak Translation"}
                        >
                          {speakingField === 'english' ? (
                            <VolumeX className="mr-2 h-4 w-4" />
                          ) : (
                            <Volume2 className="mr-2 h-4 w-4" />
                          )}
                          {speakingField === 'english' ? "Stop" : "Speak"}
                        </Button>
                      </div>
                      <ScrollArea className="h-48 mt-2 p-3 border rounded-md">
                        <pre className="text-xs whitespace-pre-wrap">
                          {englishTranslation || "No translation available"}
                        </pre>
                      </ScrollArea>
                    </div>
                    {additionalTranslation && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>{additionalLanguage} Translation</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleTTS(additionalTranslation, 'additional')}
                            disabled={!additionalTranslation}
                            title={speakingField === 'additional' ? "Stop" : "Speak properties"}
                          >
                            {speakingField === 'additional' ? (
                              <VolumeX className="mr-2 h-4 w-4" />
                            ) : (
                              <Volume2 className="mr-2 h-4 w-4" />
                            )}
                            {speakingField === 'additional' ? "Stop" : "Speak"}
                          </Button>
                        </div>
                        <ScrollArea className="h-48 mt-2 p-3 border rounded-md">
                          <pre className="text-xs whitespace-pre-wrap">
                            {additionalTranslation}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </div>
      <DialogFooter>
        {currentUserRole === "Agent" ? (
          <div className="w-full flex justify-between">
            <Button variant="destructive" onClick={onDispute}>
              Dispute
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onAcknowledge}>Acknowledge</Button>
            </div>
          </div>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}
