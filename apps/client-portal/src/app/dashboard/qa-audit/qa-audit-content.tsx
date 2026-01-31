"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Brain, Save, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Removed direct AI flow imports - using API routes instead
// Define types locally if needed
export interface QaAuditInput {
  [key: string]: any;
}

export interface QaAuditOutput {
  [key: string]: any;
}

import type { SavedAuditItem } from "@/types/audit";
import type {
  QAParameter as QAParameterType,
  Parameter as ParameterGroup,
} from "@/types/qa-parameter";
import type { SOP as SOPType } from "@/types/sop";
import type { SOP, Audit } from "@/lib/api";
import { authApi, qaParameterApi, auditApi, aiApi, sopApi, type AuditResult, type QAParameter } from "@/lib/api";

import {
  AudioUploadDropzone,
  type AudioUploadDropzoneRef,
} from "@/components/dashboard/AudioUploadDropzone";
import { needsAudioConversion } from "@/lib/audioConverter";
import { AuditChatbot } from "@/components/dashboard/AuditChatbot";

import { getAuthHeaders } from "@/lib/authUtils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Removed direct service imports - using API routes instead
// Removed localStorage constants - now using database operations

const DEFAULT_AUDIT_PARAMETERS: ParameterGroup[] = [
  {
    id: "default_group_1",
    name: "Greeting and Professionalism",
    subParameters: [
      {
        id: "default_sub_1",
        name: "Agent used standard greeting",
        weight: 10,
        type: "Non-Fatal",
      },
      {
        id: "default_sub_2",
        name: "Agent was professional and courteous",
        weight: 10,
        type: "Non-Fatal",
      },
    ],
  },
  {
    id: "default_group_2",
    name: "Problem Identification",
    subParameters: [
      {
        id: "default_sub_3",
        name: "Agent actively listened",
        weight: 20,
        type: "Non-Fatal",
      },
      {
        id: "default_sub_4",
        name: "Agent correctly identified the issue",
        weight: 25,
        type: "Non-Fatal",
      },
    ],
  },
  {
    id: "default_group_3",
    name: "Resolution",
    subParameters: [
      {
        id: "default_sub_5",
        name: "Agent provided correct solution",
        weight: 20,
        type: "Fatal",
      },
      {
        id: "default_sub_6",
        name: "Agent offered further assistance",
        weight: 15,
        type: "Non-Fatal",
      },
    ],
  },
];

const DEFAULT_CALL_LANGUAGE = "Hindi";

// Helper function to convert QAParameter (API) to QAParameterType (Frontend)
function convertQAParameterDocumentToQAParameter(
  doc: QAParameter
): QAParameterType {
  const lastModified = doc.updatedAt
    ? new Date(doc.updatedAt).toISOString()
    : new Date().toISOString();

  return {
    ...doc,
    id: doc._id,
    lastModified,
  };
}

// Helper function to convert SOPDocument to SOP
function convertSOPDocumentToSOP(doc: SOP): SOPType {
  const lastModified = doc.updatedAt
    ? new Date(doc.updatedAt).toISOString()
    : new Date().toISOString();

  return {
    id: doc._id,
    title: doc.title || doc.name,
    content: doc.content || "",
    category: "General", // Default value
    version: doc.version || "1.0",
    lastModified,
    status: (doc.status as any) || "Published",
  };
}

// Helper function to convert AuditDocument to SavedAuditItem
function convertAuditDocumentToSavedAuditItem(
  doc: Audit
): SavedAuditItem {
  const auditDate = doc.createdAt
    ? new Date(doc.createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: doc._id || doc.id || "",
    auditDate,
    agentName: doc.agentName,
    agentUserId: doc.agentName, // Using agentName as fallback for agentUserId
    campaignName: doc.campaignName,
    overallScore: doc.overallScore,
    auditData: {
      agentUserId: doc.agentName,
      campaignName: doc.campaignName,
      identifiedAgentName: doc.agentName,
      transcriptionInOriginalLanguage: doc.transcript || "",
      englishTranslation: doc.englishTranslation || "",
      callSummary: doc.callSummary || `Audit for ${doc.agentName}`,
      auditResults: doc.auditResults.map((result: AuditResult) => ({
        parameter: result.parameterName,
        score: result.score,
        weightedScore: result.maxScore,
        comments: result.comments || "",
        type: result.type,
        confidence: result.confidence,
        evidence: result.evidence?.map((e: any) => e.text).join('\n') || "",
      })),
      overallScore: doc.overallScore,
      overallConfidence: doc.overallConfidence,
      summary: `Overall score: ${doc.overallScore}/${doc.maxPossibleScore}`,
      tokenUsage: doc.tokenUsage,
      auditDurationMs: doc.auditDurationMs,
    },
    auditType: doc.auditType,
  };
}

