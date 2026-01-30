/**
 * AI Service
 * Google GenKit (Gemini) integration for call auditing
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LIMITS } from '@assureqai/common';

export interface AuditRequest {
  transcript: string;
  parameters: {
    id: string;
    name: string;
    weight: number;
    type: 'Fatal' | 'Non-Fatal' | 'ZTP';
    subParameters?: {
      id: string;
      name: string;
      weight: number;
    }[];
  }[];
  sopContent?: string;
  language?: string;
}

// Evidence citation from transcript
export interface EvidenceCitation {
  text: string;           // Quoted transcript excerpt
  lineNumber?: number;    // Line number in transcript
  startChar?: number;     // Character position start
  endChar?: number;       // Character position end
}

// Audit timing metrics
export interface AuditTiming {
  startTime: string;      // ISO timestamp when audit started
  endTime: string;        // ISO timestamp when audit completed
  processingDurationMs: number;  // Total AI processing time
  promptTokensPerSecond?: number; // Processing speed
}

export interface AuditResult {
  callSummary: string;
  auditResults: {
    parameterId: string;
    parameterName: string;
    score: number;
    weight: number;
    type: string;
    comments: string;
    confidence: number;   // NEW: 0-100 confidence score
    evidence: EvidenceCitation[];  // NEW: transcript citations
    subResults?: {
      subParameterId: string;
      subParameterName: string;
      score: number;
      weight: number;
      comments: string;
      confidence?: number;
      evidence?: EvidenceCitation[];
    }[];
  }[];
  overallScore: number;
  overallConfidence: number;  // NEW: overall confidence level
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    customerScore: number;
    agentScore: number;
    escalationRisk: 'low' | 'medium' | 'high';
    predictedCSAT: number;
    emotionalMoments: {
      timestamp: string;
      emotion: 'frustration' | 'satisfaction' | 'anger' | 'empathy' | 'confusion';
      speaker: 'customer' | 'agent';
      text: string;
    }[];
  };
  metrics: {
    talkToListenRatio: number;
    silencePercentage: number;
    longestSilence: number;
    averageResponseTime: number;
    interruptionCount: number;
  };
  compliance: {
    keywordsDetected: string[];
    violations: { rule: string; description: string; severity: string }[];
    complianceScore: number;
  };
  coaching: {
    strengths: string[];
    improvements: string[];
    suggestedActions: string[];
  };
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  timing: AuditTiming;  // NEW: timing metrics
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    // Default to gemini-2.0-flash for best speed/cost balance, configurable via env
    this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';

    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured - AI features disabled');
    } else {
      this.logger.log(`AI service initialized with model: ${this.model}`);
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Perform AI-powered call audit
   */
  async auditCall(request: AuditRequest): Promise<AuditResult> {
    if (!this.apiKey) {
      throw new BadRequestException('AI service not configured');
    }

    const startTime = new Date();

    try {
      // Build the prompt
      const prompt = this.buildAuditPrompt(request);

      // Call Gemini API
      const response = await this.callGemini(prompt);

      // Parse the response with timing
      const result = this.parseAuditResponse(response, request.parameters, startTime);

      this.logger.log(
        `Audit completed in ${result.timing.processingDurationMs}ms, score: ${result.overallScore}, confidence: ${result.overallConfidence}%`,
      );

      return result;
    } catch (error) {
      this.logger.error(`AI audit failed: ${error}`);
      throw new BadRequestException('AI audit failed');
    }
  }

  /**
   * Chat with AI about an audit
   */
  async chat(message: string, context?: any): Promise<string> {
    if (!this.apiKey) {
      throw new BadRequestException('AI service not configured');
    }

    const contextStr = context ? `\nContext:\n${JSON.stringify(context, null, 2)}` : '';
    const prompt = `You are an AI assistant for Call Center Quality Assurance.
${contextStr}

User: ${message}
Assistant:`;

    return this.callGemini(prompt);
  }

  /**
   * Explain a QA concept
   */
  async explainConcept(concept: string): Promise<string> {
    if (!this.apiKey) {
      throw new BadRequestException('AI service not configured');
    }

    const prompt = `Explain the following Call Center Quality Assurance concept clearly and concisely for a QA Analyst:
"${concept}"

Explanation:`;

    return this.callGemini(prompt);
  }

  /**
   * Transcribe audio (placeholder for future integration)
   */
  async transcribeAudio(audioUrl: string): Promise<{ transcript: string; language: string }> {
    // TODO: Integrate with Google Speech-to-Text or similar
    // For now, return a mock transcript if in dev mode
    if (process.env.NODE_ENV !== 'production') {
      return {
        transcript: "This is a simulated transcript for development purposes. The actual transcription service is not yet connected.",
        language: "en-US"
      };
    }
    throw new BadRequestException('Audio transcription not yet implemented');
  }

  /**
   * Build the audit prompt
   */
  private buildAuditPrompt(request: AuditRequest): string {
    const parametersJson = JSON.stringify(request.parameters, null, 2);

    return `You are an expert call center QA auditor and sentiment analyst. Analyze the following call transcript comprehensively.

## Parameters to Evaluate:
${parametersJson}

## SOP/Guidelines:
${request.sopContent || 'Standard call center best practices apply.'}

## Call Transcript:
${request.transcript}

## Instructions:
1. Score each parameter from 0-100 based on the transcript
2. For Fatal parameters, any violation results in 0 score
3. For ZTP (Zero Tolerance Policy), any violation is critical
4. Provide a brief comment for each parameter
5. **IMPORTANT: For each parameter, provide a confidence score (0-100) indicating how certain you are about your assessment**
6. **IMPORTANT: For each parameter, provide evidence - quote 1-3 specific excerpts from the transcript that support your score**
7. Calculate overall weighted score
8. Analyze sentiment for BOTH customer and agent separately (-1 to 1 scale)
9. Identify emotional moments with timestamps (e.g., "0:45", "2:30")
10. Calculate talk-to-listen ratio (agent speaking percentage)
11. Detect silence percentage and longest pause
12. Count interruptions
13. Check for compliance violations and keywords
14. Identify agent strengths, areas for improvement, and coaching actions

Respond ONLY with valid JSON in this exact format:
{
  "callSummary": "Brief 2-3 sentence summary of the call",
  "auditResults": [
    {
      "parameterId": "param_id",
      "parameterName": "Parameter Name",
      "score": 85,
      "weight": 10,
      "type": "Non-Fatal",
      "comments": "Brief explanation of the score",
      "confidence": 92,
      "evidence": [
        {
          "text": "Exact quote from transcript supporting this score",
          "lineNumber": 5
        }
      ]
    }
  ],
  "overallScore": 82,
  "sentiment": {
    "overall": "positive",
    "customerScore": 0.7,
    "agentScore": 0.8,
    "escalationRisk": "low",
    "predictedCSAT": 4.2,
    "emotionalMoments": [
      {
        "timestamp": "1:23",
        "emotion": "frustration",
        "speaker": "customer",
        "text": "I've been waiting for 20 minutes!"
      }
    ]
  },
  "metrics": {
    "talkToListenRatio": 55,
    "silencePercentage": 8,
    "longestSilence": 12,
    "averageResponseTime": 2.5,
    "interruptionCount": 2
  },
  "compliance": {
    "keywordsDetected": ["verified identity", "thanked customer"],
    "violations": [],
    "complianceScore": 100
  },
  "coaching": {
    "strengths": ["Active listening", "Clear explanations"],
    "improvements": ["Reduce hold time", "Offer alternatives sooner"],
    "suggestedActions": ["Review empathy training module", "Practice objection handling"]
  }
}`;
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callGemini(prompt: string, retries = LIMITS.MAX_RETRIES): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent?key=${this.apiKey}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (error) {
        this.logger.warn(`Gemini call attempt ${attempt} failed: ${error}`);
        if (attempt === retries) {
          throw error;
        }
        // Exponential backoff
        await this.sleep(LIMITS.RETRY_DELAY_MS * Math.pow(LIMITS.RETRY_BACKOFF_MULTIPLIER, attempt - 1));
      }
    }

    throw new Error('All retry attempts failed');
  }

  /**
   * Parse AI response into structured result
   */
  private parseAuditResponse(
    response: string,
    parameters: AuditRequest['parameters'],
    startTime: Date
  ): AuditResult {
    const endTime = new Date();
    const processingDurationMs = endTime.getTime() - startTime.getTime();

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
      response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // Process audit results to ensure confidence and evidence fields
    const auditResults = (parsed.auditResults || []).map((result: any) => ({
      parameterId: result.parameterId || '',
      parameterName: result.parameterName || '',
      score: result.score ?? 0,
      weight: result.weight ?? 1,
      type: result.type || 'Non-Fatal',
      comments: result.comments || '',
      confidence: result.confidence ?? 80, // Default 80% if not provided
      evidence: result.evidence || [],     // Empty array if not provided
      subResults: result.subResults?.map((sub: any) => ({
        subParameterId: sub.subParameterId || '',
        subParameterName: sub.subParameterName || '',
        score: sub.score ?? 0,
        weight: sub.weight ?? 1,
        comments: sub.comments || '',
        confidence: sub.confidence ?? 80,
        evidence: sub.evidence || [],
      })) || [],
    }));

    // Calculate overall confidence as average of parameter confidences
    const confidences = auditResults.map((r: any) => r.confidence);
    const overallConfidence = confidences.length > 0
      ? Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length)
      : 80;

    // Ensure all required fields exist with defaults
    return {
      callSummary: parsed.callSummary || 'Unable to summarize',
      auditResults,
      overallScore: parsed.overallScore || 0,
      overallConfidence,
      sentiment: {
        overall: parsed.sentiment?.overall || 'neutral',
        customerScore: parsed.sentiment?.customerScore || 0,
        agentScore: parsed.sentiment?.agentScore || 0,
        escalationRisk: parsed.sentiment?.escalationRisk || 'low',
        predictedCSAT: parsed.sentiment?.predictedCSAT || 3,
        emotionalMoments: parsed.sentiment?.emotionalMoments || [],
      },
      metrics: {
        talkToListenRatio: parsed.metrics?.talkToListenRatio || 50,
        silencePercentage: parsed.metrics?.silencePercentage || 5,
        longestSilence: parsed.metrics?.longestSilence || 0,
        averageResponseTime: parsed.metrics?.averageResponseTime || 2,
        interruptionCount: parsed.metrics?.interruptionCount || 0,
      },
      compliance: parsed.compliance || {
        keywordsDetected: [],
        violations: [],
        complianceScore: 100,
      },
      coaching: {
        strengths: parsed.coaching?.strengths || [],
        improvements: parsed.coaching?.improvements || [],
        suggestedActions: parsed.coaching?.suggestedActions || [],
      },
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
      timing: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        processingDurationMs,
        promptTokensPerSecond: 0, // Will be calculated if token count is available
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
