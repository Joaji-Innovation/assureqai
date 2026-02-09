'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            width: '100%',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#e2e8f0',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                marginBottom: '12px',
                letterSpacing: '-0.025em',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: '#94a3b8',
                marginBottom: '24px',
                lineHeight: '1.6',
              }}
            >
              An unexpected error occurred. Our team has been notified and is
              looking into it.
            </p>

            {/* Error Details Card */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                  color: '#ef4444',
                  marginBottom: '8px',
                }}
              >
                Error Details
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: '#cbd5e1',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                  wordBreak: 'break-word' as const,
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                {error.message || 'An unknown error occurred'}
              </p>
              {error.digest && (
                <p
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    marginTop: '8px',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  Digest: {error.digest}
                </p>
              )}
            </div>

            {/* Actions */}
            <div
              style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
            >
              <button
                onClick={() => reset()}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = '#2563eb')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = '#3b82f6')
                }
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.borderColor = '#475569')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.borderColor = '#334155')
                }
              >
                Go to Dashboard
              </button>
            </div>

            {/* Footer */}
            <p
              style={{
                fontSize: '12px',
                color: '#475569',
                marginTop: '32px',
              }}
            >
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
