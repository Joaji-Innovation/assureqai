'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Loader2,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '@/lib/api';

interface TicketMessage {
  _id: string;
  content: string;
  authorName: string;
  authorRole: string;
  isInternal: boolean;
  createdAt: string;
}

interface TicketDetail {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdByName: string;
  assignedToName?: string;
  createdAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  pending_customer: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
  closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/10 text-slate-500',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  critical: 'bg-red-500/10 text-red-500',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending_customer: 'Awaiting Reply',
  resolved: 'Resolved',
  closed: 'Closed',
};

const categoryLabels: Record<string, string> = {
  technical: 'Technical',
  billing: 'Billing',
  feature_request: 'Feature Request',
  bug_report: 'Bug Report',
  other: 'Other',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ticketId = params.id as string;

  const [replyContent, setReplyContent] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketApi.getById(ticketId) as Promise<TicketDetail>,
  });

  const addMessage = useMutation({
    mutationFn: (content: string) => ticketApi.addMessage(ticketId, content, false),
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });

  const handleSendReply = () => {
    if (!replyContent.trim()) return;
    addMessage.mutate(replyContent);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const isAdminRole = (role: string) => {
    return role === 'super_admin' || role === 'client_admin';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Ticket not found</h2>
        <Link href="/dashboard/support">
          <Button>Back to Tickets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/support">
          <Button variant="ghost" size="icon" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-muted-foreground">
              {ticket.ticketNumber}
            </span>
            <Badge className={statusColors[ticket.status]}>
              {getStatusIcon(ticket.status)}
              <span className="ml-1">{statusLabels[ticket.status]}</span>
            </Badge>
            <Badge className={priorityColors[ticket.priority]}>
              {ticket.priority}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
        </div>
      </div>

      {/* Ticket Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{categoryLabels[ticket.category]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-medium">{ticket.createdByName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              <p className="font-medium">{ticket.assignedToName || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Description</p>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No messages yet. Add a reply below.
            </p>
          ) : (
            ticket.messages.map((message) => (
              <div
                key={message._id}
                className={`flex gap-3 ${isAdminRole(message.authorRole) ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={isAdminRole(message.authorRole) ? 'bg-primary text-primary-foreground' : ''}>
                    {isAdminRole(message.authorRole) ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex-1 max-w-[80%] ${isAdminRole(message.authorRole)
                    ? 'bg-primary/10 rounded-lg p-4'
                    : 'bg-muted rounded-lg p-4'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{message.authorName}</span>
                    {isAdminRole(message.authorRole) && (
                      <Badge variant="secondary" className="text-xs">
                        Support
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}

          {/* Reply Input */}
          {ticket.status !== 'closed' && (
            <div className="pt-4 border-t">
              <Textarea
                placeholder="Type your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSendReply}
                  disabled={addMessage.isPending || !replyContent.trim()}
                  className="gap-2"
                >
                  {addMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Reply
                </Button>
              </div>
            </div>
          )}

          {ticket.status === 'closed' && (
            <div className="pt-4 border-t text-center text-muted-foreground">
              This ticket is closed. You cannot add more replies.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
