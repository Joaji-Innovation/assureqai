'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { User, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.id;

  // TODO: Replace with useAgent(agentId) hook when agent detail API is available
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Profile</h2>
          <p className="text-muted-foreground">Agent ID: {agentId}</p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <User className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">Agent Details Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
            Detailed agent profile and performance analytics will be available once the agent detail API is implemented.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            For now, view the <Link href="/dashboard/agents" className="text-primary hover:underline">Agent Performance</Link> page for an overview.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
