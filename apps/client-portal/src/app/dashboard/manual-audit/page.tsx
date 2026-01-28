'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, ClipboardList, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditParameter {
  id: string;
  name: string;
  weight: number;
  category: string;
  isFatal: boolean;
}

export default function ManualAuditPage() {
  const [formData, setFormData] = useState({
    agentName: '',
    teamLead: '',
    callId: '',
    callDate: '',
    callType: 'Inbound Support',
  });

  const [parameters] = useState<AuditParameter[]>([
    { id: '1', name: 'Greeting & Opening', weight: 10, category: 'Opening', isFatal: false },
    { id: '2', name: 'Problem Identification', weight: 15, category: 'Discovery', isFatal: false },
    { id: '3', name: 'Solution Provided', weight: 20, category: 'Resolution', isFatal: false },
    { id: '4', name: 'Tone & Professionalism', weight: 15, category: 'Soft Skills', isFatal: false },
    { id: '5', name: 'Closing & Wrap-up', weight: 10, category: 'Closing', isFatal: false },
    { id: '6', name: 'Data Protection Compliance', weight: 0, category: 'Compliance', isFatal: true },
  ]);

  const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleScoreChange = (paramId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [paramId]: { ...prev[paramId], score: value, comment: prev[paramId]?.comment || '' }
    }));
  };

  const handleCommentChange = (paramId: string, comment: string) => {
    setScores(prev => ({
      ...prev,
      [paramId]: { ...prev[paramId], comment, score: prev[paramId]?.score || 0 }
    }));
  };

  const calculateOverallScore = () => {
    let totalWeight = 0;
    let weightedScore = 0;
    let hasFatalFail = false;

    parameters.forEach(param => {
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
    return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  };

  const handleSubmit = async (isDraft: boolean) => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const overallScore = calculateOverallScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manual Audit Form</h2>
          <p className="text-muted-foreground">Traditional quality assessment</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall Score:</span>
          <span className={`text-2xl font-bold ${overallScore >= 80 ? 'text-emerald-500' : overallScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
            {overallScore}%
          </span>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm flex items-center gap-2">
          <Save className="h-4 w-4" />
          Audit saved successfully!
        </div>
      )}

      {/* Call Details */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Audit Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Agent Name *</label>
              <input
                type="text"
                value={formData.agentName}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter agent name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Team Lead</label>
              <input
                type="text"
                value={formData.teamLead}
                onChange={(e) => setFormData({ ...formData, teamLead: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter team lead name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Call ID *</label>
              <input
                type="text"
                value={formData.callId}
                onChange={(e) => setFormData({ ...formData, callId: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter call ID"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Call Date *</label>
              <input
                type="date"
                value={formData.callDate}
                onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Call Type</label>
              <select
                value={formData.callType}
                onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Inbound Support</option>
                <option>Outbound Sales</option>
                <option>Customer Service</option>
                <option>Technical Support</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Criteria */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Evaluation Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {parameters.map((param) => (
              <div key={param.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{param.name}</span>
                    {param.isFatal && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-500">
                        FATAL
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ({param.category})
                    </span>
                  </div>
                  {!param.isFatal && (
                    <span className="text-sm text-muted-foreground">Weight: {param.weight}%</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scores[param.id]?.score || 0}
                    onChange={(e) => handleScoreChange(param.id, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className={`text-lg font-bold min-w-[4rem] text-right ${
                    (scores[param.id]?.score || 0) >= 80 ? 'text-emerald-500' : 
                    (scores[param.id]?.score || 0) >= 60 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {scores[param.id]?.score || 0}%
                  </span>
                </div>
                <textarea
                  placeholder="Add comment (optional)"
                  value={scores[param.id]?.comment || ''}
                  onChange={(e) => handleCommentChange(param.id, e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => handleSubmit(true)} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Draft
        </Button>
        <Button onClick={() => handleSubmit(false)} disabled={saving || !formData.agentName || !formData.callId}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit Audit
        </Button>
      </div>
    </div>
  );
}
