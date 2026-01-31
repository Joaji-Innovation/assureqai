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
  }): Promise<AuditResult & { transcript: string; transcriptionInOriginalLanguage: string; englishTranslation?: string; callSummary?: string; rootCauseAnalysis?: string }> {
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
        transcriptionInOriginalLanguage: request.transcript,
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

    // Check if large audio (>10MB) - use two-step approach for reliability
    const audioSizeBytes = audioBase64.length * 0.75;
    const isLargeAudio = audioSizeBytes > 10 * 1024 * 1024;

    try {
      if (isLargeAudio) {
        // =====================================================
        // TWO-STEP APPROACH FOR LARGE AUDIO FILES
        // Step 1: Transcribe audio only (focused, smaller output)
        // Step 2: Audit transcript (text only, no audio)
        // =====================================================

        this.logger.log(`Large audio detected (${(audioSizeBytes / 1024 / 1024).toFixed(2)}MB), using two-step approach`);

        // Step 1: Transcribe
        this.logger.log('Step 1: Transcribing audio...');
        const transcriptionResult = await this.transcribeWithGemini(audioBase64, mimeType, request.language);

        this.logger.log(`Transcription complete: ${transcriptionResult.transcript.length} chars, language: ${transcriptionResult.detectedLanguage}`);

        // Step 2: Audit the transcript
        this.logger.log('Step 2: Auditing transcript...');
        const auditResult = await this.auditCall({
          transcript: transcriptionResult.transcript,
          parameters: request.parameters,
          sopContent: request.sopContent,
          language: transcriptionResult.detectedLanguage || request.language || 'en',
        });

        // Calculate total processing time
        const processingDurationMs = Date.now() - startTime;
        this.logger.log(`Two-step audit completed in ${processingDurationMs}ms, score: ${auditResult.overallScore}`);

        // Return combined result
        return {
          ...auditResult,
          transcript: transcriptionResult.transcript,
          transcriptionInOriginalLanguage: transcriptionResult.transcript,
          englishTranslation: transcriptionResult.englishTranslation,
          callSummary: transcriptionResult.callSummary || auditResult.callSummary,
          rootCauseAnalysis: auditResult.callSummary,
          timing: {
            startTime: new Date(startTime).toISOString(),
            endTime: new Date().toISOString(),
            processingDurationMs,
          },
        };
      }

      // =====================================================
      // SINGLE-STEP APPROACH FOR SMALL AUDIO FILES (<10MB)
      // Combined transcription + audit in one call (faster)
      // =====================================================

      this.logger.log(`Small audio (${(audioSizeBytes / 1024 / 1024).toFixed(2)}MB), using single-step approach`);

      // Build the comprehensive prompt for combined transcription + audit
      const textPrompt = `You are an expert QA auditor for call centers. Analyze the attached audio call recording.

**Context:**
- Agent Name: ${request.agentName || 'Unknown'}
- Campaign: ${request.campaignName || 'N/A'}
- Call Language: ${request.language || 'Auto-detect'}
${request.sopContent ? `- SOP Reference: ${request.sopContent.substring(0, 500)}...` : ''}

**Audit Parameters (Name - Weight% - Type):**
${parametersDesc}

**Instructions:**
1. **Transcription**: Provide accurate transcription with speaker labels (Agent: / Customer:).
2. **PII Masking** - Keep names visible but mask these sensitive details:
   - Phone numbers → [xxx phone xxx]
   - Addresses → [xxx address xxx]
   - Email addresses → [xxx email xxx]
   - Credit/Debit card numbers → [xxx card number xxx]
   - Bank account numbers → [xxx account xxx]
   - Vehicle/Car registration → [xxx car number xxx]
   - Policy/Insurance numbers → [xxx policy number xxx]
   - Aadhaar/PAN/SSN/ID numbers → [xxx id number xxx]
   - Date of birth → [xxx dob xxx]
   - OTP/PIN codes → [xxx otp xxx]
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

      // Call Gemini with multimodal content (audio + text)
      const response = await this.callGeminiWithAudio(textPrompt, audioBase64, mimeType);

      // Parse the JSON response with robust error handling
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to parse JSON, with repair attempts for truncated responses
      let output: any;
      try {
        output = JSON.parse(jsonText);
      } catch (parseError: any) {
        this.logger.warn(`Initial JSON parse failed: ${parseError.message}. Attempting repair...`);

        // Try to repair truncated JSON
        const repairedJson = this.repairTruncatedJson(jsonText);
        try {
          output = JSON.parse(repairedJson);
          this.logger.log('JSON repair successful');
        } catch (repairError: any) {
          // Extract what we can from the partial response
          this.logger.warn(`JSON repair failed: ${repairError.message}. Extracting partial data...`);
          output = this.extractPartialData(jsonText, request.parameters);
        }
      }

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
        transcriptionInOriginalLanguage: output.transcriptionInOriginalLanguage || output.englishTranslation || '',
        englishTranslation: output.englishTranslation,
        rootCauseAnalysis: output.rootCauseAnalysis,
      };

    } catch (error: any) {
      this.logger.error(`Audio audit failed: ${error.message}`);
      throw new BadRequestException(`AI audit failed: ${error.message}`);
    }
  }

  /**
   * Step 1 of Two-Step Audio Audit: Transcribe audio only
   * Uses Gemini's multimodal capability but only asks for transcription
   * This produces a smaller, focused output that won't get truncated
   */
  private async transcribeWithGemini(
    audioBase64: string,
    mimeType: string,
    language?: string
  ): Promise<{
    transcript: string;
    englishTranslation: string;
    callSummary: string;
    identifiedAgentName: string;
    detectedLanguage: string;
  }> {
    const transcriptionPrompt = `You are an expert call center transcriptionist. Analyze the attached audio and provide ONLY transcription-related output.

**Task**: Transcribe this call recording accurately.

**Requirements**:
1. Use speaker labels: "Agent:" and "Customer:" (detect from context)
2. Include relevant non-verbal cues in [brackets], e.g., [pause], [sighing]
3. **PII Masking** - Keep names visible but mask these sensitive details:
   - Phone numbers → [xxx phone xxx]
   - Addresses → [xxx address xxx]
   - Email addresses → [xxx email xxx]
   - Credit/Debit card numbers → [xxx card number xxx]
   - Bank account numbers → [xxx account xxx]
   - Vehicle/Car registration → [xxx car number xxx]
   - Policy/Insurance numbers → [xxx policy number xxx]
   - Aadhaar/PAN/SSN/ID numbers → [xxx id number xxx]
   - Date of birth → [xxx dob xxx]
   - OTP/PIN codes → [xxx otp xxx]
4. Detect the language being spoken
5. Provide English translation if not already in English
6. Identify the agent's name if mentioned

**Language hint**: ${language || 'Auto-detect'}

**Respond ONLY with valid JSON:**
{
  "identifiedAgentName": "string (agent name if mentioned, else 'Unknown')",
  "detectedLanguage": "string (e.g., 'Hindi', 'English', 'Spanish')",
  "transcriptionInOriginalLanguage": "string (full transcript with speaker labels)",
  "englishTranslation": "string (same as transcript if already English)",
  "callSummary": "string (2-3 sentence summary of the call, max 300 chars)"
}

IMPORTANT: Focus ONLY on transcription. Do NOT score or evaluate content.`;

    const response = await this.callGeminiWithAudio(transcriptionPrompt, audioBase64, mimeType);

    // Parse the response
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(jsonText);
      return {
        transcript: parsed.transcriptionInOriginalLanguage || parsed.englishTranslation || '',
        englishTranslation: parsed.englishTranslation || parsed.transcriptionInOriginalLanguage || '',
        callSummary: parsed.callSummary || '',
        identifiedAgentName: parsed.identifiedAgentName || 'Unknown',
        detectedLanguage: parsed.detectedLanguage || language || 'en',
      };
    } catch (parseError: any) {
      this.logger.warn(`Transcription JSON parse failed: ${parseError.message}. Attempting repair...`);
      const repairedJson = this.repairTruncatedJson(jsonText);
      try {
        const parsed = JSON.parse(repairedJson);
        return {
          transcript: parsed.transcriptionInOriginalLanguage || parsed.englishTranslation || '',
          englishTranslation: parsed.englishTranslation || '',
          callSummary: parsed.callSummary || '',
          identifiedAgentName: parsed.identifiedAgentName || 'Unknown',
          detectedLanguage: parsed.detectedLanguage || language || 'en',
        };
      } catch {
        // Extract transcript via regex as fallback
        const transcriptMatch = jsonText.match(/"transcriptionInOriginalLanguage"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const translationMatch = jsonText.match(/"englishTranslation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        return {
          transcript: transcriptMatch ? transcriptMatch[1] : 'Transcription failed - please retry',
          englishTranslation: translationMatch ? translationMatch[1] : '',
          callSummary: 'Transcription partially completed',
          identifiedAgentName: 'Unknown',
          detectedLanguage: language || 'en',
        };
      }
    }
  }

  /**
   * Call Gemini API with audio content (multimodal)
   * Supports both inline data (for small files <10MB) and File API (for large files)
   */
  private async callGeminiWithAudio(prompt: string, audioBase64: string, mimeType: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Calculate audio size (base64 * 0.75 = actual bytes)
    const audioSizeBytes = audioBase64.length * 0.75;
    const SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB threshold
    const isLargeFile = audioSizeBytes > SIZE_THRESHOLD;

    let fileUri: string | null = null;
    let requestBody: any;

    try {
      if (isLargeFile) {
        // Use File API for large files
        this.logger.log(`Large audio detected (${(audioSizeBytes / 1024 / 1024).toFixed(2)}MB), using File API`);
        fileUri = await this.uploadToFileApi(audioBase64, mimeType);

        requestBody = {
          contents: [{
            parts: [
              { text: prompt },
              {
                file_data: {
                  mime_type: mimeType,
                  file_uri: fileUri,
                }
              }
            ]
          }],
          generationConfig: {
            maxOutputTokens: 65536, // Max for Gemini 2.0 Flash - supports full 1hr transcription
            temperature: 0.2,
            responseMimeType: 'application/json',
          }
        };
      } else {
        // Use inline data for small files (faster, no upload needed)
        this.logger.log(`Small audio (${(audioSizeBytes / 1024 / 1024).toFixed(2)}MB), using inline data`);

        requestBody = {
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
            maxOutputTokens: 65536, // Max output for full transcription
            temperature: 0.2,
            responseMimeType: 'application/json',
          }
        };
      }

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
    } finally {
      // Cleanup: Delete uploaded file if using File API
      if (fileUri) {
        this.deleteFromFileApi(fileUri).catch(err =>
          this.logger.warn(`Failed to cleanup file: ${err.message}`)
        );
      }
    }
  }

  /**
   * Upload audio to Google File API for large files
   * Returns the file URI for referencing in API calls
   */
  private async uploadToFileApi(audioBase64: string, mimeType: string): Promise<string> {
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.apiKey}`;

    // Convert base64 to binary
    const binaryData = Buffer.from(audioBase64, 'base64');

    // Determine file extension from mime type
    const ext = mimeType.split('/')[1] || 'wav';
    const displayName = `audit-call-${Date.now()}.${ext}`;

    try {
      // Step 1: Start resumable upload
      const startResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': binaryData.length.toString(),
          'X-Goog-Upload-Header-Content-Type': mimeType,
        },
        body: JSON.stringify({
          file: { displayName }
        }),
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Failed to start upload: ${startResponse.status} - ${errorText}`);
      }

      const uploadUri = startResponse.headers.get('X-Goog-Upload-URL');
      if (!uploadUri) {
        throw new Error('No upload URL received from File API');
      }

      // Step 2: Upload the file content
      const uploadResponse = await fetch(uploadUri, {
        method: 'POST',
        headers: {
          'Content-Length': binaryData.length.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize',
        },
        body: binaryData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload file: ${uploadResponse.status} - ${errorText}`);
      }

      const fileData = await uploadResponse.json();
      const fileUri = fileData.file?.uri;

      if (!fileUri) {
        throw new Error('No file URI in upload response');
      }

      this.logger.log(`File uploaded successfully: ${fileUri}`);

      // Wait for file to be processed (ACTIVE state)
      await this.waitForFileProcessing(fileData.file.name);

      return fileUri;
    } catch (error: any) {
      this.logger.error(`File API upload failed: ${error.message}`);
      throw new BadRequestException(`Failed to upload audio file: ${error.message}`);
    }
  }

  /**
   * Wait for uploaded file to be processed by Google
   */
  private async waitForFileProcessing(fileName: string): Promise<void> {
    const maxWaitMs = 60000; // Max 1 minute wait
    const pollIntervalMs = 2000; // Poll every 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${this.apiKey}`
        );

        if (response.ok) {
          const fileInfo = await response.json();
          if (fileInfo.state === 'ACTIVE') {
            this.logger.log(`File ${fileName} is ready for processing`);
            return;
          } else if (fileInfo.state === 'FAILED') {
            throw new Error(`File processing failed: ${fileInfo.error?.message || 'Unknown error'}`);
          }
        }
      } catch (error: any) {
        // Ignore errors during polling, just continue
      }

      await new Promise(r => setTimeout(r, pollIntervalMs));
    }

    // If we timeout, proceed anyway - the file might still work
    this.logger.warn(`File processing timeout for ${fileName}, proceeding anyway`);
  }

  /**
   * Delete file from Google File API (cleanup)
   */
  private async deleteFromFileApi(fileUri: string): Promise<void> {
    try {
      // Extract file name from URI
      const fileName = fileUri.split('/').pop();
      if (!fileName) return;

      const deleteUrl = `https://generativelanguage.googleapis.com/v1beta/files/${fileName}?key=${this.apiKey}`;

      const response = await fetch(deleteUrl, { method: 'DELETE' });

      if (response.ok) {
        this.logger.log(`Cleaned up uploaded file: ${fileName}`);
      }
    } catch (error: any) {
      // Non-critical - just log
      this.logger.warn(`File cleanup failed: ${error.message}`);
    }
  }

  /**
   * Attempt to repair truncated JSON responses
   * Common issues: unclosed strings, missing brackets, partial arrays
   */
  private repairTruncatedJson(jsonText: string): string {
    let repaired = jsonText;

    // Count brackets to find imbalance
    let openBraces = 0, closeBraces = 0;
    let openBrackets = 0, closeBrackets = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
        if (char === '[') openBrackets++;
        if (char === ']') closeBrackets++;
      }
    }

    // If we ended inside a string, close it
    if (inString) {
      // Find the last quote and add a closing one
      repaired = repaired + '"';
    }

    // Close any unclosed brackets/braces
    while (openBrackets > closeBrackets) {
      repaired += ']';
      closeBrackets++;
    }

    while (openBraces > closeBraces) {
      repaired += '}';
      closeBraces++;
    }

    // Try to fix common truncation patterns
    // Remove trailing comma before closing bracket
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    return repaired;
  }

  /**
   * Extract partial data from malformed JSON when repair fails
   * Creates a minimal valid result with whatever data can be recovered
   */
  private extractPartialData(jsonText: string, parameters: any[]): any {
    const result: any = {
      identifiedAgentName: 'Unknown',
      transcriptionInOriginalLanguage: 'Transcription unavailable - response was truncated',
      englishTranslation: 'Translation unavailable',
      callSummary: 'Audit partially completed - response was truncated',
      auditResults: [],
      overallScore: 0,
      sentiment: { overall: 'neutral', customerScore: 0, agentScore: 0, escalationRisk: 'unknown' }
    };

    // Try to extract agent name
    const agentMatch = jsonText.match(/"identifiedAgentName"\s*:\s*"([^"]+)"/);
    if (agentMatch) result.identifiedAgentName = agentMatch[1];

    // Try to extract transcript
    const transcriptMatch = jsonText.match(/"transcriptionInOriginalLanguage"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (transcriptMatch) result.transcriptionInOriginalLanguage = transcriptMatch[1];

    // Try to extract English translation
    const translationMatch = jsonText.match(/"englishTranslation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (translationMatch) result.englishTranslation = translationMatch[1];

    // Try to extract call summary
    const summaryMatch = jsonText.match(/"callSummary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (summaryMatch) result.callSummary = summaryMatch[1];

    // Try to extract overall score
    const scoreMatch = jsonText.match(/"overallScore"\s*:\s*(\d+(?:\.\d+)?)/);
    if (scoreMatch) result.overallScore = parseFloat(scoreMatch[1]);

    // Try to extract individual audit results using regex
    const auditResultsSection = jsonText.match(/"auditResults"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
    if (auditResultsSection) {
      const resultPattern = /"parameterName"\s*:\s*"([^"]+)".*?"score"\s*:\s*(\d+)/g;
      let match;
      while ((match = resultPattern.exec(auditResultsSection[1])) !== null) {
        result.auditResults.push({
          parameterId: match[1],
          parameterName: match[1],
          score: parseInt(match[2], 10),
          weight: 10,
          type: 'Non-Fatal',
          comments: 'Extracted from partial response',
          confidence: 50,
        });
      }
    }

    // If no audit results extracted, create placeholder results from input parameters
    if (result.auditResults.length === 0 && parameters) {
      result.auditResults = parameters.map((p: any) => ({
        parameterId: p.id || p.name,
        parameterName: p.name,
        score: 0,
        weight: p.weight || 10,
        type: p.type || 'Non-Fatal',
        comments: 'Could not score - response was truncated',
        confidence: 0,
      }));
    }

    this.logger.log(`Extracted partial data: ${result.auditResults.length} results, score: ${result.overallScore}`);
    return result;
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
              maxOutputTokens: 65536, // Max for Gemini 2.0 Flash - supports 1hr+ calls
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
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to find JSON object if wrapped in other text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    if (!jsonStr || jsonStr.length < 10) {
      this.logger.error('Empty or invalid AI response');
      throw new Error('Failed to parse AI response: empty response');
    }

    // Try to parse JSON with repair fallback
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError: any) {
      this.logger.warn(`Initial audit JSON parse failed: ${parseError.message}. Attempting repair...`);

      // Try to repair truncated JSON
      const repairedJson = this.repairTruncatedJson(jsonStr);
      try {
        parsed = JSON.parse(repairedJson);
        this.logger.log('Audit JSON repair successful');
      } catch (repairError: any) {
        this.logger.warn(`Audit JSON repair failed: ${repairError.message}. Extracting partial data...`);
        parsed = this.extractPartialData(jsonStr, parameters);
      }
    }

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
