/**
 * Instance Status API Route (Server-side)
 * Reads ADMIN_PANEL_URL and INSTANCE_API_KEY from client-portal's own env vars.
 * In a multi-tenant setup, each client-portal deployment has its own env vars,
 * so this correctly reports per-instance configuration status.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const adminPanelUrl = process.env.ADMIN_PANEL_URL;
  const apiKey = process.env.INSTANCE_API_KEY;

  return NextResponse.json({
    usageReportingEnabled: !!(adminPanelUrl && apiKey),
    hasAdminUrl: !!adminPanelUrl,
    hasInstanceApiKey: !!apiKey,
  });
}
