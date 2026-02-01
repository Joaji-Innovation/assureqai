"use client";

import Link from "next/link";
import {
  useState,
  useEffect,
  useMemo,
  type ChangeEvent,
  type FormEvent,
  useRef,
  type ReactNode,
} from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  ReferenceLine,
  LabelList,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { motion, useInView } from "framer-motion";
import { staggerContainer, fadeInUp, fadeIn } from "@/lib/animations";

import {
  CalendarDays,
  Filter,
  FileDown,
  Loader2,
  VenetianMask,
  PlayCircle,
  PauseCircle,
  Target,
  ClipboardList,
  Smile,
  ShieldCheck,
  Brain,
  BarChart2,
  Bot,
  Download,
  TrendingUp,
  UserCheck,
  TrendingDown,
  Briefcase,
  Activity,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Search,
  FileText,
  FileStack,
  PieChart,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  MoreVertical,
  Maximize2,
  Minimize2,
  RefreshCw,
  Volume2,
  VolumeX,
  Heart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Helper for View-Based Chart Animation
const AnimatedChart = ({ children, className }: { children: ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 }); // Trigger when 20% visible

  return (
    <div ref={ref} className={className}>
      {/* Recharts animates on mount. Changing key forces remount when in view. */}
      {isInView ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      ) : (
        <div className="w-full h-full opacity-0" /> // Placeholder
      )}
    </div>
  );
};
// Removed direct AI flow import - using API route instead
import { useSearchParams, useRouter } from "next/navigation";
import type {
  Parameter as ParameterGroup,
} from "@/types/qa-parameter";
import type { SOP } from "@/types/sop";
import type { SavedAuditItem } from "@/types/audit";
import { Separator } from "@/components/ui/separator";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { authApi, qaParameterApi, auditApi, type Audit, type QAParameter, type AuditResult, type User } from "@/lib/api";

// Removed direct server-side imports
// import type { QAParameterDocument } from "@/lib/qaParameterService";
// import type { AuditDocument } from "@/lib/auditService";
// import type { AuditResultDocument } from "@/lib/models";

import { Suspense } from "react";
import { getAuthHeaders } from "@/lib/authUtils";
import { exportAuditDataAsXLSX, exportChartWithData, exportDashboardWithAllCharts, type AuditExportData, type ExportSummaryMetrics } from "@/lib/exportUtils";
import { AuditDetailsModalContent } from "./AuditDetailsModalContent";

// Helper function to convert QAParameter (API) to QAParameter (Frontend)
function convertQAParameterDocumentToQAParameter(
  doc: QAParameter
): ParameterGroup & { _id: string; description: string; isActive: boolean; parameters: any[]; lastModified: string } {
  const updatedAtVal = doc.updatedAt as any;
  let lastModified: string;
  if (updatedAtVal) {
    if (typeof updatedAtVal === "string") {
      lastModified = updatedAtVal;
    } else if (updatedAtVal instanceof Date) {
      lastModified = updatedAtVal.toISOString();
    } else {
      lastModified = new Date(updatedAtVal).toISOString();
    }
  } else {
    lastModified = new Date().toISOString();
  }

  return {
    ...doc,
    id: doc._id,
    lastModified,
    subParameters: doc.parameters || [], // Map API 'parameters' to UI 'subParameters'
  };
}

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
    agentUserId: doc.agentUserId || doc.agentName, // Use actual agentUserId from DB, fallback to agentName
    campaignName: doc.campaignName,
    projectId: doc.projectId, // Project ID for project-based access control
    overallScore: doc.overallScore,
    auditedBy: doc.auditedBy, // User ID of who performed the audit
    auditData: {
      agentUserId: doc.agentUserId || doc.agentName, // Use actual agentUserId from DB
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
        evidence: result.evidence || [], // Preserve array for ExpandableEvidence
      })),
      overallScore: doc.overallScore,
      overallConfidence: doc.overallConfidence,
      summary: `Overall score: ${doc.overallScore}/${doc.maxPossibleScore}`,
      tokenUsage: doc.tokenUsage,
      auditDurationMs: doc.auditDurationMs,
    },
    auditType: doc.auditType,
  };
}

// CSV export helper
function generateCSV(audits: SavedAuditItem[], includeTokens: boolean = false) {
  // Collect all unique parameter names from all audits to create dynamic headers
  const allParameterNames = new Set<string>();
  audits.forEach((audit) => {
    const auditResults = audit.auditData?.auditResults || [];
    auditResults.forEach((result: any) => {
      if (result?.parameter) {
        allParameterNames.add(result.parameter);
      }
    });
  });
  const parameterNamesList = Array.from(allParameterNames);

  const headers = [
    "Employee ID",
    "Process/Campaign",
    "Call Category",
    "Associate Name",
    "Audit ID",
    "Call Duration",
    "Audit Date",
    "QA/Audited By",
    "Pass/Fail",
    "Audit Duration",
    "Start Time",
    "End Time",
    "Overall Score",
    "Fatal Status",
    "Fatal Count",
    "Fatal Count",
    ...parameterNamesList,
  ];

  if (includeTokens) {
    headers.push("Input Tokens", "Output Tokens", "Total Tokens");
  }

  const rows = [headers.join(",")];

  audits.forEach((audit) => {
    // Determine call category based on score
    let callCategory = "Bad";
    if (audit.overallScore >= 90) {
      callCategory = "Good";
    } else if (audit.overallScore >= 80) {
      callCategory = "Average";
    }

    // Determine pass/fail
    const passFail = audit.overallScore >= 90 ? "Pass" : "Fail";

    // Determine fatal status and count
    const auditResults = audit.auditData?.auditResults || [];
    const fatalCount = auditResults.filter(
      (result: any) => result?.type === "Fatal" && result?.score < 80
    ).length;
    let fatalStatus = "Non - Fatal";
    if (fatalCount > 0) {
      fatalStatus = "Fatal";
    } else if (audit.overallScore === 0) {
      fatalStatus = "ZTP"; // Zero Tolerance Policy
    }

    // Format audit date as DD-MM-YYYY
    const auditDate = new Date(audit.auditDate);
    const formattedDate = `${auditDate
      .getDate()
      .toString()
      .padStart(2, "0")}-${(auditDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${auditDate.getFullYear()}`;

    // Calculate audit duration using auditDurationMs
    let auditDuration = "";
    let startTime = "";
    let endTime = "";

    if (audit.auditData?.auditDurationMs) {
      const durationMs = audit.auditData.auditDurationMs;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      const milliseconds = durationMs % 1000;
      auditDuration = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
          .toString()
          .padStart(3, "0")}`;

      // Calculate start and end time based on audit date and duration
      const endDate = auditDate;
      const startDate = new Date(auditDate.getTime() - durationMs);

      // Format as DD-MM-YYYY HH:MM:SS
      const formatDateTime = (date: Date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        const hh = date.getHours().toString().padStart(2, "0");
        const mm = date.getMinutes().toString().padStart(2, "0");
        const ss = date.getSeconds().toString().padStart(2, "0");
        return `${d}-${m}-${y} ${hh}:${mm}:${ss}`;
      };

      startTime = formatDateTime(startDate);
      endTime = formatDateTime(endDate);
    } else if (audit.auditData?.startTime && audit.auditData?.endTime) {
      // Fallback to explicit start/end times if available
      const start = new Date(audit.auditData.startTime);
      const end = new Date(audit.auditData.endTime);
      const durationMs = end.getTime() - start.getTime();

      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      const milliseconds = durationMs % 1000;
      auditDuration = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
          .toString()
          .padStart(3, "0")}`;

      // Format as DD-MM-YYYY HH:MM:SS
      const formatDateTime = (date: Date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        const hh = date.getHours().toString().padStart(2, "0");
        const mm = date.getMinutes().toString().padStart(2, "0");
        const ss = date.getSeconds().toString().padStart(2, "0");
        return `${d}-${m}-${y} ${hh}:${mm}:${ss}`;
      };

      startTime = formatDateTime(start);
      endTime = formatDateTime(end);
    }

    // Estimate call duration (if not available, leave empty or use a default)
    let callDuration = "";
    if (audit.auditData?.callDuration) {
      // If call duration is stored in audit data
      callDuration = audit.auditData.callDuration;
    } else if (audit.auditData?.audioDuration) {
      // If audio duration is available
      const duration = parseFloat(audit.auditData.audioDuration);
      if (!isNaN(duration)) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        callDuration = `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
    } else if (audit.auditData?.audioDataUri) {
      // Try to estimate from data URI size (rough approximation)
      // WAV files are ~44 bytes per second at 16kHz mono
      try {
        const dataUriMatch = audit.auditData.audioDataUri.match(
          /^data:audio\/[^;]+;base64,(.+)$/
        );
        if (dataUriMatch) {
          const base64Data = dataUriMatch[1];
          const bytes = (base64Data.length * 3) / 4; // Base64 to bytes
          const estimatedSeconds = Math.floor(bytes / 44000); // Rough WAV estimation
          if (estimatedSeconds > 0) {
            const minutes = Math.floor(estimatedSeconds / 60);
            const seconds = estimatedSeconds % 60;
            callDuration = `${minutes.toString().padStart(2, "0")}:${seconds
              .toString()
              .padStart(2, "0")}`;
          }
        }
      } catch (e) {
        // Ignore estimation errors
      }
    }

    // Build parameter scores map by parameter name for this audit
    const parameterScoresMap: Record<string, string> = {};
    auditResults.forEach((result: any) => {
      if (result?.parameter) {
        parameterScoresMap[result.parameter] =
          result?.score?.toString() || result?.percentage?.toString() || "";
      }
    });

    // Get parameter scores in the same order as headers
    const parameterScores = parameterNamesList.map(
      (paramName) => parameterScoresMap[paramName] || ""
    );

    const row = [
      audit.agentUserId ||
      audit.auditData?.agentUserId ||
      audit.agentName ||
      "",
      audit.campaignName || "",
      callCategory,
      audit.agentName || "",
      audit.id,
      callDuration,
      formattedDate,
      audit.auditType === "ai" ? "AI" : "Manual",
      passFail,
      auditDuration,
      startTime,
      endTime,
      audit.overallScore.toString(),
      fatalStatus,
      fatalCount.toString(),
      ...parameterScores,
      ...parameterScores,
    ];

    if (includeTokens) {
      row.push(
        audit.auditData?.tokenUsage?.inputTokens?.toString() || "0",
        audit.auditData?.tokenUsage?.outputTokens?.toString() || "0",
        audit.auditData?.tokenUsage?.totalTokens?.toString() || "0"
      );
    }

    rows.push(row.map((field) => `"${field}"`).join(","));
  });

  return rows.join("\n");
}

async function handleDownload(
  audits: SavedAuditItem[],
  activeTab: string,
  dateRange: DateRange | undefined,
  selectedCampaignIdForFilter: string,
  availableQaParameterSets: QAParameter[],
  currentUser: User | null,
  includeTokens: boolean = false,
  chartRefs: { name: string; element: HTMLElement | null }[] = []
) {
  try {
    // Compute filtered audits based on current UI filters
    const auditType =
      activeTab === "overview"
        ? "all"
        : activeTab === "qa-dashboard"
          ? "ai"
          : "manual";
    const filtered = applyAuditFilters(
      audits,
      auditType as any,
      dateRange,
      selectedCampaignIdForFilter,
      availableQaParameterSets,
      currentUser
    );

    // Transform audits to export format
    const exportData: AuditExportData[] = filtered.map((audit) => {
      // Determine call category based on score
      let callCategory = "Bad";
      if (audit.overallScore >= 90) {
        callCategory = "Good";
      } else if (audit.overallScore >= 80) {
        callCategory = "Average";
      }

      // Determine pass/fail
      const passFail = audit.overallScore >= 90 ? "Pass" : "Fail";

      // Determine fatal status and count
      const auditResults = audit.auditData?.auditResults || [];
      const fatalCount = auditResults.filter(
        (result: any) => result?.type === "Fatal" && result?.score < 80
      ).length;
      let fatalStatus = "Non-Fatal";
      if (fatalCount > 0) {
        fatalStatus = "Fatal";
      } else if (audit.overallScore === 0) {
        fatalStatus = "ZTP";
      }

      // Format audit date as DD-MM-YYYY
      const auditDate = new Date(audit.auditDate);
      const formattedDate = `${auditDate
        .getDate()
        .toString()
        .padStart(2, "0")}-${(auditDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${auditDate.getFullYear()}`;

      // Calculate audit duration
      let auditDuration = "";
      let startTime = "";
      let endTime = "";

      if (audit.auditData?.auditDurationMs) {
        const durationMs = audit.auditData.auditDurationMs;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
        auditDuration = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        const endDateVal = auditDate;
        const startDateVal = new Date(auditDate.getTime() - durationMs);

        const formatDateTime = (date: Date) => {
          const d = date.getDate().toString().padStart(2, "0");
          const m = (date.getMonth() + 1).toString().padStart(2, "0");
          const y = date.getFullYear();
          const hh = date.getHours().toString().padStart(2, "0");
          const mm = date.getMinutes().toString().padStart(2, "0");
          const ss = date.getSeconds().toString().padStart(2, "0");
          return `${d}-${m}-${y} ${hh}:${mm}:${ss}`;
        };

        startTime = formatDateTime(startDateVal);
        endTime = formatDateTime(endDateVal);
      }

      // Call duration
      let callDuration = "";
      if (audit.auditData?.callDuration) {
        callDuration = audit.auditData.callDuration;
      } else if (audit.auditData?.audioDuration) {
        const duration = parseFloat(audit.auditData.audioDuration);
        if (!isNaN(duration)) {
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);
          callDuration = `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
        }
      }

      // Build parameter scores map
      const parameterScores: Record<string, number | string> = {};
      auditResults.forEach((result: any) => {
        if (result?.parameter) {
          parameterScores[result.parameter] =
            result?.score ?? result?.percentage ?? "";
        }
      });

      return {
        employeeId: audit.agentUserId || audit.auditData?.agentUserId || audit.agentName || "",
        campaign: audit.campaignName || "",
        callCategory,
        agentName: audit.agentName || "",
        auditId: audit.id,
        callDuration,
        auditDate: formattedDate,
        auditedBy: audit.auditType === "ai" ? "AI" : "Manual",
        passFail,
        auditDuration,
        startTime,
        endTime,
        overallScore: audit.overallScore,
        fatalStatus,
        fatalCount,
        parameterScores,
        tokenUsage: audit.auditData?.tokenUsage,
      };
    });

    // Calculate summary metrics
    const passCount = filtered.filter((a) => a.overallScore >= 90).length;
    const fatalTotal = filtered.reduce((acc, audit) => {
      const results = audit.auditData?.auditResults || [];
      return acc + results.filter((r: any) => r?.type === "Fatal" && r?.score < 80).length;
    }, 0);
    const ztpCount = filtered.filter((a) => a.overallScore === 0).length;
    const avgScore = filtered.length > 0
      ? filtered.reduce((sum, a) => sum + a.overallScore, 0) / filtered.length
      : 0;

    const reportPeriod = dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
      : "All Time";

    const summaryMetrics: ExportSummaryMetrics = {
      reportPeriod,
      totalAudits: filtered.length,
      passRate: filtered.length > 0 ? (passCount / filtered.length) * 100 : 0,
      averageScore: avgScore,
      fatalCount: fatalTotal,
      ztpCount,
      aiAudits: filtered.filter((a) => a.auditType === "ai").length,
      manualAudits: filtered.filter((a) => a.auditType === "manual").length,
    };

    // Export to XLSX
    const result = await exportAuditDataAsXLSX(exportData, summaryMetrics, chartRefs, {
      includeTokens,
      filename: `QA_Audit_Report`,
    });

    if (!result.success) {
      throw new Error(result.error || "Export failed");
    }
  } catch (err) {
    console.error("Failed to download audits:", err);
    alert("Failed to download audits. Please try again.");
  }
}

