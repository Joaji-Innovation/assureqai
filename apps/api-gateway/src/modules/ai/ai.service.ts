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
   * Complete audio audit flow - sends audio directly to Gemini for transcription + audit
   * This matches the agent-ai implementation where audio is processed in a single call.
   */
  async auditAudio(request: {
    audioDataUri?: string; // Base64 data URI: data:audio/mp3;base64,...
    audioUrl?: string;     // URL to audio file (will be fetched)
    transcript?: string;   // Optional: skip audio processing if provided
    parameters: AuditRequest['parameters'];
    sopContent?: string;
    language?: string;
    agentName?: string;
    callId?: string;
    campaignName?: string;
  }): Promise<AuditResult & { transcript: string; englishTranslation?: string; callSummary?: string; rootCauseAnalysis?: string }> {
    if (!this.apiKey) {
      throw new BadRequestException('AI service not configured. Please set GEMINI_API_KEY.');
    }

    const startTime = Date.now();

    // Validate parameters
    if (!request.parameters || request.parameters.length === 0) {
      throw new BadRequestException('QA parameters are required for audit. Please configure parameters first.');
    }

    // If transcript is provided, use the existing auditCall method
    if (request.transcript) {
      this.logger.log('Using provided transcript for audit');
      const result = await this.auditCall({
        transcript: request.transcript,
        parameters: request.parameters,
        sopContent: request.sopContent,
        language: request.language || 'en',
      });
      return {
        ...result,
        transcript: request.transcript,
      };
    }

    // Process audio data URI or URL
    let audioBase64 = '';
    let mimeType = 'audio/wav';

    if (request.audioDataUri && request.audioDataUri.startsWith('data:')) {
      // Parse data URI
      const commaIdx = request.audioDataUri.indexOf(',');
      const semicolonIdx = request.audioDataUri.indexOf(';');
      if (commaIdx > -1 && semicolonIdx > -1 && semicolonIdx < commaIdx) {
        mimeType = request.audioDataUri.substring(5, semicolonIdx);
        audioBase64 = request.audioDataUri.substring(commaIdx + 1);
      }
    } else if (request.audioUrl) {
      // Fetch audio from URL
      this.logger.log(`Fetching audio from URL: ${request.audioUrl}`);
      try {
        const response = await fetch(request.audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type') || 'audio/wav';
        mimeType = contentType.split(';')[0];
        const buffer = await response.arrayBuffer();
        audioBase64 = Buffer.from(buffer).toString('base64');
      } catch (error: any) {
        throw new BadRequestException(`Failed to fetch audio from URL: ${error.message}`);
      }
    } else {
      throw new BadRequestException('Either audioDataUri, audioUrl, or transcript must be provided');
    }

    // Build parameters description for the prompt
    const parametersDesc = request.parameters.map((param, idx) =>
      `  ${idx + 1}. "${param.name}" - Weight: ${param.weight}%, Type: ${param.type || 'Non-Fatal'}`
    ).join('\n');

    // Check if large audio (>10MB)
    const isLargeAudio = audioBase64.length * 0.75 > 10 * 1024 * 1024;

    // Build the comprehensive prompt (matching agent-ai style)
    const textPrompt = `You are an expert QA auditor for call centers. Analyze the attached audio call recording.

**Context:**
- Agent Name: ${request.agentName || 'Unknown'}
- Campaign: ${request.campaignName || 'N/A'}
- Call Language: ${request.language || 'Auto-detect'}
${request.sopContent ? `- SOP Reference: ${request.sopContent.substring(0, 500)}...` : ''}

**Audit Parameters (Name - Weight% - Type):**
${parametersDesc}

**Instructions:**
1. **Transcription**: ${isLargeAudio
        ? 'For this long call, provide a condensed transcription capturing key moments.'
        : 'Provide accurate transcription with speaker labels (Agent: / Customer:)'}.
2. **Privacy Protection**: Mask customer PII: phone → [PHONE MASKED], address → [ADDRESS MASKED], etc.
3. **Scoring** (0-100 scale):
   - 100: Perfect compliance
   - 80-99: Good with minor issues
   - 50-79: Needs improvement
   - 1-49: Poor performance
   - 0: Complete failure
4. **Fatal Parameters**: Score <50 on Fatal type = overall score becomes 0 (ZTP)
5. **Provide scoring for EVERY parameter listed above**

**Respond ONLY with valid JSON:**
{
  "identifiedAgentName": "string",
  "transcriptionInOriginalLanguage": "string with speaker labels",
  "englishTranslation": "string (required, same as original if already English)",
  "callSummary": "string (max 500 chars)",
  "rootCauseAnalysis": "string (if issues found)",
  "auditResults": [
    {
      "parameterId": "string",
      "parameterName": "exact name from input",
      "score": number (0-100),
      "weight": number,
      "type": "Fatal" | "Non-Fatal" | "ZTP",
      "comments": "string (max 100 chars)",
      "confidence": number (0-100)
    }
  ],
  "overallScore": number (0-100, sum of weighted scores),
  "sentiment": {
    "overall": "positive" | "neutral" | "negative",
    "customerScore": number (-1 to 1),
    "agentScore": number (-1 to 1),
    "escalationRisk": "low" | "medium" | "high"
  }
}

CRITICAL: Score ALL ${request.parameters.length} parameters. Use exact parameter names.`;

    try {
      // Call Gemini with multimodal content (audio + text)
      const response = await this.callGeminiWithAudio(textPrompt, audioBase64, mimeType);

      // Parse the JSON response
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const output = JSON.parse(jsonText);

      // Calculate processing time
      const processingDurationMs = Date.now() - startTime;

      // Apply ZTP (Zero Tolerance Policy) if Fatal parameter failed
      let finalOverallScore = output.overallScore || 0;
      if (output.auditResults && Array.isArray(output.auditResults)) {
        const hasFatalFailure = output.auditResults.some(
          (r: any) => r.type === 'Fatal' && r.score < 50
        );
        if (hasFatalFailure) {
          this.logger.warn('ZTP Applied: Fatal parameter scored below 50%');
          finalOverallScore = 0;
        }
      }

      // Transform to AuditResult format
      const auditResults = (output.auditResults || []).map((r: any) => ({
        parameterId: r.parameterId || r.parameterName,
        parameterName: r.parameterName || r.parameter || 'Unknown',
        score: r.score || 0,
        weight: r.weight || 0,
        type: r.type || 'Non-Fatal',
        comments: r.comments || '',
        confidence: r.confidence || 80,
        evidence: r.evidence || [],
      }));

      this.logger.log(
        `Audio audit completed in ${processingDurationMs}ms, score: ${finalOverallScore}`
      );

      return {
        callSummary: output.callSummary || 'Audit completed',
        auditResults,
        overallScore: finalOverallScore,
        overallConfidence: 85,
        sentiment: output.sentiment || { overall: 'neutral', customerScore: 0, agentScore: 0, escalationRisk: 'low' },
        metrics: output.metrics || {},
        compliance: output.compliance || { keywordsDetected: [], violations: [], complianceScore: 100 },
        timing: {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString(),
          processingDurationMs,
        },
        tokenUsage: output.tokenUsage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        coaching: output.coaching || {
          strengths: [],
          improvements: [],
          suggestedActions: [],
        },
        transcript: output.transcriptionInOriginalLanguage || output.englishTranslation || '',
        englishTranslation: output.englishTranslation,
        rootCauseAnalysis: output.rootCauseAnalysis,
      };

    } catch (error: any) {
      this.logger.error(`Audio audit failed: ${error.message}`);
      throw new BadRequestException(`AI audit failed: ${error.message}`);
    }
  }

  /**
   * Call Gemini API with audio content (multimodal)
   */
  private async callGeminiWithAudio(prompt: string, audioBase64: string, mimeType: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: audioBase64,
            }
          }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 64000,
        temperature: 0.2,
        responseMimeType: 'application/json',
      }
    };

    // Retry with exponential backoff
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error('No response content from Gemini');
        }

        return text;
      } catch (error: any) {
        this.logger.warn(`Gemini multimodal call attempt ${attempt} failed: ${error.message}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        } else {
          throw error;
        }
      }
    }

    throw new Error('Failed to call Gemini API after retries');
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
