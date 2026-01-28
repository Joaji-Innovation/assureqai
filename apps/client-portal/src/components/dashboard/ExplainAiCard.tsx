'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
// Removed direct AI flow import - using API route instead
// Define types locally if needed
export interface ExplainConceptInput {
  [key: string]: any;
}

export interface ExplainConceptOutput {
  [key: string]: any;
}
import { Loader2, Brain } from 'lucide-react';
import { getAuthHeaders } from '@/lib/authUtils';
import { aiApi } from '@/lib/api';

export function ExplainAiCard() {
  const [prompt, setPrompt] = useState<string>('Explain how AI works in a few words');
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Empty Prompt',
        description: 'Please enter a concept or question to explain.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setExplanation('');

    try {
      const result = await aiApi.explain(prompt);
      setExplanation(result.explanation);
    } catch (error: any) {
      console.error('Error explaining concept:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get explanation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-semibold">AI Explainer</CardTitle>
        </div>
        <CardDescription>Ask the AI to explain a concept or answer a question.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ai-prompt">What would you like to understand?</Label>
          <Input
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., What is quantum computing?"
            disabled={isLoading}
          />
        </div>
        {explanation && (
          <div className="p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold mb-2 text-foreground">Explanation:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Explanation...
            </>
          ) : (
            'Explain Concept'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
