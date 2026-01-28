'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ArrowLeft, Clock, User, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TranscriptSegment {
  id: string;
  speaker: 'agent' | 'customer';
  text: string;
  startTime: number; // seconds
  endTime: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  annotations: {
    type: 'positive' | 'concern' | 'violation';
    text: string;
    parameterId?: string;
  }[];
}

interface AuditResult {
  parameterId: string;
  parameterName: string;
  score: number;
  maxScore: number;
  linkedSegments: string[]; // segment IDs that affected this score
  feedback: string;
}

// Mock data
const mockTranscript: TranscriptSegment[] = [
  { id: '1', speaker: 'agent', text: 'Thank you for calling AssureQai support, this is Sarah speaking. How may I assist you today?', startTime: 0, endTime: 5, sentiment: 'positive', annotations: [{ type: 'positive', text: 'Excellent greeting', parameterId: 'greeting' }] },
  { id: '2', speaker: 'customer', text: 'Hi Sarah, I\'m having trouble with my dashboard. It keeps showing an error when I try to load the reports.', startTime: 5, endTime: 12, sentiment: 'neutral', annotations: [] },
  { id: '3', speaker: 'agent', text: 'I\'m sorry to hear you\'re experiencing this issue. Let me look into that for you right away. Can you tell me what error message you\'re seeing?', startTime: 12, endTime: 19, sentiment: 'positive', annotations: [{ type: 'positive', text: 'Good empathy and probing', parameterId: 'problem_id' }] },
  { id: '4', speaker: 'customer', text: 'It says "Error 500: Internal Server Error" and I\'ve tried refreshing multiple times.', startTime: 19, endTime: 25, sentiment: 'negative', annotations: [] },
  { id: '5', speaker: 'agent', text: 'I understand how frustrating that must be. Let me check our system status. One moment please.', startTime: 25, endTime: 31, sentiment: 'positive', annotations: [{ type: 'positive', text: 'Acknowledged frustration', parameterId: 'tone' }] },
  { id: '6', speaker: 'agent', text: 'I can see there was a temporary service disruption that has now been resolved. Could you please try refreshing your browser now?', startTime: 35, endTime: 43, sentiment: 'positive', annotations: [{ type: 'positive', text: 'Clear solution provided', parameterId: 'solution' }] },
  { id: '7', speaker: 'customer', text: 'Oh yes, it\'s working now! Thank you so much!', startTime: 43, endTime: 47, sentiment: 'positive', annotations: [] },
  { id: '8', speaker: 'agent', text: 'Wonderful! Is there anything else I can help you with today?', startTime: 47, endTime: 51, sentiment: 'positive', annotations: [{ type: 'positive', text: 'Good closing', parameterId: 'closing' }] },
  { id: '9', speaker: 'customer', text: 'No, that\'s all. Thanks again!', startTime: 51, endTime: 54, sentiment: 'positive', annotations: [] },
  { id: '10', speaker: 'agent', text: 'You\'re welcome! Thank you for choosing AssureQai. Have a great day!', startTime: 54, endTime: 59, sentiment: 'positive', annotations: [{ type: 'positive', text: 'Warm closing', parameterId: 'closing' }] },
];

const mockAuditResults: AuditResult[] = [
  { parameterId: 'greeting', parameterName: 'Greeting & Opening', score: 100, maxScore: 100, linkedSegments: ['1'], feedback: 'Excellent opening with name introduction and offer to help.' },
  { parameterId: 'problem_id', parameterName: 'Problem Identification', score: 95, maxScore: 100, linkedSegments: ['3'], feedback: 'Good probing questions to understand the issue.' },
  { parameterId: 'tone', parameterName: 'Tone & Professionalism', score: 100, maxScore: 100, linkedSegments: ['5'], feedback: 'Maintained professional and empathetic tone throughout.' },
  { parameterId: 'solution', parameterName: 'Solution Provided', score: 90, maxScore: 100, linkedSegments: ['6'], feedback: 'Clear resolution provided, but could explain the cause better.' },
  { parameterId: 'closing', parameterName: 'Closing & Wrap-up', score: 100, maxScore: 100, linkedSegments: ['8', '10'], feedback: 'Proper closing with follow-up offer.' },
];

const mockSentiment = {
  overall: 'positive' as const,
  customerSentiment: 0.72,
  agentSentiment: 0.85,
  escalationRisk: 'low' as const,
  predictedCSAT: 4.5,
};

