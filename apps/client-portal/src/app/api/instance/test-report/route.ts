/**
 * Test Report API Route (Server-side)
 * Reads ADMIN_PANEL_URL and INSTANCE_API_KEY from client-portal's own env vars
 * and sends a test usage report directly to the admin panel.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const adminPanelUrl = process.env.ADMIN_PANEL_URL;
  const apiKey = process.env.INSTANCE_API_KEY;

  if (!adminPanelUrl || !apiKey) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Usage reporting not enabled (ADMIN_PANEL_URL or INSTANCE_API_KEY missing from client-portal env)',
      },
      { status: 200 },
    );
  }

  const payload = {
    auditId: `test-${Date.now()}`,
    auditType: 'manual',
    overallScore: 100,
    totalTokens: 0,
    processingDurationMs: 0,
    agentName: 'test-user',
    metadata: { test: true },
  };

  try {
    const response = await fetch(`${adminPanelUrl}/api/admin/audit-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({
        success: false,
        message: `Admin panel returned ${response.status}: ${error}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test report sent successfully',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Failed to send test report: ${error.message}`,
    });
  }
}
