/**
 * Excel Export Utilities
 * Uses SheetJS/xlsx for spreadsheet generation
 */

import * as XLSX from 'xlsx';

export interface AuditExportData {
  employeeId: string;
  campaign: string;
  callCategory: string;
  agentName: string;
  auditId: string;
  callDuration: string;
  auditDate: string;
  auditedBy: string;
  passFail: string;
  auditDuration: string;
  startTime: string;
  endTime: string;
  overallScore: number;
  fatalStatus: string;
  fatalCount: number;
  parameterScores: Record<string, number | string>;
  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface ExportSummaryMetrics {
  reportPeriod: string;
  totalAudits: number;
  passRate: number;
  averageScore: number;
  fatalCount: number;
  ztpCount: number;
  aiAudits: number;
  manualAudits: number;
}

export interface ExportOptions {
  includeTokens?: boolean;
  filename?: string;
}

/**
 * Export audit data to XLSX format
 */
export async function exportAuditDataAsXLSX(
  audits: AuditExportData[],
  summaryMetrics: ExportSummaryMetrics,
  _chartRefs: { name: string; element: HTMLElement | null }[] = [],
  options: ExportOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const { includeTokens = false, filename = 'QA_Audit_Report' } = options;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // ============ Summary Sheet ============
    const summaryData = [
      ['QA Audit Report'],
      [''],
      ['Report Period', summaryMetrics.reportPeriod],
      ['Total Audits', summaryMetrics.totalAudits],
      ['Pass Rate', `${summaryMetrics.passRate.toFixed(1)}%`],
      ['Average Score', `${summaryMetrics.averageScore.toFixed(1)}%`],
      ['Fatal Count', summaryMetrics.fatalCount],
      ['ZTP Count', summaryMetrics.ztpCount],
      ['AI Audits', summaryMetrics.aiAudits],
      ['Manual Audits', summaryMetrics.manualAudits],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style the header
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // ============ Audit Data Sheet ============
    // Collect all unique parameter names
    const allParameters = new Set<string>();
    audits.forEach(audit => {
      Object.keys(audit.parameterScores).forEach(param => allParameters.add(param));
    });
    const parameterList = Array.from(allParameters);

    // Build headers
    const headers = [
      'Employee ID',
      'Campaign',
      'Call Category',
      'Agent Name',
      'Audit ID',
      'Call Duration',
      'Audit Date',
      'Audited By',
      'Pass/Fail',
      'Audit Duration',
      'Start Time',
      'End Time',
      'Overall Score',
      'Fatal Status',
      'Fatal Count',
      ...parameterList,
    ];

    if (includeTokens) {
      headers.push('Input Tokens', 'Output Tokens', 'Total Tokens');
    }

    // Build data rows
    const dataRows = audits.map(audit => {
      const row: (string | number)[] = [
        audit.employeeId,
        audit.campaign,
        audit.callCategory,
        audit.agentName,
        audit.auditId,
        audit.callDuration,
        audit.auditDate,
        audit.auditedBy,
        audit.passFail,
        audit.auditDuration,
        audit.startTime,
        audit.endTime,
        audit.overallScore,
        audit.fatalStatus,
        audit.fatalCount,
        ...parameterList.map(param => audit.parameterScores[param] ?? ''),
      ];

      if (includeTokens) {
        row.push(
          audit.tokenUsage?.inputTokens ?? 0,
          audit.tokenUsage?.outputTokens ?? 0,
          audit.tokenUsage?.totalTokens ?? 0
        );
      }

      return row;
    });

    const auditSheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    
    // Set column widths
    auditSheet['!cols'] = headers.map(() => ({ wch: 15 }));
    XLSX.utils.book_append_sheet(wb, auditSheet, 'Audit Data');

    // ============ Download ============
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);

    return { success: true };
  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Export single chart with data
 */
export async function exportChartWithData(
  chartElement: HTMLElement | null,
  data: Record<string, unknown>[],
  chartName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!chartElement) {
      return { success: false, error: 'Chart element not found' };
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, chartName);
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${chartName}_${timestamp}.xlsx`);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Export dashboard with all charts
 */
export async function exportDashboardWithAllCharts(
  chartRefs: { name: string; element: HTMLElement | null; data: Record<string, unknown>[] }[],
  summaryData: Record<string, unknown>[],
  filename: string = 'Dashboard_Export'
): Promise<{ success: boolean; error?: string }> {
  try {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Add each chart's data as a sheet
    chartRefs.forEach(chart => {
      if (chart.data && chart.data.length > 0) {
        const sheet = XLSX.utils.json_to_sheet(chart.data);
        // Truncate sheet name to 31 chars (Excel limit)
        const sheetName = chart.name.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, sheet, sheetName);
      }
    });

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

