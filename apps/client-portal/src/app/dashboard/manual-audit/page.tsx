'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Edit,
  ClipboardList,
  Save,
  Loader2,
  Play,
  AlertCircle,
  CheckCircle,
  Info,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  qaParameterApi,
  campaignApi,
  auditApi,
  type QAParameter,
  type Campaign,
} from '@/lib/api';
import {
  AudioUploadDropzone,
  type AudioUploadDropzoneRef,
} from '@/components/dashboard/AudioUploadDropzone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditParameter {
  id: string;
  name: string;
  weight: number;
  category: string;
  isFatal: boolean;
  type?: string;
}

// Helper to convert API parameter format to UI format
const convertApiParamsToUi = (qaParams: any[]): AuditParameter[] => {
  const uiParams: AuditParameter[] = [];

  qaParams.forEach((group: any) => {
    if (group.subParameters && Array.isArray(group.subParameters)) {
      group.subParameters.forEach((sub: any) => {
        uiParams.push({
          id: sub.id,
          name: sub.name,
          weight: sub.weight,
          category: group.name,
          isFatal: sub.type === 'Fatal',
          type: sub.type,
        });
      });
    }
  });

  return uiParams;
};

export default function ManualAuditPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    agentName: '',
    teamLead: '',
    callId: '',
    callDate: new Date().toISOString().split('T')[0],
    callType: 'Inbound Support',
  });

  // Separate: Parameter Sets (scoring templates) vs Campaigns (grouping)
  const [parameterSets, setParameterSets] = useState<QAParameter[]>([]);
  const [selectedParameterSetId, setSelectedParameterSetId] =
    useState<string>('');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('none');

  // Create new campaign inline
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Default parameters if no parameter set selected
  const defaultParameters: AuditParameter[] = [
    {
      id: '1',
      name: 'Greeting & Opening',
      weight: 10,
      category: 'Opening',
      isFatal: false,
    },
    {
      id: '2',
      name: 'Problem Identification',
      weight: 15,
      category: 'Discovery',
      isFatal: false,
    },
    {
      id: '3',
      name: 'Solution Provided',
      weight: 20,
      category: 'Resolution',
      isFatal: false,
    },
    {
      id: '4',
      name: 'Tone & Professionalism',
      weight: 15,
      category: 'Soft Skills',
      isFatal: false,
    },
    {
      id: '5',
      name: 'Closing & Wrap-up',
      weight: 10,
      category: 'Closing',
      isFatal: false,
    },
    {
      id: '6',
      name: 'Data Protection Compliance',
      weight: 0,
      category: 'Compliance',
      isFatal: true,
    },
  ];

  const [parameters, setParameters] =
    useState<AuditParameter[]>(defaultParameters);
  const [scores, setScores] = useState<
    Record<string, { score: number; comment: string }>
  >({});
  const [saving, setSaving] = useState(false);

  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioInputRef = useRef<AudioUploadDropzoneRef>(null);

  // Fetch parameter sets and campaigns on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paramData, campaignData] = await Promise.all([
          qaParameterApi.list(),
          campaignApi.list(1, 100).catch(() => ({
            data: [],
            pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
          })),
        ]);
        if (paramData && Array.isArray(paramData)) {
          setParameterSets(paramData);
        }
        if (campaignData?.data && Array.isArray(campaignData.data)) {
          setCampaigns(campaignData.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Using default parameters.',
          variant: 'destructive',
        });
      }
    };
    fetchData();
  }, [toast]);

  const handleCampaignSelectChange = (value: string) => {
    if (value === '__create_new__') {
      setShowNewCampaign(true);
    } else {
      setSelectedCampaignId(value);
      setShowNewCampaign(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast({ title: 'Campaign name is required', variant: 'destructive' });
      return;
    }

    setCreatingCampaign(true);
    try {
      const created = await campaignApi.create({
        name: newCampaignName.trim(),
        description: newCampaignDesc.trim() || undefined,
        qaParameterSetId: selectedParameterSetId || 'default',
        jobs: [],
      });

      // Add to local campaigns list and select it
      setCampaigns((prev) => [created, ...prev]);
      setSelectedCampaignId(created._id);
      setShowNewCampaign(false);
      setNewCampaignName('');
      setNewCampaignDesc('');

      toast({
        title: 'Campaign Created',
        description: `Campaign "${created.name}" has been created and selected.`,
        className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
      });
    } catch (error: any) {
      console.error('Failed to create campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign.',
        variant: 'destructive',
      });
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleParameterSetChange = (paramSetId: string) => {
    setSelectedParameterSetId(paramSetId);
    const paramSet = parameterSets.find(
      (p) => p.id === paramSetId || p._id === paramSetId,
    );

    if (paramSet && paramSet.parameters) {
      const uiParams = convertApiParamsToUi(paramSet.parameters);
      if (uiParams.length > 0) {
        setParameters(uiParams);
        setScores({}); // Reset scores when parameter set changes
        toast({
          title: 'Parameter Set Loaded',
          description: `Loaded scoring criteria from "${paramSet.name}"`,
        });
      }
    } else {
      setParameters(defaultParameters);
    }
  };

  const handleAudioSelected = (file: File | null) => {
    setAudioFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
    } else {
      setAudioSrc(null);
    }
  };

  const handleScoreChange = (paramId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        score: value,
        comment: prev[paramId]?.comment || '',
      },
    }));
  };

  const handleCommentChange = (paramId: string, comment: string) => {
    setScores((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        comment,
        score: prev[paramId]?.score || 0,
      },
    }));
  };

  const calculateOverallScore = () => {
    let totalWeight = 0;
    let weightedScore = 0;
    let hasFatalFail = false;

    parameters.forEach((param) => {
      const paramScore = scores[param.id]?.score || 0;
      if (param.isFatal && paramScore < 100) {
        hasFatalFail = true;
      }
      if (!param.isFatal) {
        totalWeight += param.weight;
        weightedScore += (paramScore / 100) * param.weight;
      }
    });

    if (hasFatalFail) return 0;
    return totalWeight > 0
      ? Math.round((weightedScore / totalWeight) * 100)
      : 0;
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!isDraft && !formData.agentName) {
      toast({ title: 'Agent name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const selectedParamSet = parameterSets.find(
        (p) =>
          p.id === selectedParameterSetId || p._id === selectedParameterSetId,
      );
      const selectedCampaign = campaigns.find(
        (c) => c._id === selectedCampaignId,
      );

      // Build auditResults in the format the backend expects
      const auditResults = parameters.map((param) => ({
        parameterId: param.id,
        parameterName: param.name,
        score: scores[param.id]?.score || 0,
        maxScore: 100,
        weight: param.weight,
        type: param.isFatal ? 'Fatal' : param.type || 'Non-Fatal',
        comments: scores[param.id]?.comment || '',
      }));

      const auditPayload = {
        callId: formData.callId || undefined,
        agentName: formData.agentName,
        auditType: 'manual' as const,
        qaParameterSetId: selectedParameterSetId || undefined,
        qaParameterSetName: selectedParamSet?.name || undefined,
        campaignId:
          selectedCampaignId === 'none' ? undefined : selectedCampaignId,
        campaignName: selectedCampaign?.name || undefined,
        auditResults,
        overallScore: calculateOverallScore(),
        auditDate: new Date(formData.callDate),
      };

      await auditApi.create(auditPayload);

      toast({
        title: isDraft ? 'Draft Saved' : 'Audit Submitted',
        description: isDraft
          ? 'Your progress has been saved.'
          : 'The manual audit has been submitted successfully.',
        className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
      });

      // Reset form on successful submit (not draft)
      if (!isDraft) {
        setFormData({
          agentName: '',
          teamLead: '',
          callId: '',
          callDate: new Date().toISOString().split('T')[0],
          callType: 'Inbound Support',
        });
        setScores({});
        setAudioFile(null);
        setAudioSrc(null);
      }
    } catch (error: any) {
      console.error('Error saving audit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save audit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const overallScore = calculateOverallScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Manual Audit Form
          </h2>
          <p className="text-muted-foreground">
            Traditional quality assessment with optional audio playback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall Score:</span>
          <span
            className={`text-2xl font-bold ${overallScore >= 80 ? 'text-emerald-500' : overallScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}
          >
            {overallScore}%
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Call Details */}
        <Card className="bg-card/50 backdrop-blur border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Audit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Parameter Set (Scoring Template) *
              </label>
              <Select
                value={selectedParameterSetId}
                onValueChange={handleParameterSetChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parameter set" />
                </SelectTrigger>
                <SelectContent>
                  {parameterSets.length > 0 ? (
                    parameterSets.map((ps) => (
                      <SelectItem key={ps.id || ps._id} value={ps.id || ps._id}>
                        {ps.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default" disabled>
                      No parameter sets available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Defines the scoring criteria and weights for this audit.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Campaign (Optional)
              </label>
              <Select
                value={selectedCampaignId}
                onValueChange={handleCampaignSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No campaign — standalone audit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Standalone)</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__create_new__">
                    <span className="flex items-center gap-1.5 text-primary">
                      <Plus className="h-3.5 w-3.5" />
                      Create New Campaign
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Inline Create Campaign Form */}
              {showNewCampaign && (
                <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-primary" />
                      New Campaign
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCampaign(false);
                        setSelectedCampaignId('none');
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Q1 2026 Support Audit"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCampaignDesc}
                      onChange={(e) => setNewCampaignDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Brief description of this campaign"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCreateCampaign}
                    disabled={creatingCampaign || !newCampaignName.trim()}
                    className="w-full"
                  >
                    {creatingCampaign ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Campaign
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                Optionally group this audit under a campaign for reporting.
              </p>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={formData.agentName}
                  onChange={(e) =>
                    setFormData({ ...formData, agentName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter agent name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Team Lead
                </label>
                <input
                  type="text"
                  value={formData.teamLead}
                  onChange={(e) =>
                    setFormData({ ...formData, teamLead: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter team lead name"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Call ID *
                </label>
                <input
                  type="text"
                  value={formData.callId}
                  onChange={(e) =>
                    setFormData({ ...formData, callId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter call ID"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Call Date *
                </label>
                <input
                  type="date"
                  value={formData.callDate}
                  onChange={(e) =>
                    setFormData({ ...formData, callDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Call Type
              </label>
              <select
                value={formData.callType}
                onChange={(e) =>
                  setFormData({ ...formData, callType: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Inbound Support</option>
                <option>Outbound Sales</option>
                <option>Customer Service</option>
                <option>Technical Support</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Audio Upload */}
        <Card className="bg-card/50 backdrop-blur border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Call Recording
            </CardTitle>
            <CardDescription>
              Upload the call recording for reference while auditing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AudioUploadDropzone
              ref={audioInputRef}
              onFileSelected={handleAudioSelected}
            />
            {audioSrc && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <p className="text-xs font-medium mb-2 flex items-center gap-2">
                  <Play className="h-3 w-3 text-primary" />
                  Selected: {audioFile?.name}
                </p>
                <audio controls src={audioSrc} className="w-full h-8" />
              </div>
            )}
            {!audioSrc && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                <AlertCircle className="h-4 w-4" />
                No audio selected. You can still audit without audio.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evaluation Criteria */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Evaluation Criteria
          </CardTitle>
          <CardDescription>
            {selectedParameterSetId
              ? `Using scoring criteria from selected parameter set.`
              : 'Using default parameters. Select a parameter set to load specific criteria.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {parameters.map((param) => (
              <div
                key={param.id}
                className="p-4 rounded-lg border border-border bg-card/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{param.name}</span>
                    {param.isFatal && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-500">
                        FATAL
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {param.category}
                    </span>
                  </div>
                  {!param.isFatal && (
                    <span className="text-sm text-muted-foreground font-mono">
                      Weight: {param.weight}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={scores[param.id]?.score || 0}
                    onChange={(e) =>
                      handleScoreChange(param.id, parseInt(e.target.value))
                    }
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span
                    className={`text-lg font-bold min-w-[4rem] text-right font-mono ${
                      (scores[param.id]?.score || 0) >= 80
                        ? 'text-emerald-500'
                        : (scores[param.id]?.score || 0) >= 60
                          ? 'text-amber-500'
                          : 'text-red-500'
                    }`}
                  >
                    {scores[param.id]?.score || 0}%
                  </span>
                </div>
                <textarea
                  placeholder="Add observation or feedback..."
                  value={scores[param.id]?.comment || ''}
                  onChange={(e) =>
                    handleCommentChange(param.id, e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[60px]"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pb-8">
        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={saving}
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Draft
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={saving || !formData.agentName || !formData.callId}
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit Audit
        </Button>
      </div>
    </div>
  );
}