// Helper function to convert SavedAuditItem to createAudit format
// COPIED FROM WORKING agent-ai IMPLEMENTATION
function convertSavedAuditItemToCreateAuditFormatV2(
  savedAudit: SavedAuditItem,
  auditedBy: string
) {
  // Extract auditResults - they can be directly on savedAudit or nested in auditData
  const auditResults =
    (savedAudit as any).auditResults ||
    savedAudit.auditData?.auditResults ||
    [];

  // Extract transcript - can be directly on savedAudit or nested in auditData
  const transcript =
    (savedAudit as any).transcript ||
    savedAudit.auditData?.transcriptionInOriginalLanguage ||
    "";

  // Extract English translation
  const englishTranslation =
    (savedAudit as any).englishTranslation ||
    savedAudit.auditData?.englishTranslation ||
    "";

  // Extract token usage and duration
  const tokenUsage = savedAudit.auditData?.tokenUsage;
  const auditDurationMs = savedAudit.auditData?.auditDurationMs;

  return {
    // Required fields for the API
    agentName: savedAudit.agentName,
    agentUserId: savedAudit.agentUserId || savedAudit.auditData?.agentUserId,
    interactionId: (savedAudit as any).callId || savedAudit.id,

    // Optional fields
    auditName: `Audit for ${savedAudit.agentName}`,
    customerName: (savedAudit as any).customerName || "Unknown Customer",
    campaignName: savedAudit.campaignName, // IMPORTANT: Backend expects this for Campaign Performance chart
    qaParameterSetId: savedAudit.campaignName || "default",
    qaParameterSetName: savedAudit.campaignName || "Unknown Parameter Set",
    callTranscript: transcript,
    englishTranslation: englishTranslation,
    callSummary: savedAudit.auditData?.callSummary || `Audit for ${savedAudit.agentName}`,
    overallScore: savedAudit.overallScore,
    auditType: savedAudit.auditType,
    auditorId: auditedBy,
    auditorName: "AI Auditor",
    auditDate: new Date(savedAudit.auditDate).toISOString(),

    // AI audit metadata
    tokenUsage: tokenUsage,
    auditDurationMs: auditDurationMs,

    // Map auditResults to parameters with subParameters structure
    // THIS IS THE EXACT STRUCTURE EXPECTED BY THE BACKEND
    parameters:
      auditResults && Array.isArray(auditResults)
        ? [
          {
            id: "audit-results",
            name: "Audit Results",
            subParameters: auditResults.map((result: any, index: number) => ({
              id: result.parameterId || result.id || `param-${index}`,
              name:
                result.parameter ||
                result.parameterName ||
                result.name ||
                "Unknown",
              weight:
                result.weightedScore ||
                result.maxScore ||
                result.weight ||
                100,
              type: result.type || "Non-Fatal",
              score: result.score || 0,
              comments: result.comments || "",
              confidence: result.confidence,
              evidence: result.evidence,
            })),
          },
        ]
        : [],
  };
}

