// Removed direct AI flow import - using API route instead
// Define QaAuditOutput type locally if needed
export interface QaAuditOutput {
  // Add type definition based on the actual structure
  [key: string]: any;
}

export interface SavedAuditItem {
  id: string;
  callId?: string;
  auditDate: string; // ISO string date
  agentName: string;
  agentUserId: string;
  campaignName?: string;
  projectId?: string; // Project ID for project-based access control
  overallScore: number;
  auditData: QaAuditOutput;
  auditType: "ai" | "manual" | "bulk";
  auditedBy?: string; // User ID of who performed the audit
}
