'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ArrowLeft, Clock, User, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle, Loader2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAudit } from '@/lib/hooks';

interface TranscriptSegment {
  id: string;
  speaker: 'agent' | 'customer';
  text: string;
  startTime: number;
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
  linkedSegments: string[];
  feedback: string;
}

export default function TranscriptPlaybackPage() {
  const params = useParams();
  const auditId = params.id as string;

  const { data: audit, isLoading, error } = useAudit(auditId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);

  // Extract transcript segments from audit data
  const transcript: TranscriptSegment[] = audit?.transcript?.segments || [];
  const auditResults: AuditResult[] = audit?.auditResults?.map((r: any) => ({
    parameterId: r.parameterId || r._id,
    parameterName: r.parameterName || r.name,
    score: r.score || 0,
    maxScore: r.maxScore || 100,
    linkedSegments: r.linkedSegments || [],
    feedback: r.feedback || r.comment || '',
  })) || [];

  const sentiment = audit?.sentiment || { overall: 'neutral', customerSentiment: 0, agentSentiment: 0, escalationRisk: 'unknown', predictedCSAT: 0 };
  const duration = audit?.transcript?.duration || (transcript.length > 0 ? transcript[transcript.length - 1]?.endTime || 60 : 60);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate playback
  useEffect(() => {
    if (!isPlaying || transcript.length === 0) return;

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
  }, [isPlaying, duration, transcript.length]);

  // Update active segment based on current time
  useEffect(() => {
    if (transcript.length === 0) return;

    const segment = transcript.find(s => currentTime >= s.startTime && currentTime < s.endTime);
    if (segment && segment.id !== activeSegment) {
      setActiveSegment(segment.id);
      const el = document.getElementById(`segment-${segment.id}`);
      if (el && transcriptRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, activeSegment, transcript]);

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
    ? auditResults.find(r => r.parameterId === selectedParameter)?.linkedSegments || []
    : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !audit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/audit-details">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audits
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Call Transcript</h2>
            <p className="text-muted-foreground">Audit ID: {auditId}</p>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Audit Not Found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              The requested audit could not be loaded. It may have been deleted or the ID is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No transcript available
  if (transcript.length === 0) {
    return (
      <div className="space-y-6">
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
              <p className="text-muted-foreground">Audit ID: {auditId} • {audit.callId || 'No Call ID'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-sm rounded-full ${audit.overallScore >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
                audit.overallScore >= 80 ? 'bg-amber-500/10 text-amber-500' :
                  'bg-red-500/10 text-red-500'
              }`}>
              Score: {audit.overallScore}%
            </span>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No Transcript Available</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This audit does not have transcript data to display.
            </p>
          </CardContent>
        </Card>

        {/* Still show audit results if available */}
        {auditResults.length > 0 && (
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Parameter Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditResults.map((result) => (
                  <div key={result.parameterId} className="p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{result.parameterName}</span>
                      <span className={`font-bold ${result.score >= 90 ? 'text-emerald-500' : result.score >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                        {result.score}%
                      </span>
                    </div>
                    {result.feedback && (
                      <p className="text-xs text-muted-foreground">{result.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

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
            <p className="text-muted-foreground">Audit ID: {auditId} • {audit.callId || 'No Call ID'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 text-sm rounded-full ${sentiment.overall === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
              sentiment.overall === 'negative' ? 'bg-red-500/10 text-red-500' :
                'bg-amber-500/10 text-amber-500'
            }`}>
            {String(sentiment.overall).toUpperCase()} CALL
          </span>
          {sentiment.predictedCSAT > 0 && (
            <span className="text-sm text-muted-foreground">
              CSAT Prediction: <strong className="text-primary">{sentiment.predictedCSAT}/5</strong>
            </span>
          )}
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
                {transcript.map((segment) => {
                  const isActive = segment.id === activeSegment;
                  const isLinked = linkedSegmentIds.includes(segment.id);
                  const hasAnnotation = segment.annotations && segment.annotations.length > 0;

                  return (
                    <div
                      key={segment.id}
                      id={`segment-${segment.id}`}
                      onClick={() => jumpToSegment(segment)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary bg-primary/5' :
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
                          {segment.annotations?.map((ann, i) => (
                            <div key={i} className={`mt-2 text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${ann.type === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
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
                        <div className={`w-2 h-2 rounded-full ${segment.sentiment === 'positive' ? 'bg-emerald-500' :
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
                      className={`h-full ${(sentiment.customerSentiment || 0) > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.abs(sentiment.customerSentiment || 0) * 100}%` }}
                    />
                  </div>
                  {(sentiment.customerSentiment || 0) > 0 ? <ThumbsUp className="h-4 w-4 text-emerald-500" /> : <ThumbsDown className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Agent</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${(sentiment.agentSentiment || 0) > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.abs(sentiment.agentSentiment || 0) * 100}%` }}
                    />
                  </div>
                  {(sentiment.agentSentiment || 0) > 0 ? <ThumbsUp className="h-4 w-4 text-emerald-500" /> : <ThumbsDown className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Escalation Risk</span>
                <span className={`px-2 py-1 text-xs rounded-full ${sentiment.escalationRisk === 'low' ? 'bg-emerald-500/10 text-emerald-500' :
                    sentiment.escalationRisk === 'high' ? 'bg-red-500/10 text-red-500' :
                      'bg-amber-500/10 text-amber-500'
                  }`}>
                  {String(sentiment.escalationRisk || 'unknown').toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Parameter Scores */}
          {auditResults.length > 0 && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Parameter Scores</CardTitle>
                <p className="text-xs text-muted-foreground">Click to highlight phrases</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditResults.map((result) => (
                    <div
                      key={result.parameterId}
                      onClick={() => setSelectedParameter(selectedParameter === result.parameterId ? null : result.parameterId)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${selectedParameter === result.parameterId
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
                      {selectedParameter === result.parameterId && result.feedback && (
                        <p className="text-xs text-muted-foreground mt-2">{result.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