export default function QaAuditContent() {
  const { toast } = useToast();
  const [qaAgentUserId, setQaAgentUserId] = useState<string>("");
  const [qaCampaignName, setQaCampaignName] = useState<string>("");
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [originalAudioDataUri, setOriginalAudioDataUri] = useState<
    string | null
  >(null);
  const [previewAudioSrc, setPreviewAudioSrc] = useState<string | null>(null);
  const [audioKey, setAudioKey] = useState<string>(Date.now().toString());
  const audioInputRef = useRef<AudioUploadDropzoneRef>(null);
  const [qaCallLanguage, setQaCallLanguage] = useState<string>(
    DEFAULT_CALL_LANGUAGE
  );
  const [qaTranscriptionLanguage, setQaTranscriptionLanguage] =
    useState<string>("");
  const [qaAuditParameters, setQaAuditParameters] = useState<ParameterGroup[]>(
    DEFAULT_AUDIT_PARAMETERS
  );
  const [availableQaParameterSets, setAvailableQaParameterSets] = useState<
    QAParameterType[]
  >([]);
  const [selectedQaParameterSetId, setSelectedQaParameterSetId] =
    useState<string>("default_params_set");
  const [availableSops, setAvailableSops] = useState<SOPType[]>([]);
  const [selectedSopId, setSelectedSopId] =
    useState<string>("default_params_sop");
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditStartTime, setAuditStartTime] = useState<Date | null>(null);
  const [auditEndTime, setAuditEndTime] = useState<Date | null>(null);
  const [auditResult, setAuditResult] = useState<QaAuditOutput | null>(null);
  const [savedAudits, setSavedAudits] = useState<SavedAuditItem[]>([]);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [playbackAudioSrc, setPlaybackAudioSrc] = useState<string | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [parameters, sops, auditsRes] = await Promise.all([
          qaParameterApi.list(),
          sopApi.list(),
          auditApi.list({ limit: 100 })
        ]);

        if (parameters && Array.isArray(parameters)) {
          setAvailableQaParameterSets(
            parameters.map(convertQAParameterDocumentToQAParameter)
          );
        }

        if (sops && Array.isArray(sops)) {
          setAvailableSops(sops.map(convertSOPDocumentToSOP));
        }

        if (auditsRes?.data) {
          setSavedAudits(
            auditsRes.data.map(convertAuditDocumentToSavedAuditItem)
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data from database.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [toast]);

  const handleAudioFileSelected = (file: File | null) => {
    setSelectedAudioFile(null);
    setOriginalAudioDataUri(null);
    setPreviewAudioSrc(null);
    setAudioKey(Date.now().toString());

    if (!file) {
      // No file selected; just return and let state handle UI reset
      return;
    }

    if (!file.type.startsWith("audio/") && file.type !== "video/mp4") {
      toast({
        title: "Invalid file type",
        description:
          "Please select an audio file (e.g., MP3, WAV) or an MP4 video file.",
        variant: "destructive",
      });
      // Don't call clearFile() here to avoid recursion - just return
      return;
    }

    setSelectedAudioFile(file);

    // TODO: Commented out conversion for now - send original file directly
    // if (needsAudioConversion(file)) {
    //   setAudioKey("converting");
    //
    //   const formData = new FormData();
    //   formData.append("file", file);
    //
    //   fetch("/api/audio/convert", {
    //     method: "POST",
    //     headers: getAuthHeaders(),
    //     body: formData,
    //   })
    //     .then(async (response) => {
    //       if (!response.ok) {
    //         const error = await response.json();
    //         throw new Error(
    //           error.error || `Conversion failed with status ${response.status}`
    //         );
    //       }
    //       return response.json();
    //     })
    //     .then((data) => {
    //       if (data.success) {
    //         setOriginalAudioDataUri(data.data.audioDataUri);
    //         setPreviewAudioSrc(
    //           URL.createObjectURL(
    //             new Blob([data.data.audioDataUri], { type: "audio/wav" })
    //           )
    //         );
    //         setAudioKey("converted");
    //         toast({
    //           title: "Audio Converted",
    //           description: `Successfully converted to WAV (${(
    //             data.data.convertedSize /
    //             (1024 * 1024)
    //           ).toFixed(2)}MB)`,
    //         });
    //       } else {
    //         throw new Error(data.error || "Conversion failed");
    //       }
    //     })
    //     .catch((error) => {
    //       console.error("Audio conversion failed:", error);
    //       toast({
    //         title: "Conversion Failed",
    //         description:
    //           error.message || "Failed to convert audio to WAV on server.",
    //         variant: "destructive",
    //       });
    //       setSelectedAudioFile(null);
    //       setAudioKey("error");
    //     });
    // } else {
    //   // Already WAV, just read as data URL
    //   const reader = new FileReader();
    //   reader.onload = (e) =>
    //     setOriginalAudioDataUri(e.target?.result as string);
    //   reader.readAsDataURL(file);
    //
    //   const objectUrl = URL.createObjectURL(file);
    //   setPreviewAudioSrc(objectUrl);
    //   setAudioKey(objectUrl);
    // }

    // Send original file directly without conversion
    const reader = new FileReader();
    reader.onload = (e) => setOriginalAudioDataUri(e.target?.result as string);
    reader.readAsDataURL(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewAudioSrc(objectUrl);
    setAudioKey(objectUrl);

    toast({
      title: "Audio File Selected",
      description: `Selected ${file.name} (${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB)`,
    });
  };

  const handleQaAudit = async () => {
    if (
      !qaCallLanguage ||
      qaAuditParameters.length === 0 ||
      !qaAgentUserId ||
      !qaCampaignName
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please provide Agent User ID, Campaign Name, call language and ensure audit parameters are set.",
        variant: "destructive",
      });
      return;
    }
    setIsAuditing(true);
    setAuditStartTime(new Date());
    setAuditResult(null);

    try {
      // Transform parameters to flat format expected by the backend
      const flatParameters = qaAuditParameters.flatMap(group =>
        (group.subParameters || []).map(sub => ({
          id: sub.id,
          name: sub.name,
          weight: sub.weight,
          type: sub.type || 'Non-Fatal',
        }))
      );

      const input = {
        // Audio data (base64 data URI)
        audioDataUri: originalAudioDataUri || "",
        // QA parameters for scoring
        parameters: flatParameters,
        // Metadata
        language: qaCallLanguage,
        agentName: qaAgentUserId, // Backend expects agentName
        campaignName: qaCampaignName,
      };

      const result = await aiApi.auditCall(input);
      if (!result) {
        throw new Error("QA audit returned no result");
      }
      setAuditResult(result);

      toast({
        title: "Audit Complete",
        description: `Successfully audited call for agent ${result.identifiedAgentName}. Review results below and click Save to persist.`,
      });
    } catch (error) {
      console.error("Error during QA audit:", error);
      toast({
        title: "Audit Failed",
        description:
          error instanceof Error ? error.message : "An unexpected API error occurred. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsAuditing(false);
      setAuditEndTime(new Date());
    }
  };

  const handlePlayTranslation = async (text: string) => {
    if (!text) return;

    // Check if browser supports speech synthesis
    if (!("speechSynthesis" in window)) {
      toast({
        title: "Not Supported",
        description: "Your browser does not support text-to-speech.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSpeech(true);

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Wait a bit after cancel to ensure clean state
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get voices
      let voices = window.speechSynthesis.getVoices();

      // If voices aren't loaded yet, wait for them
      if (voices.length === 0) {
        await new Promise<void>((resolve) => {
          const checkVoices = () => {
            voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
              resolve();
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          checkVoices();
        });
      }

      const englishVoice =
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") && voice.name.includes("Google")
        ) ||
        voices.find((voice) => voice.lang.startsWith("en-US")) ||
        voices.find((voice) => voice.lang.startsWith("en"));

      // Split text into smaller chunks to avoid Chrome's speech synthesis bug
      // Chrome has issues with long utterances
      const maxChunkLength = 200;
      const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
      const chunks: string[] = [];
      let currentChunk = "";

      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkLength && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      // If no chunks were created, use the original text
      if (chunks.length === 0) {
        chunks.push(text);
      }

      let currentIndex = 0;

      const speakNextChunk = () => {
        if (currentIndex >= chunks.length) {
          setIsGeneratingSpeech(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
        utterance.lang = "en-US";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onend = () => {
          currentIndex++;
          speakNextChunk();
        };

        utterance.onerror = (event) => {
          // Ignore "interrupted" error - this happens when user clicks Stop
          if (event.error === "interrupted" || event.error === "canceled") {
            setIsGeneratingSpeech(false);
            return;
          }
          console.error("Speech synthesis error:", event);
          setIsGeneratingSpeech(false);
          toast({
            title: "Speech Error",
            description: "Failed to play the text.",
            variant: "destructive",
          });
        };

        window.speechSynthesis.speak(utterance);
      };

      // Chrome bug workaround: resume speech synthesis if it gets paused
      const resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(resumeInterval);
        } else if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 1000);

      // Start speaking
      speakNextChunk();

      // Clean up interval when speech ends
      const checkSpeechEnd = setInterval(() => {
        if (!isGeneratingSpeech || !window.speechSynthesis.speaking) {
          clearInterval(resumeInterval);
          clearInterval(checkSpeechEnd);
        }
      }, 500);
    } catch (e) {
      console.error("TTS Error:", e);
      setIsGeneratingSpeech(false);
      toast({
        title: "Text-to-Speech Failed",
        description:
          e instanceof Error ? e.message : "Could not generate audio.",
        variant: "destructive",
      });
    }
  };

  // Load voices when component mounts
  useEffect(() => {
    if ("speechSynthesis" in window) {
      // Voices may not be loaded immediately
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (playbackAudioSrc && audioPlaybackRef.current) {
      audioPlaybackRef.current.play();
    }
  }, [playbackAudioSrc]);

  // Internal save function that doesn't show toast (used for auto-save)
  const handleSaveAuditInternal = async (
    auditData: QaAuditOutput & { agentUserId?: string; campaignName?: string }
  ) => {
    const newSavedAudit: SavedAuditItem = {
      id: `audit_${Date.now()}`,
      auditDate: new Date().toISOString(),
      agentName: auditData.identifiedAgentName || "Unknown Agent",
      agentUserId: auditData.agentUserId || "N/A",
      campaignName: auditData.campaignName,
      overallScore: auditData.overallScore,
      auditData: {
        ...auditData,
        startTime: auditStartTime?.toISOString(),
        endTime: auditEndTime?.toISOString(),
      },
      auditType: "ai",
    };

    // We don't need to fetch user profile - the API will extract username from JWT
    // Use V2 converter for defensive mapping
    const createAuditData = convertSavedAuditItemToCreateAuditFormatV2(
      newSavedAudit,
      "will-be-set-by-api" // API will override this with JWT username
    );

    console.log(
      "Auto-saving audit data to API:",
      JSON.stringify(createAuditData, null, 2)
    );

    const savedAudit = await auditApi.create(createAuditData);
    const updatedAudits = [...savedAudits, newSavedAudit];
    setSavedAudits(updatedAudits);
    resetSingleAuditForm();

    return savedAudit;
  };

  const handleSaveAudit = async (
    auditData: QaAuditOutput & { agentUserId?: string; campaignName?: string }
  ) => {
    try {
      await handleSaveAuditInternal(auditData);
      toast({
        title: "Audit Saved",
        description: `The AI audit for ${auditData.identifiedAgentName || "Unknown Agent"
          } has been saved.`,
      });
    } catch (error) {
      console.error("Error saving audit:", error);
      if (error instanceof Error && error.message === "File too large") {
        toast({
          title: "File Too Large",
          description:
            "The uploaded audio file is too large for the server. Please upload a smaller file.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save audit. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const resetSingleAuditForm = () => {
    setQaAgentUserId("");
    setQaCampaignName("");
    setSelectedAudioFile(null);
    setOriginalAudioDataUri(null);
    setPreviewAudioSrc(null);
    setAudioKey(Date.now().toString());
    // Don't call clearFile() to avoid infinite recursion - just update state
    // audioInputRef.current?.clearFile(); // intentionally left commented - parent will manage state
    setQaCallLanguage(DEFAULT_CALL_LANGUAGE);
    setQaTranscriptionLanguage("");
    setSelectedQaParameterSetId("default_params_set");
    setSelectedSopId("default_params_sop");
    setQaAuditParameters(DEFAULT_AUDIT_PARAMETERS);
    setAuditResult(null);
    setIsAuditing(false);
    setAuditStartTime(null);
    setAuditEndTime(null);
    toast({
      title: "Form Cleared",
      description: "The QAi Audit form has been reset.",
    });
  };

  const handleParameterSetChange = (
    id: string,
    setter: (params: ParameterGroup[]) => void
  ) => {
    const selectedSet = availableQaParameterSets.find((p) => p.id === id);
    if (selectedSet) {
      setter(selectedSet.parameters);
    } else {
      setter(DEFAULT_AUDIT_PARAMETERS);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>QAi Audit Form</CardTitle>
          <CardDescription>
            Configure the audit parameters and upload an audio file for AI
            analysis. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="qa-agent-id">Agent User ID</Label>
              <Input
                id="qa-agent-id"
                placeholder="e.g., AGENT007"
                value={qaAgentUserId}
                onChange={(e) => setQaAgentUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-campaign-name">Campaign Name</Label>
              <Input
                id="qa-campaign-name"
                placeholder="e.g., Q3 Product Launch"
                value={qaCampaignName}
                onChange={(e) => setQaCampaignName(e.target.value)}
              />
            </div>
          </div>

          <AudioUploadDropzone
            ref={audioInputRef}
            onFileSelected={handleAudioFileSelected}
          />

          {previewAudioSrc && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <Label>Audio Preview</Label>
              <audio
                key={audioKey}
                controls
                src={previewAudioSrc}
                className="w-full mt-2"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="qa-call-language">Call Language</Label>
              <Select value={qaCallLanguage} onValueChange={setQaCallLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Mandarin Chinese">
                    Mandarin Chinese
                  </SelectItem>
                  <SelectItem value="Japanese">Japanese</SelectItem>
                  <SelectItem value="Russian">Russian</SelectItem>
                  <SelectItem value="Portuguese">Portuguese</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                  <SelectItem value="Italian">Italian</SelectItem>
                  <Separator />
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Bengali">Bengali</SelectItem>
                  <SelectItem value="Telugu">Telugu</SelectItem>
                  <SelectItem value="Marathi">Marathi</SelectItem>
                  <SelectItem value="Tamil">Tamil</SelectItem>
                  <SelectItem value="Urdu">Urdu</SelectItem>
                  <SelectItem value="Gujarati">Gujarati</SelectItem>
                  <SelectItem value="Kannada">Kannada</SelectItem>
                  <SelectItem value="Odia">Odia</SelectItem>
                  <SelectItem value="Punjabi">Punjabi</SelectItem>
                  <SelectItem value="Malayalam">Malayalam</SelectItem>
                  <SelectItem value="Assamese">Assamese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-transcription-language">
                Transcription Language (Optional)
              </Label>
              <Input
                id="qa-transcription-language"
                placeholder="e.g., Tamil (if call is Hindi)"
                value={qaTranscriptionLanguage}
                onChange={(e) => setQaTranscriptionLanguage(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Audit Parameters</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <Select
                value={selectedQaParameterSetId}
                onValueChange={(id) => {
                  setSelectedQaParameterSetId(id);
                  handleParameterSetChange(id, setQaAuditParameters);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a QA Parameter Set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default_params_set">
                    Default Parameters
                  </SelectItem>
                  {availableQaParameterSets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSopId} onValueChange={setSelectedSopId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a related SOP (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default_params_sop">
                    No associated SOP
                  </SelectItem>
                  {availableSops
                    .filter((s) => s.status === "Published")
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title} (v{s.version})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {qaAuditParameters.map((group) => (
                    <li key={group.id} className="font-semibold">
                      {group.name}
                      <ul className="list-disc list-inside pl-4 font-normal">
                        {group.subParameters.map((sub) => (
                          <li key={sub.id}>
                            {sub.name} ({sub.weight}%)
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetSingleAuditForm}
            disabled={isAuditing}
          >
            Reset Form
          </Button>
          <Button
            onClick={handleQaAudit}
            disabled={isAuditing || !originalAudioDataUri}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isAuditing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            {isAuditing ? "Auditing..." : "Start QAi Audit"}
          </Button>
        </CardFooter>
      </Card>

      {auditResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>QAi Audit Result</CardTitle>
            <CardDescription>
              Detailed analysis of the call for agent:{" "}
              <span className="font-bold">
                {auditResult.identifiedAgentName}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Overall Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {(auditResult.overallScore ?? 0).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Agent Name
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {auditResult.identifiedAgentName}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Call Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {auditResult.callLanguage || qaCallLanguage}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Fatal Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {
                      auditResult.auditResults.filter(
                        (r: any) => r.type === "Fatal" && r.score < 80
                      ).length
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label>Audit Summary</Label>
              <p className="text-sm p-4 bg-muted rounded-md">
                {auditResult.summary}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Detailed Scoring</Label>
                {auditResult.timing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Processing Time:</span>
                    <span className={`font-medium ${auditResult.timing.processingDurationMs < 5000
                      ? 'text-emerald-600'
                      : auditResult.timing.processingDurationMs < 15000
                        ? 'text-blue-600'
                        : 'text-amber-600'
                      }`}>
                      {auditResult.timing.processingDurationMs < 1000
                        ? `${auditResult.timing.processingDurationMs}ms`
                        : `${(auditResult.timing.processingDurationMs / 1000).toFixed(1)}s`
                      }
                    </span>
                    {auditResult.overallConfidence && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span>Overall Confidence:</span>
                        <span className={`font-medium ${auditResult.overallConfidence >= 85
                          ? 'text-emerald-600'
                          : auditResult.overallConfidence >= 60
                            ? 'text-amber-600'
                            : 'text-red-600'
                          }`}>
                          {auditResult.overallConfidence}%
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                    <TableHead>Comments & Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditResult.auditResults.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.parameter || item.parameterName}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${item.score >= 80 ? 'text-emerald-600' :
                          item.score >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                          {item.score}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.confidence !== undefined ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.confidence >= 85
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : item.confidence >= 60
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-red-500/10 text-red-600'
                            }`}>
                            {item.confidence}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <p className="text-sm">{item.comments}</p>
                          {item.evidence && (
                            <div className="space-y-1">
                              {Array.isArray(item.evidence) ? (
                                <>
                                  {item.evidence.slice(0, 2).map((ev: any, evIdx: number) => (
                                    <div
                                      key={evIdx}
                                      className="text-xs p-2 rounded bg-muted/50 border border-border/50 italic text-muted-foreground"
                                    >
                                      <span className="text-primary/60 font-medium mr-1">
                                        {ev.lineNumber ? `L${ev.lineNumber}:` : `#${evIdx + 1}:`}
                                      </span>
                                      &ldquo;{ev.text || ev}&rdquo;
                                    </div>
                                  ))}
                                  {item.evidence.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{item.evidence.length - 2} more citations
                                    </span>
                                  )}
                                </>
                              ) : (
                                <div className="text-xs p-2 rounded bg-muted/50 border border-border/50 italic text-muted-foreground">
                                  &ldquo;{item.evidence}&rdquo;
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Call Summary</Label>
                <Textarea
                  readOnly
                  value={auditResult.callSummary}
                  className="h-40 bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Root Cause Analysis</Label>
                <Textarea
                  readOnly
                  value={
                    auditResult.rootCauseAnalysis ||
                    "No significant issues requiring RCA identified."
                  }
                  className="h-40 bg-muted/50"
                />
              </div>
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  Show/Hide Full Transcription & Chat
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>
                        Transcription (
                        {auditResult.callLanguage || qaCallLanguage})
                      </Label>
                    </div>
                    <ScrollArea className="h-64 p-4 border rounded-md bg-muted/50">
                      <pre className="text-sm whitespace-pre-wrap">
                        {auditResult.transcriptionInOriginalLanguage}
                      </pre>
                    </ScrollArea>
                  </div>
                  {auditResult.englishTranslation && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>English Translation</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (isGeneratingSpeech) {
                              // Stop speaking
                              window.speechSynthesis.cancel();
                              setIsGeneratingSpeech(false);
                            } else {
                              handlePlayTranslation(
                                auditResult.englishTranslation!
                              );
                            }
                          }}
                        >
                          {isGeneratingSpeech ? (
                            <VolumeX className="mr-2 h-4 w-4" />
                          ) : (
                            <Volume2 className="mr-2 h-4 w-4" />
                          )}
                          {isGeneratingSpeech ? "Stop" : "Speak Translation"}
                        </Button>
                      </div>
                      <ScrollArea className="h-64 p-4 border rounded-md bg-muted/50">
                        <pre className="text-sm whitespace-pre-wrap">
                          {auditResult.englishTranslation}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
                {playbackAudioSrc && (
                  <audio
                    ref={audioPlaybackRef}
                    src={playbackAudioSrc}
                    className="w-full"
                    controls
                    autoPlay
                  />
                )}
                <AuditChatbot
                  auditSummary={auditResult.summary}
                  auditTranscription={
                    auditResult.transcriptionInOriginalLanguage
                  }
                />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={() =>
                handleSaveAudit({
                  ...auditResult,
                  agentUserId: qaAgentUserId,
                  campaignName: qaCampaignName,
                })
              }
            >
              <Save className="mr-2 h-4 w-4" /> Save Audit
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