function applyAuditFilters(
  audits: SavedAuditItem[],
  auditType: "all" | "ai" | "manual",
  dateRange: DateRange | undefined,
  selectedCampaignIdForFilter: string,
  availableQaParameterSets: QAParameter[],
  currentUser: User | null,
  includeTokens: boolean = false
) {
  let filtered = audits;

  // Role-based access control:
  // - Administrator: Can see ALL audits across the system
  // - Project Admin, Manager: Can see all audits within their project only
  // - Agent: Can see audits where they are the subject (agentUserId)
  // - QA Analyst, Auditor: Can only see audits they performed
  if (currentUser) {
    if (currentUser.role === "Administrator") {
      // Administrator can see all audits - no filtering
    } else if (currentUser.role === "Project Admin" || currentUser.role === "Manager") {
      // Project Admin and Manager can see all audits within their project
      filtered = filtered.filter((a) => a.projectId === currentUser.projectId);
    } else if (currentUser.role === "Agent") {
      // Agent can see audits where they are the agent being audited
      filtered = filtered.filter((a) => a.agentUserId === currentUser.id);
    } else {
      // All other roles (QA Analyst, Auditor) can only see audits they performed
      filtered = filtered.filter((a) => a.auditedBy === currentUser.id);
    }
  }

  if (auditType !== "all") {
    filtered = filtered.filter((a) => a.auditType === auditType);
  }

  if (dateRange?.from) {
    filtered = filtered.filter((audit) => {
      const auditDate = new Date(audit.auditDate);
      let inRange = auditDate >= dateRange.from!;
      if (dateRange.to) {
        inRange = inRange && auditDate <= dateRange.to!;
      }
      return inRange;
    });
  }

  if (selectedCampaignIdForFilter && selectedCampaignIdForFilter !== "all") {
    const selectedCampaign = availableQaParameterSets.find(
      (c) => c.id === selectedCampaignIdForFilter
    );
    if (selectedCampaign) {
      filtered = filtered.filter(
        (audit) => audit.campaignName === selectedCampaign.name
      );
    }
  }

  return filtered;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<ReactNode>(null);

  const [savedAudits, setSavedAudits] = useState<SavedAuditItem[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Delete audit state
  const [auditToDelete, setAuditToDelete] = useState<SavedAuditItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const activeTab = searchParams.get("tab") || "overview";

  const [availableQaParameterSets, setAvailableQaParameterSets] = useState<
    QAParameter[]
  >([]);
  const [availableCampaignsForFilter, setAvailableCampaignsForFilter] =
    useState([{ id: "all", name: "All Campaigns" }]);
  const [selectedCampaignIdForFilter, setSelectedCampaignIdForFilter] =
    useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PASS" | "FAIL">("ALL");

  // Independent loading states for component-wise rendering
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingQaParams, setIsLoadingQaParams] = useState(true);
  const [isLoadingAudits, setIsLoadingAudits] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Effect for setting isClient
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for setting default date range
  useEffect(() => {
    if (!isClient) return;
    if (!dateRange?.from) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      // Set end date to end of last day of month (23:59:59.999) to include all audits on that day
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      setDateRange({ from: firstDayOfMonth, to: lastDayOfMonth });
    }
  }, [isClient, dateRange?.from]);

  // Load user data independently
  useEffect(() => {
    if (!isClient) return;
    const loadUser = async () => {
      try {
        const user = await authApi.me();
        if (user) {
          setCurrentUser(user);
        }
      } catch (e) {
        console.error("Failed to load user details", e);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, [isClient]);

  // Load QA parameters independently
  useEffect(() => {
    if (!isClient) return;
    const loadQaParams = async () => {
      try {
        const params = await qaParameterApi.list();
        if (params && Array.isArray(params)) {
          const activeCampaigns = params.filter((p: QAParameter) => p.isActive);
          setAvailableQaParameterSets(
            activeCampaigns.map(convertQAParameterDocumentToQAParameter)
          );
          const campaignOptions = activeCampaigns.map((p: QAParameter) => ({
            id: p._id,
            name: p.name,
          }));
          setAvailableCampaignsForFilter([
            { id: "all", name: "All Campaigns" },
            ...campaignOptions,
          ]);
        }
      } catch (e) {
        console.error("Failed to load QA Parameter Sets from database", e);
      } finally {
        setIsLoadingQaParams(false);
      }
    };
    loadQaParams();
  }, [isClient]);

  // Load audits independently - re-fetch when dateRange changes
  useEffect(() => {
    if (!isClient) return;
    // Don't fetch until dateRange is set
    if (!dateRange?.from) return;

    const loadAudits = async () => {
      setIsLoadingAudits(true);
      try {
        const filters: any = { limit: 10000 };
        if (dateRange.from) filters.startDate = dateRange.from.toISOString();
        if (dateRange.to) filters.endDate = dateRange.to.toISOString();

        console.log('[Dashboard] Loading audits with filters:', filters);
        const response = await auditApi.list(filters);
        console.log('[Dashboard] API response:', {
          dataLength: response?.data?.length,
          firstAudit: response?.data?.[0] ? {
            id: response.data[0]._id,
            agentName: response.data[0].agentName,
            campaignName: response.data[0].campaignName,
            overallScore: response.data[0].overallScore,
            auditResultsLength: response.data[0].auditResults?.length,
            auditResultsSample: response.data[0].auditResults?.[0],
          } : 'No audits'
        });

        if (response?.data) {
          const savedAuditsData: SavedAuditItem[] = response.data.map(
            convertAuditDocumentToSavedAuditItem
          );
          console.log('[Dashboard] Converted audits:', {
            count: savedAuditsData.length,
            firstConverted: savedAuditsData[0] ? {
              id: savedAuditsData[0].id,
              agentName: savedAuditsData[0].agentName,
              campaignName: savedAuditsData[0].campaignName,
              overallScore: savedAuditsData[0].overallScore,
              auditResultsCount: savedAuditsData[0].auditData?.auditResults?.length,
              auditResultsSample: savedAuditsData[0].auditData?.auditResults?.[0],
            } : 'No audits'
          });
          setSavedAudits(savedAuditsData);
        }
      } catch (e) {
        console.error("Failed to load saved audits from API", e);
      } finally {
        setIsLoadingAudits(false);
      }
    };
    loadAudits();
  }, [isClient, dateRange]);

  // Load dashboard stats
  useEffect(() => {
    if (!isClient) return;
    if (!dateRange?.from) return;

    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const filters: any = {};
        if (dateRange.from) filters.startDate = dateRange.from.toISOString();
        if (dateRange.to) filters.endDate = dateRange.to.toISOString();

        if (selectedCampaignIdForFilter && selectedCampaignIdForFilter !== "all") {
          const campaign = availableQaParameterSets.find(c => c.id === selectedCampaignIdForFilter);
          if (campaign) {
            filters.campaignName = campaign.name;
          }
        }

        // Determine audit type based on active tab
        let auditType: string | null = null;
        if (activeTab === "qa-dashboard") {
          auditType = "ai";
        } else if (activeTab === "manual-dashboard") {
          auditType = "manual";
        }

        if (auditType) {
          filters.auditType = auditType;
        }

        console.log('[Dashboard] Stats API filters:', filters);
        const stats = await auditApi.getStats(filters);
        console.log('[Dashboard] Stats API response:', {
          total: (stats as any)?.total,
          avgScore: (stats as any)?.avgScore,
          dailyTrendLength: (stats as any)?.dailyTrend?.length,
          topFailingParamsLength: (stats as any)?.topFailingParams?.length,
          campaignPerformanceLength: (stats as any)?.campaignPerformance?.length,
        });

        if (stats) {
          // Direct assignment now that backend returns correct structure (AuditStats)
          setDashboardStats(stats);
        }
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [isClient, dateRange, selectedCampaignIdForFilter, activeTab, availableQaParameterSets]);

  const handleDeleteAudit = async (audit: SavedAuditItem) => {
    setIsDeleting(true);
    try {
      await auditApi.delete(audit.id);

      setSavedAudits((prev) => prev.filter((a) => a.id !== audit.id));
      toast({
        title: "Audit Deleted",
        description: "The audit has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete audit:", error);
      toast({
        title: "Error",
        description: "Failed to delete audit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setAuditToDelete(null);
    }
  };

  const openAuditDetailsModal = (audit: SavedAuditItem) => {
    setModalTitle(
      `Audit Details - ${audit.agentName} (${format(
        new Date(audit.auditDate),
        "PPp"
      )})`
    );

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

  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-background">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Hi, {currentUser?.fullName || "User"}! Welcome Back 👋
          </h2>
          <p className="text-muted-foreground">
            Here’s a snapshot of your QA performance and activities.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {currentUser?.role === "Administrator" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    handleDownload(
                      savedAudits,
                      activeTab,
                      dateRange,
                      selectedCampaignIdForFilter,
                      availableQaParameterSets,
                      currentUser,
                      false
                    )
                  }
                >
                  Download Standard Report
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleDownload(
                      savedAudits,
                      activeTab,
                      dateRange,
                      selectedCampaignIdForFilter,
                      availableQaParameterSets,
                      currentUser,
                      true
                    )
                  }
                >
                  Download Admin Report (With Tokens)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() =>
                handleDownload(
                  savedAudits,
                  activeTab,
                  dateRange,
                  selectedCampaignIdForFilter,
                  availableQaParameterSets,
                  currentUser,
                  false
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </div>

      {currentUser?.role === "Agent" ? (
        <DashboardTabContent
          key="agent-overview"
          auditType="all"
          savedAudits={savedAudits}
          dateRange={dateRange}
          selectedCampaignIdForFilter={selectedCampaignIdForFilter}
          availableQaParameterSets={availableQaParameterSets}
          currentUser={currentUser}
          openAuditDetailsModal={openAuditDetailsModal}
          setAuditToDelete={setAuditToDelete}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoadingAudits={isLoadingAudits}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          dashboardStats={dashboardStats}
          isLoadingStats={isLoadingStats}
        />
      ) : currentUser?.role === "Auditor" ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => router.push(`/dashboard?tab=${value}`)}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart2 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="manual-dashboard">
              <ClipboardList className="mr-2 h-4 w-4" />
              Manual Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DashboardTabContent
              key="auditor-overview"
              auditType="all"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isLoadingAudits={isLoadingAudits}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              dashboardStats={dashboardStats}
              isLoadingStats={isLoadingStats}
            />
          </TabsContent>
          <TabsContent value="manual-dashboard" className="space-y-4">
            <DashboardTabContent
              key="auditor-manual"
              auditType="manual"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isLoadingAudits={isLoadingAudits}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              dashboardStats={dashboardStats}
              isLoadingStats={isLoadingStats}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => router.push(`/dashboard?tab=${value}`)}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart2 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="qa-dashboard">
              <Brain className="mr-2 h-4 w-4" />
              QAi Dashboard
            </TabsTrigger>
            <TabsTrigger value="manual-dashboard">
              <ClipboardList className="mr-2 h-4 w-4" />
              Manual Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DashboardTabContent
              key="overview"
              auditType="all"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isLoadingAudits={isLoadingAudits}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              dashboardStats={dashboardStats}
              isLoadingStats={isLoadingStats}
            />
          </TabsContent>
          <TabsContent value="qa-dashboard" className="space-y-4">
            <DashboardTabContent
              key="ai"
              auditType="ai"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isLoadingAudits={isLoadingAudits}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              dashboardStats={dashboardStats}
              isLoadingStats={isLoadingStats}
            />
          </TabsContent>
          <TabsContent value="manual-dashboard" className="space-y-4">
            <DashboardTabContent
              key="manual"
              auditType="manual"
              savedAudits={savedAudits}
              dateRange={dateRange}
              selectedCampaignIdForFilter={selectedCampaignIdForFilter}
              availableQaParameterSets={availableQaParameterSets}
              currentUser={currentUser}
              openAuditDetailsModal={openAuditDetailsModal}
              setAuditToDelete={setAuditToDelete}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isLoadingAudits={isLoadingAudits}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              dashboardStats={dashboardStats}
              isLoadingStats={isLoadingStats}
            />
          </TabsContent>
        </Tabs>
      )}

      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {modalContent ? (
            // modalContent already contains DialogContent wrapper
            modalContent
          ) : (
            // Fallback empty content to satisfy Dialog structure
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Details</DialogTitle>
              </DialogHeader>
              <div className="p-4">No content</div>
              <DialogFooter>
                <Button onClick={() => setIsModalOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      )}

      <AlertDialog
        open={!!auditToDelete}
        onOpenChange={(open) => !open && setAuditToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audit for{" "}
              {auditToDelete?.agentName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => auditToDelete && handleDeleteAudit(auditToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sub-component for dashboard content
interface DashboardTabContentProps {
  auditType: "all" | "ai" | "manual";
  savedAudits: SavedAuditItem[];
  dateRange: DateRange | undefined;
  selectedCampaignIdForFilter: string;
  availableQaParameterSets: QAParameter[];
  currentUser: User | null;
  openAuditDetailsModal: (audit: SavedAuditItem) => void;
  setAuditToDelete: (audit: SavedAuditItem | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoadingAudits: boolean;
  filterStatus: "ALL" | "PASS" | "FAIL";
  setFilterStatus: (status: "ALL" | "PASS" | "FAIL") => void;
  // New props for stats from the stats API
  dashboardStats?: {
    overallQAScore: number;
    totalAudits: number;
    aiAudits: number;
    manualAudits: number;
    passRate: number;
    fatalRate: number;
    totalFatalErrors: number;
    fatalAuditsCount: number;
    ztpCount: number;
    ztpRate: number;
    trainingNeeds: { agentName: string; lowestParam: string } | null;
    trainingNeedsList: any[];
    dailyAuditsTrend: { date: string; audits: number }[];
    dailyFatalTrend: { date: string; fatalErrors: number }[];
    topIssues: any[];
    paretoData?: any[];
    agentPerformance: { topAgents: any[]; underperformingAgents: any[] };
    campaignPerformance: any[];
    sentiment?: { positive: number; neutral: number; negative: number };
    compliance?: { interactionsWithIssues: number; totalAuditedInteractionsForCompliance: number; complianceRate: number };
  } | null;
  isLoadingStats?: boolean;
}

// Helper component for collapsible evidence
interface ExpandableEvidenceProps {
  evidence: any;
}

const ExpandableEvidence: React.FC<ExpandableEvidenceProps> = ({ evidence }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!evidence) return null;

  // Handle single string case
  if (!Array.isArray(evidence)) {
    return (
      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
        "{evidence}"
      </p>
    );
  }

  // Handle array case
  const citations = evidence;
  if (citations.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic pl-2 opacity-50">
        No specific evidence cited by AI.
      </p>
    );
  }

  // Configuration
  const INITIAL_COUNT = 2; // Show 2 lines initially
  const showExpandButton = citations.length > INITIAL_COUNT;
  const visibleCitations = isExpanded ? citations : citations.slice(0, INITIAL_COUNT);
  const remainingCount = citations.length - INITIAL_COUNT;

  return (
    <div className="space-y-1 mt-1">
      {visibleCitations.map((ev: any, idx: number) => (
        <p key={idx} className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
          "{ev.text || ev}"
          {ev.lineNumber ? <span className="ml-1 text-[10px] not-italic opacity-70">(Line {ev.lineNumber})</span> : null}
        </p>
      ))}

      {showExpandButton && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-[10px] text-primary hover:underline font-medium ml-2 flex items-center gap-1 focus:outline-none"
        >
          {isExpanded ? "Show less" : `+${remainingCount} more citations`}
        </button>
      )}
    </div>
  );
};

const DashboardTabContent: React.FC<DashboardTabContentProps> = ({
  auditType,
  savedAudits,
  dateRange,
  selectedCampaignIdForFilter,
  availableQaParameterSets,
  currentUser,
  openAuditDetailsModal,
  setAuditToDelete,
  searchTerm,
  setSearchTerm,
  isLoadingAudits,
  filterStatus,
  setFilterStatus,
  dashboardStats,
  isLoadingStats,
}) => {
  type AgentPerformanceData = {
    topAgents: {
      id: string;
      name: string;
      score: number;
      audits: number;
      pass: number;
      fail: number;
    }[];
    underperformingAgents: {
      id: string;
      name: string;
      score: number;
      audits: number;
      pass: number;
      fail: number;
    }[];
  };
  type CampaignPerformanceData = {
    name: string;
    score: number;
    compliance: number;
    audits: number;
  }[];

  const [overallQAScore, setOverallQAScore] = useState(0);
  const [topIssuesData, setTopIssuesData] = useState<any[]>([
    {
      id: "issue_default_1",
      reason: "Awaiting audit data...",
      count: 0,
      critical: false,
      subParameters: [],
      suggestion: "",
    },
  ]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [paretoData, setParetoData] = useState([
    {
      parameter: "No data",
      count: 0,
      frequencyPercentage: 0,
      cumulative: 0,
      percentage: 0,
    },
  ]);
  const [agentPerformanceData, setAgentPerformanceData] =
    useState<AgentPerformanceData>({
      topAgents: [],
      underperformingAgents: [],
    });
  const [campaignPerformanceData, setCampaignPerformanceData] =
    useState<CampaignPerformanceData>([]);
  const [complianceData, setComplianceData] = useState({
    interactionsWithIssues: 0,
    totalAuditedInteractionsForCompliance: 0,
    complianceRate: 0,
  });
  const [trainingNeedsData, setTrainingNeedsData] = useState<{
    agentName: string;
    lowestParam: string;
  } | null>(null);
  const [trainingNeedsList, setTrainingNeedsList] = useState<
    {
      agentName: string;
      agentId: string;
      score: number;
      lowestParam: string;
      lowestParamScore: number;
    }[]
  >([]);
  const [isTrainingNeedsModalOpen, setIsTrainingNeedsModalOpen] =
    useState(false);
  const [selectedTrainingAgent, setSelectedTrainingAgent] = useState<{
    agentName: string;
    agentId: string;
    score: number;
    lowestParam: string;
    lowestParamScore: number;
  } | null>(null);
  const [sentimentData, setSentimentData] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [fatalErrorsData, setFatalErrorsData] = useState({
    totalFatalErrors: 0,
    fatalRate: 0,
    fatalAuditsCount: 0,
  });
  const [ztpData, setZtpData] = useState({
    ztpAuditsCount: 0,
    ztpRate: 0,
  });
  const [isFatalExplanationOpen, setIsFatalExplanationOpen] = useState(false);

  // Time series data for line charts
  const [dailyAuditsData, setDailyAuditsData] = useState<
    { date: string; audits: number }[]
  >([]);
  const [dailyFatalErrorsData, setDailyFatalErrorsData] = useState<
    { date: string; fatalErrors: number }[]
  >([]);

  // Populate state from dashboardStats API response when available
  useEffect(() => {
    if (dashboardStats) {
      // Overview data
      setOverallQAScore(dashboardStats.overallQAScore || 0); // Note: avgScore maps to overallQAScore

      // Fatal errors
      setFatalErrorsData({
        totalFatalErrors: dashboardStats.totalFatalErrors || 0,
        fatalRate: dashboardStats.fatalRate || 0,
        fatalAuditsCount: dashboardStats.fatalAuditsCount || 0,
      });

      // ZTP data
      setZtpData({
        ztpAuditsCount: dashboardStats.ztpCount || 0,
        ztpRate: dashboardStats.ztpRate || 0,
      });

      // Sentiment - use 'sentiment' property (percentages) or fall back to breakdown if needed
      if (dashboardStats.sentiment) {
        setSentimentData({
          positive: dashboardStats.sentiment.positive || 0,
          neutral: dashboardStats.sentiment.neutral || 0,
          negative: dashboardStats.sentiment.negative || 0,
        });
      }

      // Daily trends
      if (dashboardStats.dailyAuditsTrend) {
        setDailyAuditsData(dashboardStats.dailyAuditsTrend);
      }
      if (dashboardStats.dailyFatalTrend) {
        setDailyFatalErrorsData(dashboardStats.dailyFatalTrend);
      }

      // Top issues
      if (dashboardStats.topIssues && dashboardStats.topIssues.length > 0) {
        setTopIssuesData(dashboardStats.topIssues);
      }

      // Pareto data
      if (dashboardStats.paretoData && dashboardStats.paretoData.length > 0) {
        setParetoData(dashboardStats.paretoData);
      }

      // Agent performance
      if (dashboardStats.agentPerformance) {
        setAgentPerformanceData({
          topAgents: dashboardStats.agentPerformance.topAgents || [],
          underperformingAgents: dashboardStats.agentPerformance.underperformingAgents || [],
        });
      }

      // Campaign performance
      if (dashboardStats.campaignPerformance) {
        setCampaignPerformanceData(dashboardStats.campaignPerformance);
      }

      // Compliance
      if (dashboardStats.compliance) {
        setComplianceData({
          interactionsWithIssues: dashboardStats.compliance.interactionsWithIssues || 0,
          totalAuditedInteractionsForCompliance: dashboardStats.compliance.totalAuditedInteractionsForCompliance || 0,
          complianceRate: dashboardStats.compliance.complianceRate || 0,
        });
      }

      // Training needs
      if (dashboardStats.trainingNeeds) {
        setTrainingNeedsData(dashboardStats.trainingNeeds);
      }
      if (dashboardStats.trainingNeedsList) {
        setTrainingNeedsList(dashboardStats.trainingNeedsList);
      }
    }
  }, [dashboardStats]);

  // Refs for chart screenshots
  const dailyAuditsChartRef = useRef<HTMLDivElement>(null);
  const dailyFatalChartRef = useRef<HTMLDivElement>(null);
  const topIssuesChartRef = useRef<HTMLDivElement>(null);
  const paretoChartRef = useRef<HTMLDivElement>(null);
  const campaignPerformanceRef = useRef<HTMLDivElement>(null);
  const needsImprovementRef = useRef<HTMLDivElement>(null);
  const bestPerformersRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter Audits
  const filteredAudits = useMemo(() => {
    let filtered = savedAudits;

    // Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (audit) =>
          audit.campaignName?.toLowerCase().includes(lowerTerm) ||
          audit.agentName?.toLowerCase().includes(lowerTerm) ||
          audit.auditType?.toLowerCase().includes(lowerTerm)
      );
    }

    // Filter by Role (Agent view vs Admin view)
    if (currentUser?.role === "Agent") {
      filtered = filtered.filter((a) => a.agentUserId === currentUser.id);
    }

    // Filter by Date Range
    if (dateRange?.from) {
      filtered = filtered.filter((audit) => {
        const auditDate = new Date(audit.auditDate);
        if (!dateRange.to) {
          return (
            auditDate >= dateRange.from! &&
            auditDate.toDateString() === dateRange.from!.toDateString()
          );
        }
        return (
          auditDate >= dateRange.from! &&
          auditDate <= new Date(dateRange.to.getTime() + 86400000) // End of day
        );
      });
    }

    // Filter by Audit Type tab
    if (auditType !== "all") {
      filtered = filtered.filter((audit) => audit.auditType === auditType);
    }

    // Filter by Campaign
    if (selectedCampaignIdForFilter && selectedCampaignIdForFilter !== "all") {
      // Find campaign name from ID
      const campaign = availableQaParameterSets.find(c => c.id === selectedCampaignIdForFilter);
      if (campaign) {
        filtered = filtered.filter((audit) => audit.campaignName === campaign.name);
      }
    }

    // NEW: Filter by Status (Pass/Fail)
    // Assuming filterStatus is a state variable like 'ALL', 'PASS', 'FAIL'
    // if (filterStatus !== "ALL") {
    //    filtered = filtered.filter(audit => {
    //       const isPass = audit.overallScore >= 80; // Assuming 80 is pass score
    //       return filterStatus === "PASS" ? isPass : !isPass;
    //    });
    // }
    // NEW: Filter by Status (Pass/Fail)
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(audit => {
        const isPass = audit.overallScore >= 80;
        return filterStatus === "PASS" ? isPass : !isPass;
      });
    }

    return filtered;
  }, [
    savedAudits,
    searchTerm,
    currentUser,
    dateRange,
    auditType,
    selectedCampaignIdForFilter,
    filterStatus,
    availableQaParameterSets
  ]);

  useEffect(() => {
    if (filteredAudits.length > 0) {
      const totalScore = filteredAudits.reduce(
        (sum, audit) => {
          // Normalize score: if maxPossibleScore exists and is > 100, normalize to 0-100 scale
          const maxPossible = audit.auditData?.maxPossibleScore || 100;
          const normalizedScore = maxPossible > 100
            ? (audit.overallScore / maxPossible) * 100
            : audit.overallScore;
          return sum + normalizedScore;
        },
        0
      );
      setOverallQAScore(
        parseFloat((totalScore / filteredAudits.length).toFixed(1))
      );

      // Agent & Campaign Performance
      const agentScores: Record<
        string,
        {
          totalScore: number;
          auditCount: number;
          name: string;
          passCount: number;
        }
      > = {};
      const campaignScores: Record<
        string,
        { totalScore: number; auditCount: number; complianceIssues: number }
      > = {};

      filteredAudits.forEach((audit) => {
        const campaignName = audit.campaignName || "Uncategorized";
        // Agent Data Aggregation
        if (!agentScores[audit.agentUserId]) {
          agentScores[audit.agentUserId] = {
            totalScore: 0,
            auditCount: 0,
            name: audit.agentName,
            passCount: 0,
          };
        }
        agentScores[audit.agentUserId].totalScore += audit.overallScore;
        agentScores[audit.agentUserId].auditCount++;
        if (audit.overallScore >= 80)
          agentScores[audit.agentUserId].passCount++;

        // Campaign Data Aggregation
        if (!campaignScores[campaignName]) {
          campaignScores[campaignName] = {
            totalScore: 0,
            auditCount: 0,
            complianceIssues: 0,
          };
        }
        campaignScores[campaignName].totalScore += audit.overallScore;
        campaignScores[campaignName].auditCount++;
        if (
          audit.auditData.auditResults.some(
            (r: any) => r.type === "Fatal" && r.score < 80
          )
        ) {
          campaignScores[campaignName].complianceIssues++;
        }
      });
      const avgAgentScores = Object.entries(agentScores)
        .map(([id, data]) => ({
          id,
          name: data.name,
          score: parseFloat((data.totalScore / data.auditCount).toFixed(1)),
          audits: data.auditCount,
          pass: data.passCount,
          fail: data.auditCount - data.passCount,
        }))
        .sort((a, b) => b.score - a.score);

      if (avgAgentScores.length > 0) {
        setAgentPerformanceData({
          topAgents: avgAgentScores.slice(0, 5),
          underperformingAgents: avgAgentScores
            .filter((a) => a.score < 80)
            .slice(-5)
            .reverse(),
        });
      }

      const finalCampaignData = Object.entries(campaignScores)
        .map(([name, data]) => ({
          name,
          audits: data.auditCount,
          score: parseFloat((data.totalScore / data.auditCount).toFixed(1)),
          compliance: parseFloat(
            (
              ((data.auditCount - data.complianceIssues) / data.auditCount) *
              100
            ).toFixed(1)
          ),
        }))
        .sort((a, b) => b.audits - a.audits);
      setCampaignPerformanceData(finalCampaignData);

      // Top Issues
      const issuesMap = new Map<
        string,
        { count: number; criticalCount: number; subParams: Map<string, number> }
      >();
      const agentParamScores = new Map<
        string,
        { totalScore: number; count: number; agentName: string }
      >();

      // Build a lookup map: L2 sub-parameter name -> L1 group name
      const subParamToL1Map = new Map<string, string>();
      const allL1Names = new Set<string>();
      for (const paramSet of availableQaParameterSets) {
        for (const group of paramSet.parameters) {
          allL1Names.add(group.name);
          allL1Names.add(group.name.toLowerCase());
          for (const sub of group.subParameters) {
            subParamToL1Map.set(sub.name, group.name);
            subParamToL1Map.set(sub.name.toLowerCase(), group.name);
            subParamToL1Map.set(sub.name.trim(), group.name);
          }
        }
      }

      filteredAudits.forEach((audit) => {
        audit.auditData.auditResults.forEach((res: any) => {
          // Top Issues Calculation
          if (res.score < 80) {
            let mainParamName = "Uncategorized"; // Default to Uncategorized
            let subParamName = "";
            let found = false;

            const rawParam = res.parameter || res.parameterName || "";

            // Step 1: Check if rawParam is EXACTLY an L1 group name
            for (const paramSet of availableQaParameterSets) {
              for (const group of paramSet.parameters) {
                if (group.name === rawParam || group.name.toLowerCase() === rawParam.toLowerCase()) {
                  mainParamName = group.name;
                  found = true;
                  break;
                }
              }
              if (found) break;
            }

            // Step 2: Check if rawParam is EXACTLY an L2 sub-parameter name
            if (!found) {
              const l1FromMap = subParamToL1Map.get(rawParam) || subParamToL1Map.get(rawParam.toLowerCase()) || subParamToL1Map.get(rawParam.trim());
              if (l1FromMap) {
                mainParamName = l1FromMap;
                subParamName = rawParam;
                found = true;
              }
            }

            // Step 3: Check if rawParam CONTAINS any L2 sub-parameter name (substring match)
            if (!found) {
              for (const [subName, l1Name] of subParamToL1Map.entries()) {
                if (rawParam.includes(subName) || rawParam.toLowerCase().includes(subName.toLowerCase())) {
                  mainParamName = l1Name;
                  subParamName = subName;
                  found = true;
                  break;
                }
              }
            }

            // Step 4: Try splitting by " - " and validate left part against known L1 names
            if (!found && rawParam.includes(" - ")) {
              const parts = rawParam.split(" - ");
              if (parts.length >= 2) {
                const leftPart = parts[0].trim();
                subParamName = parts.slice(1).join(" - ").trim();

                // Check if leftPart is a known L1 name
                for (const paramSet of availableQaParameterSets) {
                  for (const group of paramSet.parameters) {
                    if (
                      group.name === leftPart ||
                      group.name.toLowerCase() === leftPart.toLowerCase() ||
                      group.name.toLowerCase().startsWith(leftPart.toLowerCase()) ||
                      group.name.toLowerCase().replace(/[-\s]/g, '').startsWith(leftPart.toLowerCase().replace(/[-\s]/g, ''))
                    ) {
                      mainParamName = group.name;
                      found = true;
                      break;
                    }
                  }
                  if (found) break;
                }

                // If left part isn't an L1, check if the right part (subParamName) maps to an L1
                if (!found) {
                  const l1FromRightPart = subParamToL1Map.get(subParamName) || subParamToL1Map.get(subParamName.toLowerCase());
                  if (l1FromRightPart) {
                    mainParamName = l1FromRightPart;
                    found = true;
                  }
                }
              }
            }

            // Step 5: Final fallback - if still not found, use "Uncategorized"
            // mainParamName is already set to "Uncategorized" as default

            const existing = issuesMap.get(mainParamName) || {
              count: 0,
              criticalCount: 0,
              subParams: new Map(),
            };
            existing.count++;
            if (res.score < 50) existing.criticalCount++;

            if (subParamName) {
              existing.subParams.set(
                subParamName,
                (existing.subParams.get(subParamName) || 0) + 1
              );
            }

            if (res.subParameters && Array.isArray(res.subParameters)) {
              res.subParameters.forEach((sub: any) => {
                if (sub.score < 80) {
                  existing.subParams.set(
                    sub.name,
                    (existing.subParams.get(sub.name) || 0) + 1
                  );
                }
              });
            }

            issuesMap.set(mainParamName, existing);
          }

          // Training Needs Calculation
          const agentParamKey = `${audit.agentUserId}__${res.parameter}`;
          const existingAgentParam = agentParamScores.get(agentParamKey) || {
            totalScore: 0,
            count: 0,
            agentName: audit.agentName,
          };
          existingAgentParam.totalScore += res.score;
          existingAgentParam.count++;
          agentParamScores.set(agentParamKey, existingAgentParam);
        });
      });
      const sortedIssues = Array.from(issuesMap.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .filter(([parameter]) => {
          // Exclude "FATAL/CRITICAL" group with zero weightage from Top QA Issues
          const normalizedParam = parameter.toUpperCase().replace(/\s/g, "");
          if (normalizedParam === "FATAL/CRITICAL") {
            return false;
          }
          return true;
        })
        .slice(0, 5)
        .map(([reason, data]) => {
          const subParamsList = Array.from(data.subParams.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

          return {
            id: reason,
            reason,
            count: data.count,
            critical: data.criticalCount > 0,
            subParameters: subParamsList,
            suggestion:
              subParamsList.length > 0
                ? `Focus on improving: ${subParamsList
                  .slice(0, 3)
                  .map((s) => s.name)
                  .join(
                    ", "
                  )}. Review relevant SOPs and provide targeted coaching.`
                : "Review general guidelines for this parameter.",
          };
        });
      if (sortedIssues.length > 0) setTopIssuesData(sortedIssues);
      else
        setTopIssuesData([
          {
            id: "no_issues",
            reason: "No significant QA failures identified.",
            count: 0,
            critical: false,
            subParameters: [],
            suggestion: "",
          },
        ]);

      // Pareto Chart Data
      const totalFailures = Array.from(issuesMap.values()).reduce(
        (sum, data) => sum + data.count,
        0
      );
      if (totalFailures > 0) {
        const paretoIssues = Array.from(issuesMap.entries())
          .sort(([, a], [, b]) => b.count - a.count)
          .filter(([parameter]) => {
            // Exclude "Fatal / Critical" or "FATAL/CRITICAL" group with zero weightage
            const normalizedParam = parameter.toUpperCase().replace(/\s/g, "");
            if (normalizedParam === "FATAL/CRITICAL") {
              return false;
            }
            return true;
          })
          .slice(0, 10); // Top 10 parameters

        let cumulative = 0;
        const paretoChartData = paretoIssues.map(([parameter, data]) => {
          cumulative += data.count;
          return {
            parameter: parameter, // Use full parameter name without truncation
            count: data.count,
            frequencyPercentage: (data.count / totalFailures) * 100,
            cumulative,
            percentage: (cumulative / totalFailures) * 100,
          };
        });
        setParetoData(paretoChartData);
      } else {
        setParetoData([
          {
            parameter: "No failures",
            count: 0,
            frequencyPercentage: 0,
            cumulative: 0,
            percentage: 0,
          },
        ]);
      }

      // Finalize Training Needs
      let lowestAvg = 101;
      let tniResult: { agentName: string; lowestParam: string } | null = null;
      agentParamScores.forEach((data, key) => {
        const avg = data.totalScore / data.count;
        if (avg < lowestAvg) {
          lowestAvg = avg;
          const [agentId, paramName] = key.split("__");
          tniResult = { agentName: data.agentName, lowestParam: paramName };
        }
      });
      setTrainingNeedsData(tniResult);

      // Calculate Training Needs List for Modal (Bottom 5 Agents)
      if (avgAgentScores.length > 0) {
        const bottomAgents = avgAgentScores
          .filter((a) => a.score < 80)
          .slice(-5)
          .reverse();

        const needsList = bottomAgents.map((agent) => {
          let worstParam = "";
          let worstParamScore = 101;

          // Find worst parameter for this agent
          agentParamScores.forEach((data, key) => {
            if (key.startsWith(`${agent.id}__`)) {
              const avg = data.totalScore / data.count;
              if (avg < worstParamScore) {
                worstParamScore = avg;
                worstParam = key.split("__")[1];
              }
            }
          });

          return {
            agentName: agent.name,
            agentId: agent.id,
            score: agent.score,
            lowestParam: worstParam || "N/A",
            lowestParamScore:
              worstParamScore === 101
                ? 0
                : parseFloat(worstParamScore.toFixed(1)),
          };
        });
        setTrainingNeedsList(needsList);
      } else {
        setTrainingNeedsList([]);
      }

      // Compliance
      const fatalAudits = filteredAudits.filter((a) =>
        a.auditData.auditResults.some(
          (r: any) => r.type === "Fatal" && r.score < 80
        )
      ).length;
      const nonCompliantAudits = filteredAudits.filter(
        (a) => a.overallScore < 70
      ).length;
      const issuesCount = Math.max(fatalAudits, nonCompliantAudits);

      setComplianceData({
        interactionsWithIssues: issuesCount,
        totalAuditedInteractionsForCompliance: filteredAudits.length,
        complianceRate:
          parseFloat(
            (
              ((filteredAudits.length - issuesCount) / filteredAudits.length) *
              100
            ).toFixed(1)
          ) || 0,
      });

      // Sentiment
      setSentimentData({
        positive:
          filteredAudits.length > 0
            ? parseFloat(
              (
                (filteredAudits.filter((a) => a.overallScore >= 85).length /
                  filteredAudits.length) *
                100
              ).toFixed(1)
            )
            : 0,
        neutral:
          filteredAudits.length > 0
            ? parseFloat(
              (
                (filteredAudits.filter(
                  (a) => a.overallScore >= 70 && a.overallScore < 85
                ).length /
                  filteredAudits.length) *
                100
              ).toFixed(1)
            )
            : 0,
        negative:
          filteredAudits.length > 0
            ? parseFloat(
              (
                (filteredAudits.filter((a) => a.overallScore < 70).length /
                  filteredAudits.length) *
                100
              ).toFixed(1)
            )
            : 0,
      });

      // Calculate total fatal errors and fatal rate
      let totalFatalErrors = 0;
      filteredAudits.forEach((audit) => {
        const fatalCount = audit.auditData.auditResults.filter(
          (r: any) => r.type === "Fatal" && r.score < 80
        ).length;
        totalFatalErrors += fatalCount;
      });

      const auditsWithFatalErrors = filteredAudits.filter((audit) =>
        audit.auditData.auditResults.some((r: any) => r.type === "Fatal" && r.score < 80)
      ).length;

      setFatalErrorsData({
        totalFatalErrors,
        fatalAuditsCount: auditsWithFatalErrors,
        fatalRate:
          filteredAudits.length > 0
            ? parseFloat(
              ((auditsWithFatalErrors / filteredAudits.length) * 100).toFixed(
                1
              )
            )
            : 0,
      });

      // Calculate ZTP audits (overall score = 0)
      const ztpAuditsCount = filteredAudits.filter((audit) => audit.overallScore === 0).length;
      const ztpRate = filteredAudits.length > 0
        ? parseFloat(((ztpAuditsCount / filteredAudits.length) * 100).toFixed(1))
        : 0;

      setZtpData({
        ztpAuditsCount,
        ztpRate,
      });

      // Calculate daily audits and fatal errors
      const dailyAuditsMap = new Map<string, number>();
      const dailyFatalErrorsMap = new Map<string, number>();

      filteredAudits.forEach((audit) => {
        const date = format(new Date(audit.auditDate), "yyyy-MM-dd");

        // Count audits per day
        dailyAuditsMap.set(date, (dailyAuditsMap.get(date) || 0) + 1);

        // Count fatal errors per day
        const fatalCount = audit.auditData.auditResults.filter(
          (r: any) => r.type === "Fatal" && r.score < 80
        ).length;
        dailyFatalErrorsMap.set(
          date,
          (dailyFatalErrorsMap.get(date) || 0) + fatalCount
        );
      });

      // Generate all dates in the selected date range
      const allDatesInRange: string[] = [];
      if (dateRange?.from && dateRange?.to) {
        const startDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          allDatesInRange.push(format(currentDate, "yyyy-MM-dd"));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (dateRange?.from) {
        // Single date selected
        allDatesInRange.push(format(dateRange.from, "yyyy-MM-dd"));
      }

      // If we have a date range, fill in all dates; otherwise use only dates with data
      let sortedDailyAudits: { date: string; audits: number }[];
      let sortedDailyFatalErrors: { date: string; fatalErrors: number }[];

      if (allDatesInRange.length > 0) {
        // Fill all dates in range with 0 for missing days
        sortedDailyAudits = allDatesInRange.map((date) => ({
          date: format(new Date(date), "MMM dd"),
          audits: dailyAuditsMap.get(date) || 0,
        }));

        sortedDailyFatalErrors = allDatesInRange.map((date) => ({
          date: format(new Date(date), "MMM dd"),
          fatalErrors: dailyFatalErrorsMap.get(date) || 0,
        }));
      } else {
        // Fallback: Convert maps to sorted arrays (only dates with data)
        sortedDailyAudits = Array.from(dailyAuditsMap.entries())
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([date, audits]) => ({
            date: format(new Date(date), "MMM dd"),
            audits,
          }));

        sortedDailyFatalErrors = Array.from(dailyFatalErrorsMap.entries())
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([date, fatalErrors]) => ({
            date: format(new Date(date), "MMM dd"),
            fatalErrors,
          }));
      }

      setDailyAuditsData(sortedDailyAudits);
      setDailyFatalErrorsData(sortedDailyFatalErrors);
    } else {
      setOverallQAScore(0);
      setTopIssuesData([
        {
          id: "issue_default_1",
          reason: "Awaiting audit data...",
          count: 0,
          critical: false,
        },
      ]);
      setAgentPerformanceData({ topAgents: [], underperformingAgents: [] });
      setCampaignPerformanceData([]);
      setComplianceData({
        interactionsWithIssues: 0,
        totalAuditedInteractionsForCompliance: 0,
        complianceRate: 0,
      });
      setSentimentData({ positive: 0, neutral: 0, negative: 0 });
      setTrainingNeedsData(null);
      setDailyAuditsData([]);
      setDailyFatalErrorsData([]);
      setFatalErrorsData({
        totalFatalErrors: 0,
        fatalRate: 0,
        fatalAuditsCount: 0,
      });
    }
  }, [filteredAudits, availableQaParameterSets, dateRange]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [auditType, dateRange, selectedCampaignIdForFilter, currentUser, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAudits.length / ITEMS_PER_PAGE);
  const paginatedAudits = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAudits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAudits, currentPage]);

  // Compute agent-specific chart data for Training Needs modal
  const agentSpecificChartData = useMemo(() => {
    if (!selectedTrainingAgent) return { topIssues: [], paretoData: [] };

    // Filter audits for the selected agent
    const agentAudits = filteredAudits.filter(
      (audit) => audit.agentUserId === selectedTrainingAgent.agentId ||
        audit.agentName === selectedTrainingAgent.agentName
    );

    // Compute Top Issues for this agent
    const issuesMap = new Map<
      string,
      { count: number; criticalCount: number; type: string; subParams: Map<string, number> }
    >();

    agentAudits.forEach((audit) => {
      audit.auditData.auditResults.forEach((res: any) => {
        if (res.score < 80) {
          let mainParamName = res.parameter;
          let subParamName = "";
          let paramType = res.type || "Non-Fatal"; // Get the type from the result
          let found = false;

          // Try to parse Main Parameter from "Main - Sub" format
          if (audit.campaignName) {
            const campaignParams = availableQaParameterSets.find(
              (p) => p.name === audit.campaignName
            );
            if (campaignParams) {
              for (const group of campaignParams.parameters) {
                const sortedSubParams = [...group.subParameters].sort(
                  (a, b) => b.name.length - a.name.length
                );
                for (const sub of sortedSubParams) {
                  const combined = `${group.name} - ${sub.name}`;
                  if (res.parameter === combined || res.parameter.includes(combined)) {
                    mainParamName = group.name;
                    subParamName = sub.name;
                    // Get type from the sub-parameter definition if available
                    paramType = sub.type || res.type || "Non-Fatal";
                    found = true;
                    break;
                  }

                  // NEW: Check if parameter matches sub-parameter exactly
                  if (res.parameter === sub.name || res.parameter.trim() === sub.name.trim()) {
                    mainParamName = group.name;
                    subParamName = sub.name;
                    // Get type from the sub-parameter definition if available
                    paramType = sub.type || res.type || "Non-Fatal";
                    found = true;
                    break;
                  }
                }
                if (found) break;
              }
            }
          }

          // Fallback if not found
          if (!found && res.parameter.includes(" - ")) {
            const parts = res.parameter.split(" - ");
            if (parts.length >= 2) {
              const rawMainParam = parts[0];
              subParamName = parts.slice(1).join(" - ");
              let matchedGroupName = rawMainParam;
              for (const paramSet of availableQaParameterSets) {
                for (const group of paramSet.parameters) {
                  if (group.name === rawMainParam ||
                    group.name.toLowerCase().startsWith(rawMainParam.toLowerCase())) {
                    matchedGroupName = group.name;
                    break;
                  }
                }
              }
              mainParamName = matchedGroupName;
            }
          }

          const existing = issuesMap.get(mainParamName) || {
            count: 0,
            criticalCount: 0,
            type: paramType,
            subParams: new Map(),
          };
          existing.count++;
          // Update type to Fatal if any failure in this param is Fatal
          if (paramType === "Fatal" || paramType === "ZTP") {
            existing.type = paramType;
          }
          if (res.score < 50) existing.criticalCount++;
          if (subParamName) {
            existing.subParams.set(
              subParamName,
              (existing.subParams.get(subParamName) || 0) + 1
            );
          }
          issuesMap.set(mainParamName, existing);
        }
      });
    });

    // Build Top Issues data (now including Fatal/Critical parameters)
    const topIssues = Array.from(issuesMap.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([reason, data]) => {
        const subParamsList = Array.from(data.subParams.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count }));
        return {
          id: reason,
          reason,
          count: data.count,
          critical: data.criticalCount > 0,
          type: data.type, // Include the type (Fatal/Non-Fatal/ZTP)
          subParameters: subParamsList,
        };
      });

    // Build Pareto data (now including Fatal/Critical parameters)
    const totalFailures = Array.from(issuesMap.values()).reduce(
      (sum, data) => sum + data.count,
      0
    );

    let paretoData: { parameter: string; count: number; frequencyPercentage: number; cumulative: number; percentage: number; type: string }[] = [];
    if (totalFailures > 0) {
      const paretoIssues = Array.from(issuesMap.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10);

      let cumulative = 0;
      paretoData = paretoIssues.map(([parameter, data]) => {
        cumulative += data.count;
        return {
          parameter,
          count: data.count,
          frequencyPercentage: (data.count / totalFailures) * 100,
          cumulative,
          percentage: (cumulative / totalFailures) * 100,
          type: data.type, // Include the type (Fatal/Non-Fatal/ZTP)
        };
      });
    }

    return { topIssues, paretoData };
  }, [selectedTrainingAgent, filteredAudits, availableQaParameterSets]);

  const chartConfigTopIssues = {
    count: { label: "Count", color: "hsl(var(--chart-5))" },
  } as const;

  const chartConfigPareto = {
    count: { label: "Failures", color: "hsl(var(--chart-5))" },
    percentage: { label: "Cumulative %", color: "hsl(var(--chart-2))" },
  } as const;

  const chartConfigDailyAudits = {
    audits: { label: "Audits", color: "hsl(var(--chart-1))" },
  } as const;

  const chartConfigDailyFatalErrors = {
    fatalErrors: { label: "Fatal Errors", color: "hsl(var(--destructive))" },
  } as const;

  const chartConfigSentiment = {
    positive: { label: "Positive", color: "hsl(var(--confirm))" },
    neutral: { label: "Neutral", color: "hsl(var(--warning))" },
    negative: { label: "Negative", color: "hsl(var(--destructive))" },
  } as const;

  const isAgentView = currentUser?.role === "Agent";

  // Helper for formatting chart labels to show only L1 parameter
  const formatChartLabel = (value: any) => {
    if (!value) return "";
    return String(value).split(" - ")[0];
  };

  // Skeleton loader for overview cards
  const OverviewCardSkeleton = () => (
    <OverviewCard title="" icon={Target}>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </OverviewCard>
  );

  return (
    <>
      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* 1. Overview Section */}
        {!isAgentView && (
          <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoadingAudits ? (
              <>
                <OverviewCardSkeleton />
                <OverviewCardSkeleton />
                <OverviewCardSkeleton />
                <OverviewCardSkeleton />
              </>
            ) : (
              <>
                <GlassCard title="Overall QA Score" icon={Target} className="border-t-4 border-t-primary">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 mt-2 font-display">{overallQAScore}%</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {Math.abs(overallQAScore - 85) < 2
                      ? "On par with target"
                      : overallQAScore > 85
                        ? `+${(overallQAScore - 85).toFixed(1)}% vs target`
                        : `${(overallQAScore - 85).toFixed(1)}% vs target`}
                  </p>
                </GlassCard>

                <GlassCard
                  title="Total Audits"
                  icon={ClipboardList}
                  className="border-t-4 border-t-chart-1 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => document.getElementById('my-audits-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <div className="text-3xl font-bold mt-2 font-display">{filteredAudits.length}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Across{" "}
                    {
                      Object.keys(
                        filteredAudits.reduce(
                          (acc, curr) => ({ ...acc, [curr.agentUserId]: true }),
                          {}
                        )
                      ).length
                    }{" "}
                    agents
                  </p>
                </GlassCard>

                <GlassCard
                  title="Fatal Rate"
                  icon={Activity}
                  className="border-t-4 border-t-orange-500 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsFatalExplanationOpen(true)}
                >
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold font-display">{fatalErrorsData.fatalRate}%</span>
                    <span className="text-lg font-semibold text-muted-foreground">({fatalErrorsData.fatalAuditsCount})</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {fatalErrorsData.fatalAuditsCount} audits with fatal errors
                  </p>
                </GlassCard>



                <GlassCard
                  title="Training Needs"
                  icon={UserCheck}
                  className="border-t-4 border-t-blue-500 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsTrainingNeedsModalOpen(true)}
                >
                  <div className="text-xl font-bold truncate mt-2 font-display">
                    {trainingNeedsData?.agentName || "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1 font-medium">
                    Focus: {trainingNeedsData?.lowestParam || "None Identified"}
                  </p>
                </GlassCard>
              </>
            )}
          </motion.div>
        )}

        {isAgentView && (
          <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <OverviewCard title="My QA Score" icon={Target}>
              <div className="text-2xl font-bold font-display">{overallQAScore}%</div>
              <p className="text-xs text-muted-foreground">Your average score</p>
            </OverviewCard>
            <OverviewCard title="My Audits" icon={ClipboardList}>
              <div className="text-2xl font-bold font-display">{filteredAudits.length}</div>
              <p className="text-xs text-muted-foreground">
                Total audits completed for you
              </p>
            </OverviewCard>
            <OverviewCard title="My Compliance" icon={ShieldCheck}>
              <div className="text-2xl font-bold font-display">
                {complianceData.complianceRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Your compliance rate
              </p>
            </OverviewCard>
            <OverviewCard title="My Pass/Fail" icon={Activity}>
              <div className="text-2xl font-bold font-display">
                {agentPerformanceData.topAgents[0]?.pass || 0} /{" "}
                {agentPerformanceData.topAgents[0]?.fail || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pass vs Fail count</p>
            </OverviewCard>
          </motion.div>
        )}

        {!isAgentView && (
          <>
            {/* 2. Trends Section */}
            <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2">
              <Card ref={dailyAuditsChartRef} className="shadow-md border-primary/10 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Activity className="h-4 w-4" />
                      </span>
                      Daily Audits Trend
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => exportChartWithData(
                        dailyAuditsChartRef.current,
                        dailyAuditsData,
                        "daily_audits_trend"
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">Export</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Volume over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-0 pt-4">
                  <AnimatedChart className="h-[250px] w-full">
                    <ChartContainer
                      config={chartConfigDailyAudits}
                      className="h-full w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={dailyAuditsData}
                          margin={{ left: 12, top: 10, right: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                            content={<ChartTooltipContent className="bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl" />}
                          />
                          <Line
                            type="linear"
                            dataKey="audits"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationBegin={300}
                            animationEasing="ease-out"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </AnimatedChart>
                </CardContent>
              </Card>

              <Card ref={dailyFatalChartRef} className="shadow-md border-primary/10 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span className="p-2 bg-destructive/10 text-destructive rounded-lg">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      Daily Fatal Errors
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => exportChartWithData(
                        dailyFatalChartRef.current,
                        dailyFatalErrorsData,
                        "daily_fatal_errors"
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">Export</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Critical issues over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-0 pt-4">
                  <AnimatedChart className="h-[250px] w-full">
                    <ChartContainer
                      config={chartConfigDailyFatalErrors}
                      className="h-full w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={dailyFatalErrorsData}
                          margin={{ left: 12, top: 10, right: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            cursor={{ stroke: "hsl(var(--destructive))", strokeWidth: 1, strokeDasharray: "4 4" }}
                            content={<ChartTooltipContent className="bg-background/95 backdrop-blur-sm border-destructive/20 shadow-xl" />}
                          />
                          <Line
                            type="linear"
                            dataKey="fatalErrors"
                            stroke="hsl(var(--destructive))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--destructive))" }}
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationBegin={300}
                            animationEasing="ease-out"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </AnimatedChart>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3. Insights Grid */}
            <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2">
              {/* Row 1: Top Issues & Pareto */}
              <Card ref={topIssuesChartRef} className="shadow-lg border-primary/10 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span className="p-2 bg-primary/10 text-primary rounded-lg">
                        <BarChart2 className="h-4 w-4" />
                      </span>
                      Top QA Issues
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => exportChartWithData(
                        topIssuesChartRef.current,
                        topIssuesData.map(i => ({ reason: i.reason, count: i.count, critical: i.critical })),
                        "top_qa_issues"
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">Export</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Common parameters where agents need improvement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                  <AnimatedChart className="h-[300px] w-full">
                    <ChartContainer
                      config={chartConfigTopIssues}
                      className="h-full w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={topIssuesData}
                          margin={{ left: 20, top: 20, right: 40, bottom: 40 }}
                        >
                          <CartesianGrid horizontal={false} stroke="hsl(var(--muted))" strokeDasharray="4 4" />
                          <XAxis
                            type="number"
                            dataKey="count"
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(value: number) =>
                              Number.isInteger(value) ? value.toString() : value.toFixed(1)
                            }
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            dataKey="reason"
                            type="category"
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            width={140}
                            interval={0}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatChartLabel}
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                            content={<ChartTooltipContent className="bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl" />}
                          />
                          <Bar
                            dataKey="count"
                            radius={[0, 4, 4, 0]}
                            fill="hsl(var(--primary))"
                            onClick={(data) => setSelectedIssue(data)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            barSize={24}
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationBegin={200}
                            animationEasing="ease-out"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </AnimatedChart>
                </CardContent>
              </Card>

              <Card ref={paretoChartRef} className="shadow-md border-primary/10 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span className="p-2 bg-chart-2/10 text-chart-2 rounded-lg"><BarChart2 className="h-4 w-4" /></span>
                      Pareto Analysis
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => exportChartWithData(
                        paretoChartRef.current,
                        paretoData.map(p => ({ parameter: p.parameter, count: p.count, percentage: p.percentage.toFixed(1) })),
                        "pareto_analysis"
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">Export</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Parameter-wise failure distribution (80/20 rule).
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-0 pt-4">
                  <AnimatedChart className="h-[300px] w-full">
                    <ChartContainer
                      config={chartConfigPareto}
                      className="h-full w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={paretoData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                          <XAxis
                            dataKey="parameter"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={11}
                            fill="hsl(var(--muted-foreground))"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatChartLabel}
                          />
                          <YAxis
                            yAxisId="left"
                            label={{
                              value: "Frequency %",
                              angle: -90,
                              position: "insideLeft",
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12
                            }}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{
                              value: "Cumulative %",
                              angle: 90,
                              position: "insideRight",
                              fill: "hsl(var(--muted-foreground))",
                              fontSize: 12
                            }}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          />
                          <Tooltip
                            content={<ChartTooltipContent className="bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl" />}
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="frequencyPercentage"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationBegin={200}
                            animationEasing="ease-out"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="percentage"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff", fill: "#f59e0b" }}
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationBegin={800}
                            animationEasing="ease-out"
                          />
                          <ReferenceLine
                            yAxisId="right"
                            y={80}
                            label={{ value: "80% Cutoff", fill: "hsl(var(--chart-1))", fontSize: 10 }}
                            stroke="hsl(var(--chart-1))"
                            strokeDasharray="3 3"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </AnimatedChart>
                </CardContent>
              </Card>

              {/* Row 2: Best Performers & Needs Improvement */}
              <Card ref={bestPerformersRef} className="shadow-md border-primary/10 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                      Best Performers
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => exportChartWithData(
                        bestPerformersRef.current,
                        agentPerformanceData.topAgents.map(a => ({ agent: a.name, score: a.score, audits: a.audits, pass: a.pass, fail: a.fail })),
                        "best_performers"
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">Export</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Top performing agents by QA score.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] w-full p-0">
                  <ScrollArea className="h-full">
                    <div className="min-h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-muted/50 border-none sticky top-0 backdrop-blur-sm bg-background/80 z-10">
                            <TableHead className="pl-6 font-semibold">Agent</TableHead>
                            <TableHead className="text-right font-semibold">Score</TableHead>
                            <TableHead className="text-right pr-6 font-semibold">Pass/Fail</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agentPerformanceData.topAgents.map((agent) => (
                            <TableRow
                              key={agent.id}
                              className="hover:bg-green-500/5 transition-colors border-b border-border/50"
                            >
                              <TableCell className="pl-6 font-medium">{agent.name}</TableCell>
                              <TableCell className="text-right font-bold text-green-600">
                                {agent.score}%
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="text-green-600 font-medium">{agent.pass}</span>
                                  <span className="text-muted-foreground">/</span>
                                  <span className="text-destructive font-medium">{agent.fail}</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                          {agentPerformanceData.topAgents.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center text-muted-foreground py-8 h-32"
                              >
                                No top performers data available.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card ref={needsImprovementRef} className="shadow-md border-primary/10 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span className="p-2 bg-red-100 dark:bg-red-900/30 text-destructive rounded-lg">
                        <TrendingDown className="h-4 w-4" />
                      </span>
                      Needs Improvement
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => exportChartWithData(
                        needsImprovementRef.current,
                        agentPerformanceData.underperformingAgents.map(a => ({ agent: a.name, score: a.score, pass: a.pass, fail: a.fail })),
                        "needs_improvement"
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">Export</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Agents with opportunities for growth.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] w-full p-0">
                  <ScrollArea className="h-full">
                    <div className="min-h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow className=" hover:bg-muted/50 border-none sticky top-0 backdrop-blur-sm bg-muted/50 z-10">
                            <TableHead className="pl-6 font-semibold">Agent</TableHead>
                            <TableHead className="text-right font-semibold">Score</TableHead>
                            <TableHead className="text-right pr-6 font-semibold">Pass/Fail</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agentPerformanceData.underperformingAgents.map((agent) => (
                            <TableRow
                              key={agent.id}
                              className="cursor-pointer hover:bg-destructive/5 transition-colors border-b border-border/50"
                              onClick={() => {
                                setSelectedTrainingAgent({
                                  agentName: agent.name,
                                  agentId: agent.id,
                                  score: agent.score,
                                  lowestParam: (agent as any).lowestParam || "N/A",
                                  lowestParamScore: (agent as any).lowestParamScore || 0,
                                });
                                setIsTrainingNeedsModalOpen(true);
                              }}
                            >
                              <TableCell className="pl-6 font-medium">{agent.name}</TableCell>
                              <TableCell className="text-right font-bold text-destructive">
                                {agent.score}%
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="text-green-600 font-medium">{agent.pass}</span>
                                  <span className="text-muted-foreground">/</span>
                                  <span className="text-destructive font-medium">{agent.fail}</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                          {agentPerformanceData.underperformingAgents.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center text-muted-foreground py-8 h-32"
                              >
                                No agents currently need improvement.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Row 2.5: Sentiment Analysis */}
            <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-md border-primary/10 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-lg">
                        <Heart className="h-4 w-4" />
                      </span>
                      Sentiment Analysis
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Customer sentiment across all audited calls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] w-full flex items-center justify-center p-4">
                  <div className="grid grid-cols-3 gap-8 w-full max-w-md">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <div className="h-24 w-24 rounded-full border-8 border-green-500/20" />
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-lg font-bold text-green-600">{sentimentData.positive}%</span>
                        </div>
                        <svg className="absolute inset-0 h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
                          <circle
                            className="text-green-500"
                            strokeWidth="8"
                            strokeDasharray={`${sentimentData.positive * 2.51} 251`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Positive</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <div className="h-24 w-24 rounded-full border-8 border-yellow-500/20" />
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-lg font-bold text-yellow-600">{sentimentData.neutral}%</span>
                        </div>
                        <svg className="absolute inset-0 h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
                          <circle
                            className="text-yellow-500"
                            strokeWidth="8"
                            strokeDasharray={`${sentimentData.neutral * 2.51} 251`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Neutral</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <div className="h-24 w-24 rounded-full border-8 border-red-500/20" />
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-lg font-bold text-red-600">{sentimentData.negative}%</span>
                        </div>
                        <svg className="absolute inset-0 h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
                          <circle
                            className="text-red-500"
                            strokeWidth="8"
                            strokeDasharray={`${sentimentData.negative * 2.51} 251`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Negative</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card ref={campaignPerformanceRef} className="shadow-md border-primary/10 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span className="p-2 bg-chart-4/10 text-chart-4 rounded-lg">
                        <PieChart className="h-4 w-4" />
                      </span>
                      Campaign Performance
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => exportChartWithData(
                        campaignPerformanceRef.current,
                        campaignPerformanceData.map(c => ({ campaign: c.name, qaScore: c.score, compliance: c.compliance })),
                        "campaign_performance"
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">Export</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Performance & compliance scores by campaign.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[250px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-muted/50 border-none sticky top-0 backdrop-blur-sm bg-muted/50 z-10">
                          <TableHead className="pl-6 font-semibold">Campaign</TableHead>
                          <TableHead className="text-right font-semibold">QA Score</TableHead>
                          <TableHead className="text-right pr-6 font-semibold">Compliance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignPerformanceData.map((c, idx) => (
                          <TableRow key={`${c.name}-${idx}`} className="hover:bg-primary/5 transition-colors border-b border-border/50">
                            <TableCell className="pl-6 font-medium">
                              {c.name}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${c.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                c.score >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {c.score}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <span className="font-medium">{c.compliance}%</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>


          </>
        )}

        {/* 4. Detailed "My Audits" Table */}
        <motion.div id="my-audits-section" variants={fadeInUp}>
          <Card className="shadow-lg border-primary/10 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <span className="p-2 bg-primary/10 text-primary rounded-lg">
                      <FileText className="h-5 w-5" />
                    </span>
                    My Audits
                  </CardTitle>
                  <CardDescription className="mt-1">
                    A detailed list of all your recent audit activities.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search agent, campaign..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                    <SelectTrigger className="w-[110px] h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PASS">Pass</SelectItem>
                      <SelectItem value="FAIL">Fail</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Export Dashboard Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={async () => {
                      const chartRefs = [
                        { name: "Daily Audits Trend", element: dailyAuditsChartRef.current, data: dailyAuditsData.map((d: any) => ({ date: d.date, audits: d.audits })) },
                        { name: "Daily Fatal Errors", element: dailyFatalChartRef.current, data: dailyFatalErrorsData.map((d: any) => ({ date: d.date, fatalErrors: d.fatalErrors })) },
                        { name: "Top QA Issues", element: topIssuesChartRef.current, data: agentSpecificChartData.topIssues.map((i: any) => ({ parameter: i.parameter, count: i.count })) },
                        { name: "Pareto Analysis", element: paretoChartRef.current, data: agentSpecificChartData.paretoData.map((p: any) => ({ parameter: p.parameter, count: p.count, cumulative: p.percentage?.toFixed(1) + "%" })) },
                        { name: "Best Performers", element: bestPerformersRef.current, data: agentPerformanceData.topAgents.map(a => ({ agent: a.name, score: a.score, pass: a.pass, fail: a.fail })) },
                        { name: "Needs Improvement", element: needsImprovementRef.current, data: agentPerformanceData.underperformingAgents.map(a => ({ agent: a.name, score: a.score, pass: a.pass, fail: a.fail })) },
                        { name: "Campaign Performance", element: campaignPerformanceRef.current, data: campaignPerformanceData.map(c => ({ campaign: c.name, qaScore: c.score, compliance: c.compliance })) },
                      ];
                      const summaryData = [
                        { label: "Overall QA Score", value: `${overallQAScore}%` },
                        { label: "Total Audits", value: filteredAudits.length },
                        { label: "Compliance Rate", value: `${complianceData.complianceRate}%` },
                        { label: "Fatal Rate", value: `${fatalErrorsData.fatalRate}%` },
                        { label: "Fatal Audits Count", value: fatalErrorsData.fatalAuditsCount },
                        { label: "Date Range", value: dateRange?.from && dateRange?.to ? `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}` : "All Time" },
                      ];
                      await exportDashboardWithAllCharts(chartRefs, summaryData, "qa_dashboard");
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border-t border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-none">
                      <TableHead className="pl-6 font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Campaign</TableHead>
                      {!isAgentView && <TableHead className="font-semibold">Agent</TableHead>}
                      <TableHead className="font-semibold">Score</TableHead>
                      <TableHead className="font-semibold">Audit Type</TableHead>
                      {currentUser?.role === "Administrator" && (
                        <>
                          <TableHead className="font-semibold text-xs">Duration</TableHead>
                          <TableHead className="font-semibold text-xs">Tokens (In/Out)</TableHead>
                        </>
                      )}
                      <TableHead className="w-[80px] text-right pr-6 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAudits.map((audit, index) => (
                      <motion.tr
                        key={audit.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        onClick={() => openAuditDetailsModal(audit)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/50 group"
                      >
                        <TableCell className="pl-6 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          {format(new Date(audit.auditDate), "PP")}
                        </TableCell>
                        <TableCell className="font-medium">{audit.campaignName}</TableCell>
                        {!isAgentView && <TableCell>{audit.agentName}</TableCell>}
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${audit.overallScore > 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            audit.overallScore >= 85 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {audit.overallScore.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              audit.auditType === "ai" ? "default" : "secondary"
                            }
                            className="font-normal"
                          >
                            {audit.auditType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        {currentUser?.role === "Administrator" && (
                          <>
                            <TableCell className="text-xs text-muted-foreground">
                              {audit.auditData?.auditDurationMs
                                ? `${(audit.auditData.auditDurationMs / 1000).toFixed(
                                  1
                                )}s`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {audit.auditData?.tokenUsage
                                ? `${audit.auditData.tokenUsage.inputTokens || 0} / ${audit.auditData.tokenUsage.outputTokens || 0
                                }`
                                : "-"}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAuditToDelete(audit);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                    {paginatedAudits.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={isAgentView ? (currentUser?.role === "Administrator" ? 7 : 5) : (currentUser?.role === "Administrator" ? 8 : 6)}
                          className="text-center text-muted-foreground py-12 h-48"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FileStack className="h-8 w-8 text-muted-foreground/50" />
                            <p>No audits found matching your criteria.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {filteredAudits.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/20">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAudits.length)}</span> of <span className="font-medium">{filteredAudits.length}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" /> Previous
                    </Button>
                    <div className="text-sm font-medium px-2">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="h-8 px-3"
                    >
                      Next <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>    <Dialog
        open={!!selectedIssue}
        onOpenChange={(open) => !open && setSelectedIssue(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Breakdown</DialogTitle>
            <DialogDescription>
              Detailed analysis of failures for this parameter group.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="font-bold text-lg mb-4 flex items-center gap-2 text-primary border-b pb-2">
                <Target className="h-5 w-5" />
                {selectedIssue?.reason}
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-sm text-muted-foreground flex items-center justify-between">
                  <span>Sub-parameter</span>
                  <span>Failure Count</span>
                </div>
                {selectedIssue?.subParameters &&
                  selectedIssue.subParameters.length > 0 ? (
                  <div className="grid gap-2">
                    {selectedIssue.subParameters.map(
                      (sub: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm font-medium">
                            {sub.name}
                          </span>
                          <Badge variant="secondary" className="ml-2">
                            {sub.count}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic text-sm p-2">
                    No specific sub-parameter data available.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 font-semibold mb-2 text-primary">
                <Sparkles className="h-4 w-4" />
                AI Improvement Suggestion
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedIssue?.suggestion ||
                  "Analyze the specific interactions where this parameter failed to identify root causes."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!selectedIssue) return;
                const headers = ["Parameter Group", "Sub-Parameter", "Failure Count"];
                const rows = [headers.join(",")];

                if (selectedIssue.subParameters && selectedIssue.subParameters.length > 0) {
                  selectedIssue.subParameters.forEach((sub: any) => {
                    rows.push([
                      `"${selectedIssue.reason}"`,
                      `"${sub.name}"`,
                      sub.count.toString()
                    ].join(","));
                  });
                } else {
                  rows.push([
                    `"${selectedIssue.reason}"`,
                    `"No sub-parameters"`,
                    selectedIssue.count?.toString() || "0"
                  ].join(","));
                }

                const csv = rows.join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `qa-issue-${selectedIssue.reason.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setSelectedIssue(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTrainingNeedsModalOpen}
        onOpenChange={(open) => {
          setIsTrainingNeedsModalOpen(open);
          if (!open) setSelectedTrainingAgent(null);
        }}
      >
        <DialogContent className={selectedTrainingAgent ? "max-w-6xl" : "max-w-3xl"}>
          <DialogHeader>
            <DialogTitle>
              {selectedTrainingAgent
                ? `Training Analysis: ${selectedTrainingAgent.agentName}`
                : "Training Needs Analysis"}
            </DialogTitle>
            <DialogDescription>
              {selectedTrainingAgent
                ? `Detailed failure analysis for ${selectedTrainingAgent.agentName} (${selectedTrainingAgent.agentId})`
                : "Agents requiring immediate attention based on recent audit performance. Click on an agent to see their detailed analysis."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedTrainingAgent ? (
              // Agent-specific charts view
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTrainingAgent(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to List
                  </Button>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedTrainingAgent.score < 70 ? "destructive" : "secondary"}>
                      Overall: {selectedTrainingAgent.score}%
                    </Badge>
                    <Badge variant="outline">
                      Weakest: {selectedTrainingAgent.lowestParam} ({selectedTrainingAgent.lowestParamScore}%)
                    </Badge>
                  </div>
                </div>

                {/* Agent-Specific KPIs */}
                {(() => {
                  const agentAudits = filteredAudits.filter(a => a.agentUserId === selectedTrainingAgent.agentId);
                  const agentQAScore = agentAudits.length > 0
                    ? (agentAudits.reduce((sum, a) => sum + (a.overallScore || 0), 0) / agentAudits.length)
                    : 0;
                  const agentFatalAudits = agentAudits.filter(a =>
                    a.auditData?.auditResults?.some((r: any) => r.type === "Fatal" && r.score < 80)
                  );
                  const agentFatalRate = agentAudits.length > 0
                    ? ((agentFatalAudits.length / agentAudits.length) * 100)
                    : 0;
                  const targetScore = 85; // Target QA score
                  const scoreDiff = agentQAScore - targetScore;

                  return (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground font-medium">QA Score</span>
                        </div>
                        <div className="text-2xl font-bold">{agentQAScore.toFixed(1)}%</div>
                        <div className={`text-xs ${scoreDiff >= 0 ? "text-green-500" : "text-destructive"}`}>
                          {scoreDiff >= 0 ? "+" : ""}{scoreDiff.toFixed(1)}% vs {targetScore}% target
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <ClipboardList className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-muted-foreground font-medium">Total Audits</span>
                        </div>
                        <div className="text-2xl font-bold">{agentAudits.length}</div>
                        <div className="text-xs text-muted-foreground">
                          In selected date range
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-4 w-4 text-orange-500" />
                          <span className="text-xs text-muted-foreground font-medium">Fatal Rate</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-orange-500">{agentFatalRate.toFixed(1)}%</span>
                          <span className="text-sm text-muted-foreground">({agentFatalAudits.length})</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agentFatalAudits.length} audits with fatal errors
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {agentSpecificChartData.topIssues.length > 0 || agentSpecificChartData.paretoData.length > 0 ? (
                  <>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Agent's Top QA Issues */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Top QA Issues</CardTitle>
                          <CardDescription className="text-xs">
                            Parameters where this agent needs improvement
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {agentSpecificChartData.topIssues.length > 0 ? (
                            <ChartContainer
                              config={chartConfigTopIssues}
                              className="h-[250px] w-full"
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  layout="vertical"
                                  data={agentSpecificChartData.topIssues}
                                  margin={{ left: 10, top: 10, right: 30, bottom: 10 }}
                                >
                                  <CartesianGrid horizontal={false} />
                                  <XAxis type="number" dataKey="count" tick={{ fontSize: 10 }} />
                                  <YAxis
                                    dataKey="reason"
                                    type="category"
                                    tick={{ fontSize: 10 }}
                                    width={100}
                                    interval={0}
                                  />
                                  <Tooltip content={<ChartTooltipContent />} />
                                  <Bar
                                    dataKey="count"
                                    radius={4}
                                    fill="hsl(249, 81%, 67%)"
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                              No QA issues found for this agent
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Agent's Pareto Analysis */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Pareto Analysis</CardTitle>
                          <CardDescription className="text-xs">
                            Parameter-wise failure distribution (80/20 rule) - <span className="text-red-500 font-medium">Fatal</span> / <span className="text-orange-500 font-medium">ZTP</span> / <span className="text-purple-500 font-medium">Non-Fatal</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {agentSpecificChartData.paretoData.length > 0 ? (
                            <ChartContainer
                              config={chartConfigPareto}
                              className="h-[250px] w-full"
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                  data={agentSpecificChartData.paretoData}
                                  margin={{ left: 10, top: 10, right: 30, bottom: 50 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="parameter"
                                    tick={{ fontSize: 9 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    interval={0}
                                  />
                                  <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    tick={{ fontSize: 10 }}
                                    label={{ value: "Frequency %", angle: -90, position: "insideLeft", fontSize: 10 }}
                                  />
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    domain={[0, 100]}
                                    tick={{ fontSize: 10 }}
                                    label={{ value: "Cumulative %", angle: 90, position: "insideRight", fontSize: 10 }}
                                  />
                                  <Tooltip
                                    content={({ active, payload, label }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0]?.payload;
                                        return (
                                          <div className="bg-background border rounded-lg p-2 shadow-lg text-xs">
                                            <p className="font-semibold">{label}</p>
                                            <p className={`font-medium ${data?.type === 'Fatal' ? 'text-red-500' : data?.type === 'ZTP' ? 'text-orange-500' : 'text-purple-500'}`}>
                                              Type: {data?.type || 'Non-Fatal'}
                                            </p>
                                            <p>Frequency: {data?.frequencyPercentage?.toFixed(1)}%</p>
                                            <p>Count: {data?.count}</p>
                                            <p>Cumulative: {data?.percentage?.toFixed(1)}%</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <ReferenceLine yAxisId="right" y={80} stroke="hsl(var(--chart-2))" strokeDasharray="5 5" label={{ value: "80% Cut-off", position: "top", fontSize: 9 }} />
                                  <Bar
                                    yAxisId="left"
                                    dataKey="frequencyPercentage"
                                    radius={[4, 4, 0, 0]}
                                  >
                                    {agentSpecificChartData.paretoData.map((entry: any, index: number) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.type === 'Fatal' ? '#ef4444' : entry.type === 'ZTP' ? '#f97316' : 'hsl(249, 81%, 67%)'}
                                      />
                                    ))}
                                    <LabelList dataKey="frequencyPercentage" position="top" fontSize={8} formatter={(v: any) => `${Number(v || 0).toFixed(1)}%`} />
                                  </Bar>
                                  <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="percentage"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#f59e0b" }}
                                    activeDot={{ r: 6 }}
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                              No failure data for Pareto analysis
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* AI Improvement Suggestions */}
                    <Card className="mt-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Improvement Suggestions
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Personalized recommendations based on this agent&apos;s performance
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {agentSpecificChartData.topIssues.length > 0 ? (
                            <>
                              {/* Severity Assessment */}
                              <div className="p-3 rounded-lg border bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Activity className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm font-semibold text-orange-600">Performance Assessment</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {selectedTrainingAgent.score < 60
                                    ? `⚠️ Critical: This agent is significantly below target with ${agentSpecificChartData.topIssues.length} recurring issue areas. Immediate intervention required.`
                                    : selectedTrainingAgent.score < 75
                                      ? `⚡ Needs Improvement: Performance is below expectations. Focused coaching can help address the ${agentSpecificChartData.topIssues.length} identified weak areas.`
                                      : `📊 Minor Adjustments: Close to target but ${agentSpecificChartData.topIssues.length} area(s) need attention for consistent excellence.`
                                  }
                                </p>
                              </div>

                              {/* Focus Areas with Priority */}
                              <div className="bg-muted/50 p-3 rounded-lg border">
                                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-primary" />
                                  Priority Focus Areas
                                </p>
                                <div className="space-y-2">
                                  {agentSpecificChartData.topIssues.slice(0, 4).map((issue, idx) => (
                                    <div key={idx} className="p-2 bg-background rounded border">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{issue.reason}</span>
                                        <Badge variant={idx === 0 ? "destructive" : "secondary"} className="text-xs">
                                          {idx === 0 ? "Highest Priority" : `Priority ${idx + 1}`}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {issue.count} failure{issue.count !== 1 ? 's' : ''} detected
                                        {issue.subParameters.length > 0 && (
                                          <span className="ml-1">
                                            • Key sub-areas: {issue.subParameters.slice(0, 3).map(s => s.name).join(', ')}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Recommended Training Modules */}
                              <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                                <p className="text-sm font-medium mb-2 text-blue-600 flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  Recommended Training Modules
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {agentSpecificChartData.topIssues.slice(0, 2).map((issue, idx) => (
                                    <div key={idx} className="p-2 bg-background rounded text-xs">
                                      <span className="font-medium">{issue.reason} Mastery</span>
                                      <p className="text-muted-foreground mt-1">SOP review + role-play exercises</p>
                                    </div>
                                  ))}
                                  <div className="p-2 bg-background rounded text-xs">
                                    <span className="font-medium">Quality Mindset</span>
                                    <p className="text-muted-foreground mt-1">Understanding audit parameters</p>
                                  </div>
                                  <div className="p-2 bg-background rounded text-xs">
                                    <span className="font-medium">Best Practices</span>
                                    <p className="text-muted-foreground mt-1">Learn from top performers</p>
                                  </div>
                                </div>
                              </div>

                              {/* Action Plan */}
                              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                                <p className="text-sm font-medium mb-2 text-primary flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Recommended Action Plan
                                </p>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-3 p-2 bg-background rounded">
                                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                    <div>
                                      <span className="text-sm font-medium">Immediate: One-on-One Coaching</span>
                                      <p className="text-xs text-muted-foreground">Schedule a 30-min session focusing on <strong>{agentSpecificChartData.topIssues[0]?.reason}</strong>. Review specific call recordings where this parameter failed.</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3 p-2 bg-background rounded">
                                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                    <div>
                                      <span className="text-sm font-medium">Week 1: Shadowing & Practice</span>
                                      <p className="text-xs text-muted-foreground">Pair with a high-performing agent for 2-3 live call observations. Practice role-play scenarios targeting weak parameters.</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3 p-2 bg-background rounded">
                                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                    <div>
                                      <span className="text-sm font-medium">Week 2: Progress Audit</span>
                                      <p className="text-xs text-muted-foreground">Conduct 3-5 follow-up audits to measure improvement. Target: Reduce failures in {agentSpecificChartData.topIssues[0]?.reason} by 50%.</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3 p-2 bg-background rounded">
                                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                    <div>
                                      <span className="text-sm font-medium">Week 4: Performance Review</span>
                                      <p className="text-xs text-muted-foreground">Re-evaluate overall score. If improvement &lt;10%, escalate to advanced training program.</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <p>No specific improvement areas identified.</p>
                              <p className="text-xs mt-1">This agent may be performing well or have insufficient audit data.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No failure data available for this agent in the selected date range.</p>
                    <p className="text-sm mt-2">This may indicate the agent has performed well or has no audits.</p>
                  </div>
                )}
              </div>
            ) : (
              // Agents list view
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Overall Score</TableHead>
                    <TableHead>Critical Weakness</TableHead>
                    <TableHead className="text-right">Param Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingNeedsList.length > 0 ? (
                    trainingNeedsList.map((agent) => (
                      <TableRow
                        key={agent.agentId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedTrainingAgent(agent)}
                      >
                        <TableCell className="font-medium">
                          <div>{agent.agentName}</div>
                          <div className="text-xs text-muted-foreground">
                            {agent.agentId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              agent.score < 70 ? "destructive" : "secondary"
                            }
                          >
                            {agent.score}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-destructive font-medium">
                          {agent.lowestParam}
                        </TableCell>
                        <TableCell className="text-right">
                          {agent.lowestParamScore}%
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground h-24"
                      >
                        No agents currently flagged for critical training needs.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const ExcelJS = await import("exceljs");
                const workbook = new ExcelJS.Workbook();
                workbook.creator = "Dashboard Export";
                workbook.created = new Date();
                const timestamp = new Date().toISOString().split("T")[0];

                if (selectedTrainingAgent) {
                  // Calculate agent KPIs
                  const agentAudits = filteredAudits.filter(a => a.agentUserId === selectedTrainingAgent.agentId);
                  const agentQAScore = agentAudits.length > 0
                    ? (agentAudits.reduce((sum, a) => sum + (a.overallScore || 0), 0) / agentAudits.length)
                    : 0;
                  const agentFatalAudits = agentAudits.filter(a =>
                    a.auditData?.auditResults?.some((r: any) => r.type === "Fatal" && r.score < 80)
                  );
                  const agentFatalRate = agentAudits.length > 0
                    ? ((agentFatalAudits.length / agentAudits.length) * 100)
                    : 0;

                  // Sheet 1: Summary with KPIs
                  const summarySheet = workbook.addWorksheet("Summary");
                  summarySheet.columns = [{ width: 25 }, { width: 40 }];
                  summarySheet.addRow(["Agent Training Analysis Report"]).font = { bold: true, size: 16 };
                  summarySheet.addRow([]);
                  summarySheet.addRow(["Agent Name", selectedTrainingAgent.agentName]);
                  summarySheet.addRow(["Agent ID", selectedTrainingAgent.agentId]);
                  summarySheet.addRow(["Export Date", new Date().toLocaleString()]);
                  summarySheet.addRow([]);
                  summarySheet.addRow(["Key Performance Indicators"]).font = { bold: true };
                  summarySheet.addRow(["QA Score", `${agentQAScore.toFixed(1)}%`]);
                  summarySheet.addRow(["Total Audits", agentAudits.length]);
                  summarySheet.addRow(["Fatal Rate", `${agentFatalRate.toFixed(1)}%`]);
                  summarySheet.addRow(["Fatal Audits", agentFatalAudits.length]);
                  summarySheet.addRow(["Overall Assessment", selectedTrainingAgent.score]);
                  summarySheet.addRow(["Weakest Parameter", selectedTrainingAgent.lowestParam]);
                  summarySheet.addRow(["Weakest Param Score", `${selectedTrainingAgent.lowestParamScore}%`]);

                  // Sheet 2: Top Issues with sub-parameters
                  const issuesSheet = workbook.addWorksheet("Top Issues");
                  const issueHeaders = issuesSheet.addRow(["Priority", "Parameter Group", "Failure Count", "Sub-Parameters"]);
                  issueHeaders.font = { bold: true };
                  issueHeaders.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } }; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; });

                  agentSpecificChartData.topIssues.forEach((issue: any, idx: number) => {
                    issuesSheet.addRow([
                      idx === 0 ? "Highest" : `Priority ${idx + 1}`,
                      issue.reason,
                      issue.count,
                      issue.subParameters?.map((s: any) => s.name).join(", ") || "N/A"
                    ]);
                  });
                  issuesSheet.columns.forEach(col => { col.width = 25; });

                  // Sheet 3: Pareto Analysis
                  if (agentSpecificChartData.paretoData.length > 0) {
                    const paretoSheet = workbook.addWorksheet("Pareto Analysis");
                    const paretoHeaders = paretoSheet.addRow(["Parameter", "Failure Count", "Frequency %", "Cumulative %"]);
                    paretoHeaders.font = { bold: true };
                    paretoHeaders.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF59E0B" } }; c.font = { bold: true }; });

                    agentSpecificChartData.paretoData.forEach((p: any) => {
                      paretoSheet.addRow([p.parameter, p.count, `${p.frequencyPercentage?.toFixed(1) || 0}%`, `${p.percentage?.toFixed(1) || 0}%`]);
                    });
                    paretoSheet.columns.forEach(col => { col.width = 20; });
                  }

                  // Sheet 4: Action Plan
                  const actionSheet = workbook.addWorksheet("Action Plan");
                  actionSheet.columns = [{ width: 15 }, { width: 30 }, { width: 60 }];
                  actionSheet.addRow(["Recommended Action Plan for " + selectedTrainingAgent.agentName]).font = { bold: true, size: 14 };
                  actionSheet.addRow([]);
                  const actionHeaders = actionSheet.addRow(["Timeline", "Action", "Details"]);
                  actionHeaders.font = { bold: true };
                  actionHeaders.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF22C55E" } }; c.font = { bold: true }; });

                  const topIssue = agentSpecificChartData.topIssues[0]?.reason || "identified weak areas";
                  actionSheet.addRow(["Immediate", "One-on-One Coaching", `Schedule a 30-min session focusing on ${topIssue}. Review specific call recordings.`]);
                  actionSheet.addRow(["Week 1", "Shadowing & Practice", "Pair with a high-performing agent for 2-3 live call observations."]);
                  actionSheet.addRow(["Week 2", "Progress Audit", `Conduct 3-5 follow-up audits. Target: Reduce failures in ${topIssue} by 50%.`]);
                  actionSheet.addRow(["Week 4", "Performance Review", "Re-evaluate overall score. Escalate if improvement <10%."]);

                  // Sheet 5: Formulas & Methodology (Pareto only with values)
                  const formulaSheet = workbook.addWorksheet("Formulas");
                  formulaSheet.columns = [{ width: 30 }, { width: 60 }, { width: 20 }];
                  formulaSheet.addRow(["Pareto Analysis - Calculation Methodology"]).font = { bold: true, size: 16 };
                  formulaSheet.addRow([]);

                  // Calculate total failures for formula display
                  const totalFailures = agentSpecificChartData.paretoData.reduce((sum: number, p: any) => sum + p.count, 0);

                  formulaSheet.addRow(["Total Failures (across all parameters)", totalFailures]).font = { bold: true };
                  formulaSheet.addRow([]);

                  // Headers
                  const formulaHeaders = formulaSheet.addRow(["Parameter", "Formula with Values", "Result"]);
                  formulaHeaders.font = { bold: true };
                  formulaHeaders.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6366F1" } }; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; });

                  // Show each parameter with its actual formula calculation
                  let runningCumulative = 0;
                  agentSpecificChartData.paretoData.forEach((p: any, idx: number) => {
                    const frequencyPct = totalFailures > 0 ? (p.count / totalFailures) * 100 : 0;
                    runningCumulative += frequencyPct;

                    // Frequency % row
                    formulaSheet.addRow([
                      `${p.parameter} - Frequency %`,
                      `= (${p.count} / ${totalFailures}) × 100`,
                      `${frequencyPct.toFixed(1)}%`
                    ]);

                    // Cumulative % row  
                    const prevCumulative = runningCumulative - frequencyPct;
                    formulaSheet.addRow([
                      `${p.parameter} - Cumulative %`,
                      idx === 0
                        ? `= ${frequencyPct.toFixed(1)}% (first parameter)`
                        : `= ${prevCumulative.toFixed(1)}% + ${frequencyPct.toFixed(1)}%`,
                      `${runningCumulative.toFixed(1)}%`
                    ]);

                    formulaSheet.addRow([]); // Empty row between parameters
                  });

                  // Legend
                  formulaSheet.addRow([]);
                  formulaSheet.addRow(["Formula Definitions:"]).font = { bold: true, size: 12 };
                  formulaSheet.addRow(["Frequency %", "= (Parameter Failure Count / Total Failures) × 100"]);
                  formulaSheet.addRow(["Cumulative %", "= Sum of all Frequency % values up to and including this parameter"]);

                  const buffer = await workbook.xlsx.writeBuffer();
                  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `agent-training-${selectedTrainingAgent.agentName.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                } else {
                  // Export training needs list
                  const listSheet = workbook.addWorksheet("Training Needs");
                  const headers = listSheet.addRow(["Agent Name", "Agent ID", "Overall Score", "Critical Weakness", "Weakness Score"]);
                  headers.font = { bold: true };
                  headers.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } }; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; });

                  trainingNeedsList.forEach((agent) => {
                    listSheet.addRow([agent.agentName, agent.agentId, `${agent.score}%`, agent.lowestParam, `${agent.lowestParamScore}%`]);
                  });
                  listSheet.columns.forEach(col => { col.width = 20; });

                  const buffer = await workbook.xlsx.writeBuffer();
                  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `training-needs-analysis_${timestamp}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export XLSX
            </Button>
            <Button onClick={() => {
              setIsTrainingNeedsModalOpen(false);
              setSelectedTrainingAgent(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fatal Explanation Dialog */}
      <Dialog open={isFatalExplanationOpen} onOpenChange={setIsFatalExplanationOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5 text-orange-500" />
              Understanding Fatal Audits
            </DialogTitle>
            <DialogDescription>
              Learn how audits are classified as fatal and what it means for quality assurance.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-500">{fatalErrorsData.fatalRate}%</div>
                  <div className="text-xs text-muted-foreground">Fatal Rate</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{fatalErrorsData.fatalAuditsCount}</div>
                  <div className="text-xs text-muted-foreground">Fatal Audits</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{fatalErrorsData.totalFatalErrors}</div>
                  <div className="text-xs text-muted-foreground">Total Fatal Errors</div>
                </div>
              </div>

              <Separator />

              {/* How an Audit is Considered Fatal */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">How is an Audit Considered Fatal?</h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="mt-0.5 p-1 bg-destructive/20 rounded">
                      <span className="text-destructive font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-destructive">Fatal Parameter Failure</p>
                      <p className="text-sm text-muted-foreground">
                        An audit is marked as <strong>fatal</strong> when it contains at least one parameter with:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside ml-2">
                        <li>Parameter type = <code className="bg-muted px-1 rounded">&quot;Fatal&quot;</code></li>
                        <li>Parameter score &lt; 80%</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <div className="mt-0.5 p-1 bg-orange-500/20 rounded">
                      <span className="text-orange-500 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-orange-600">Fatal Rate Calculation</p>
                      <p className="text-sm text-muted-foreground">
                        <code className="bg-muted px-1 rounded">Fatal Rate = (Audits with Fatal Errors / Total Audits) × 100</code>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently: ({fatalErrorsData.fatalAuditsCount} / {filteredAudits.length}) × 100 = {fatalErrorsData.fatalRate}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="mt-0.5 p-1 bg-blue-500/20 rounded">
                      <span className="text-blue-500 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-600">Examples of Fatal Parameters</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        <li>Compliance Violations</li>
                        <li>Security/Privacy Breaches</li>
                        <li>Regulatory Non-compliance</li>
                        <li>Critical Process Deviations</li>
                        <li>Customer Data Mishandling</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fatal Calls Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Fatal Calls Details</h4>
                  <Badge variant="destructive">{(() => {
                    const fatalCount = filteredAudits.filter(audit =>
                      audit.auditData.auditResults.some((r: any) => r.type === "Fatal" && r.score < 80)
                    ).length;
                    return `${fatalCount} fatal calls`;
                  })()}</Badge>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by agent name or ID..."
                    className="pl-9"
                    id="fatalSearchInput"
                    onChange={(e) => {
                      const searchContainer = document.getElementById("fatalCallsList");
                      const items = searchContainer?.querySelectorAll("[data-fatal-item]");
                      const term = e.target.value.toLowerCase();
                      items?.forEach((item) => {
                        const agentName = item.getAttribute("data-agent-name")?.toLowerCase() || "";
                        const agentId = item.getAttribute("data-agent-id")?.toLowerCase() || "";
                        if (agentName.includes(term) || agentId.includes(term)) {
                          (item as HTMLElement).style.display = "block";
                        } else {
                          (item as HTMLElement).style.display = "none";
                        }
                      });
                    }}
                  />
                </div>

                {/* Fatal Calls List */}
                <div id="fatalCallsList" className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {(() => {
                    const fatalAudits = filteredAudits.filter(audit =>
                      audit.auditData.auditResults.some((r: any) => r.type === "Fatal" && r.score < 80)
                    );

                    if (fatalAudits.length === 0) {
                      return (
                        <div className="p-6 bg-muted/50 border rounded-lg text-center">
                          <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <p className="text-sm text-muted-foreground">No fatal calls found in current selection</p>
                          <p className="text-xs text-muted-foreground mt-1">Great job! All audits passed fatal parameters.</p>
                        </div>
                      );
                    }

                    return fatalAudits.map((audit, auditIdx) => {
                      const fatalParams = audit.auditData.auditResults.filter((r: any) => r.type === "Fatal" && r.score < 80);
                      return (
                        <div
                          key={audit.id || auditIdx}
                          data-fatal-item
                          data-agent-name={audit.agentName}
                          data-agent-id={audit.agentUserId}
                          className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg hover:bg-destructive/15 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-sm">{audit.agentName}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {audit.agentUserId} • {audit.campaignName} • {format(new Date(audit.auditDate), "PP")}
                              </p>
                            </div>
                            <Badge variant="destructive">{audit.overallScore.toFixed(1)}%</Badge>
                          </div>

                          {/* Failed Fatal Parameters */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-destructive mb-2">
                              ⚠️ {fatalParams.length} fatal parameter{fatalParams.length > 1 ? "s" : ""} failed:
                            </p>
                            <div className="grid grid-cols-1 gap-1">
                              {fatalParams.map((param: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center text-xs py-1.5 px-2 bg-destructive/20 border border-destructive/30 rounded"
                                >
                                  <span className="truncate flex-1 mr-2 font-medium">{param.parameter}</span>
                                  <span className="font-bold text-destructive">{param.score}%</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* All Other Parameters (collapsed) */}
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View all {audit.auditData.auditResults.length} parameters
                            </summary>
                            <div className="grid grid-cols-1 gap-1 mt-2">
                              {audit.auditData.auditResults.map((param: any, idx: number) => {
                                const isFatalFailed = param.type === "Fatal" && param.score < 80;
                                if (isFatalFailed) return null; // Already shown above
                                return (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center text-xs py-1 px-2 bg-background/50 rounded"
                                  >
                                    <span className="truncate flex-1 mr-2">{param.parameter}</span>
                                    <span className={`font-semibold ${param.score >= 80 ? "text-green-600" : "text-orange-500"}`}>
                                      {param.score}%
                                      {param.type === "Fatal" && <span className="ml-1 text-[10px] opacity-70">(Fatal)</span>}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <Separator />

              {/* Impact Section */}
              <div className="space-y-2">
                <h4 className="font-semibold">Impact of Fatal Audits</h4>
                <p className="text-sm text-muted-foreground">
                  Fatal errors are critical quality failures that may result in:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                  <li>Immediate escalation to supervisors</li>
                  <li>Mandatory retraining for the agent</li>
                  <li>Potential disciplinary action</li>
                  <li>Impact on overall team metrics</li>
                </ul>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsFatalExplanationOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
