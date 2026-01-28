
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
// Removed direct AI flow import - using API route instead
// Define types locally if needed
export interface AuditChatInput {
  [key: string]: any;
}

export interface AuditChatOutput {
  [key: string]: any;
}

export interface ChatMessage {
  [key: string]: any;
}
import { Loader2, Send, Bot, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAuthHeaders } from '@/lib/authUtils';
import { aiApi } from '@/lib/api';

interface AuditChatbotProps {
  auditSummary: string;
  auditTranscription: string;
  className?: string;
}

interface DisplayMessage extends ChatMessage {
  id: string;
}

export function AuditChatbot({ auditSummary, auditTranscription, className }: AuditChatbotProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    const newUserMessage: DisplayMessage = { id: Date.now().toString(), role: 'user', content: trimmedInput };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Use centralized API
      const response = await aiApi.chat(trimmedInput, {
         auditSummary,
         auditTranscription,
         chatHistory: messages.map(({role, content}) => ({role, content}))
      });
      
      const newAiMessage: DisplayMessage = { id: (Date.now() + 1).toString(), role: 'model', content: response.response };
      setMessages((prevMessages) => [...prevMessages, newAiMessage]);
    } catch (error: any) {
      console.error('Error in chat:', error);
      toast({
        title: 'Chatbot Error',
        description: error.message || 'Failed to get response from chatbot.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("shadow-lg w-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-semibold">Chat About This Audit</CardTitle>
        </div>
        <CardDescription>Ask follow-up questions about the call summary and transcription.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] w-full p-4 border rounded-md bg-muted/30" ref={scrollAreaRef}>
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No messages yet. Ask a question below!</p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "mb-3 flex items-start gap-3 rounded-lg p-3 text-sm max-w-[85%]",
                message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-background border'
              )}
            >
              {message.role === 'model' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
              {message.role === 'user' && <UserCircle className="h-5 w-5 text-primary-foreground flex-shrink-0 mt-0.5" />}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
           {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
             <div className="flex items-start gap-3 rounded-lg p-3 text-sm max-w-[85%] bg-background border">
                <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
             </div>
           )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask a question about the audit..."
            disabled={isLoading}
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading || !userInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