export default function TranscriptPlaybackPage() {
  const params = useParams();
  const auditId = params.id;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(59);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= duration) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Update active segment based on current time
  useEffect(() => {
    const segment = mockTranscript.find(s => currentTime >= s.startTime && currentTime < s.endTime);
    if (segment && segment.id !== activeSegment) {
      setActiveSegment(segment.id);
      // Scroll to segment
      const el = document.getElementById(`segment-${segment.id}`);
      if (el && transcriptRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, activeSegment]);

  const jumpToSegment = (segment: TranscriptSegment) => {
    setCurrentTime(segment.startTime);
    setIsPlaying(true);
  };

  const getAnnotationStyle = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-emerald-500/20 border-l-2 border-emerald-500';
      case 'concern': return 'bg-amber-500/20 border-l-2 border-amber-500';
      case 'violation': return 'bg-red-500/20 border-l-2 border-red-500';
      default: return '';
    }
  };

  const linkedSegmentIds = selectedParameter
    ? mockAuditResults.find(r => r.parameterId === selectedParameter)?.linkedSegments || []
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/audit-details">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Call Transcript</h2>
            <p className="text-muted-foreground">Audit ID: {auditId} • CALL-1234</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 text-sm rounded-full ${
            mockSentiment.overall === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
            mockSentiment.overall === 'negative' ? 'bg-red-500/10 text-red-500' :
            'bg-amber-500/10 text-amber-500'
          }`}>
            {mockSentiment.overall.toUpperCase()} CALL
          </span>
          <span className="text-sm text-muted-foreground">
            CSAT Prediction: <strong className="text-primary">{mockSentiment.predictedCSAT}/5</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transcript Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Audio Player */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Waveform placeholder */}
                <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-lg relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/50"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>AI-Annotated Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={transcriptRef} className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {mockTranscript.map((segment) => {
                  const isActive = segment.id === activeSegment;
                  const isLinked = linkedSegmentIds.includes(segment.id);
                  const hasAnnotation = segment.annotations.length > 0;

                  return (
                    <div
                      key={segment.id}
                      id={`segment-${segment.id}`}
                      onClick={() => jumpToSegment(segment)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isActive ? 'ring-2 ring-primary bg-primary/5' :
                        isLinked ? 'ring-2 ring-amber-500 bg-amber-500/5' :
                        'hover:bg-muted/50'
                      } ${hasAnnotation ? getAnnotationStyle(segment.annotations[0]?.type) : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full ${segment.speaker === 'agent' ? 'bg-primary/10' : 'bg-muted'}`}>
                          <User className={`h-3 w-3 ${segment.speaker === 'agent' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium capitalize">{segment.speaker}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(segment.startTime)}
                            </span>
                          </div>
                          <p className="text-sm">{segment.text}</p>
                          {segment.annotations.map((ann, i) => (
                            <div key={i} className={`mt-2 text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${
                              ann.type === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
                              ann.type === 'concern' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {ann.type === 'positive' ? <CheckCircle className="h-3 w-3" /> :
                               ann.type === 'concern' ? <AlertTriangle className="h-3 w-3" /> :
                               <AlertTriangle className="h-3 w-3" />}
                              {ann.text}
                            </div>
                          ))}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          segment.sentiment === 'positive' ? 'bg-emerald-500' :
                          segment.sentiment === 'negative' ? 'bg-red-500' :
                          'bg-amber-500'
                        }`} title={segment.sentiment} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Parameters & Sentiment */}
        <div className="space-y-4">
          {/* Sentiment Card */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Customer</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${mockSentiment.customerSentiment > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.abs(mockSentiment.customerSentiment) * 100}%` }}
                    />
                  </div>
                  {mockSentiment.customerSentiment > 0 ? <ThumbsUp className="h-4 w-4 text-emerald-500" /> : <ThumbsDown className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Agent</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${mockSentiment.agentSentiment > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.abs(mockSentiment.agentSentiment) * 100}%` }}
                    />
                  </div>
                  {mockSentiment.agentSentiment > 0 ? <ThumbsUp className="h-4 w-4 text-emerald-500" /> : <ThumbsDown className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Escalation Risk</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  mockSentiment.escalationRisk === 'low' ? 'bg-emerald-500/10 text-emerald-500' :
                  mockSentiment.escalationRisk === 'high' ? 'bg-red-500/10 text-red-500' :
                  'bg-amber-500/10 text-amber-500'
                }`}>
                  {mockSentiment.escalationRisk.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Parameter Scores */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Parameter Scores</CardTitle>
              <p className="text-xs text-muted-foreground">Click to highlight phrases</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAuditResults.map((result) => (
                  <div
                    key={result.parameterId}
                    onClick={() => setSelectedParameter(selectedParameter === result.parameterId ? null : result.parameterId)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedParameter === result.parameterId
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{result.parameterName}</span>
                      <span className={`font-bold ${result.score >= 90 ? 'text-emerald-500' : result.score >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                        {result.score}%
                      </span>
                    </div>
                    {selectedParameter === result.parameterId && (
                      <p className="text-xs text-muted-foreground mt-2">{result.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
