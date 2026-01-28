
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const QaAuditContent = dynamic(() => import('./qa-audit-content'), {
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ),
  ssr: false,
});

export default function QaAuditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QaAuditContent />
    </Suspense>
  );
}
