'use client';

import { useState } from 'react';
import { Scale, Search, Plus, Play, CheckCircle, Users, Loader2, X, BarChart } from 'lucide-react';

interface EvaluatorScore {
  evaluatorId: string;
  evaluatorName: string;
  score: number;
  submittedAt: string;
}

interface Calibration {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed';
  evaluatorScores: EvaluatorScore[];
  targetScore?: number;
  averageScore?: number;
  consistencyRating?: number;
  createdAt: string;
  completedAt?: string;
}

const mockCalibrations: Calibration[] = [
  { 
    id: '1', 
    name: 'Q1 2026 Calibration Session', 
    description: 'Quarterly calibration for all QA analysts',
    status: 'completed',
    evaluatorScores: [
      { evaluatorId: '1', evaluatorName: 'Alice', score: 82, submittedAt: '2026-01-10' },
      { evaluatorId: '2', evaluatorName: 'Bob', score: 78, submittedAt: '2026-01-10' },
      { evaluatorId: '3', evaluatorName: 'Carol', score: 80, submittedAt: '2026-01-10' },
    ],
    targetScore: 80,
    averageScore: 80,
    consistencyRating: 92,
    createdAt: '2026-01-08',
    completedAt: '2026-01-10'
  },
  { 
    id: '2', 
    name: 'New Hire Training Calibration', 
    description: 'Calibration for new QA team members',
    status: 'in_progress',
    evaluatorScores: [
      { evaluatorId: '1', evaluatorName: 'Alice', score: 75, submittedAt: '2026-01-16' },
    ],
    targetScore: 75,
    averageScore: 75,
    createdAt: '2026-01-15'
  },
  { 
    id: '3', 
    name: 'Complex Case Review', 
    description: 'Calibration for handling escalated calls',
    status: 'draft',
    evaluatorScores: [],
    createdAt: '2026-01-17'
  },
];

export default function CalibrationPage() {
  const [calibrations, setCalibrations] = useState(mockCalibrations);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCalibration, setNewCalibration] = useState({ name: '', description: '', targetScore: 80 });
  const [adding, setAdding] = useState(false);
  const [selectedCalibration, setSelectedCalibration] = useState<Calibration | null>(null);
  const [myScore, setMyScore] = useState<number>(75);
  const [submitting, setSubmitting] = useState(false);

  const filteredCalibrations = calibrations.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    await new Promise(r => setTimeout(r, 1000));
    setCalibrations(prev => [...prev, {
      id: Date.now().toString(),
      ...newCalibration,
      status: 'draft',
      evaluatorScores: [],
      createdAt: new Date().toISOString().split('T')[0],
    }]);
    setNewCalibration({ name: '', description: '', targetScore: 80 });
    setShowAddForm(false);
    setAdding(false);
  };

  const handleStart = async (id: string) => {
    setCalibrations(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'in_progress' as const } : c
    ));
  };

  const handleSubmitScore = async () => {
    if (!selectedCalibration) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setCalibrations(prev => prev.map(c => {
      if (c.id === selectedCalibration.id) {
        const newScores = [...c.evaluatorScores, {
          evaluatorId: 'current',
          evaluatorName: 'You',
          score: myScore,
          submittedAt: new Date().toISOString().split('T')[0]
        }];
        const avg = newScores.reduce((a, b) => a + b.score, 0) / newScores.length;
        return {
          ...c,
          evaluatorScores: newScores,
          averageScore: Math.round(avg * 10) / 10
        };
      }
      return c;
    }));
    setSelectedCalibration(null);
    setSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500';
      case 'completed': return 'bg-emerald-500/10 text-emerald-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calibration Sessions</h2>
          <p className="text-muted-foreground">Multi-evaluator scoring consistency sessions</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'New Session'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-card/50 backdrop-blur rounded-xl border border-primary/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Create Calibration Session</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input
                  type="text"
                  required
                  value={newCalibration.name}
                  onChange={(e) => setNewCalibration({ ...newCalibration, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Session name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCalibration.targetScore}
                  onChange={(e) => setNewCalibration({ ...newCalibration, targetScore: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <input
                type="text"
                value={newCalibration.description}
                onChange={(e) => setNewCalibration({ ...newCalibration, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brief description"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Session
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Calibrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCalibrations.map((calibration) => (
          <div key={calibration.id} className="bg-card/50 backdrop-blur rounded-xl border border-border p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(calibration.status)}`}>
                {calibration.status.replace('_', ' ')}
              </span>
            </div>

            <h3 className="font-semibold mb-1">{calibration.name}</h3>
            {calibration.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{calibration.description}</p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Evaluators</p>
                <p className="font-bold flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" />
                  {calibration.evaluatorScores.length}
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="font-bold">{calibration.averageScore ?? '—'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Consistency</p>
                <p className="font-bold">{calibration.consistencyRating ? `${calibration.consistencyRating}%` : '—'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {calibration.status === 'draft' && (
                <button
                  onClick={() => handleStart(calibration.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Start
                </button>
              )}
              {calibration.status === 'in_progress' && (
                <button
                  onClick={() => setSelectedCalibration(calibration)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <BarChart className="h-4 w-4" />
                  Submit Score
                </button>
              )}
              {calibration.status === 'completed' && (
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  View Results
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Score Modal */}
      {selectedCalibration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Submit Your Score</h3>
            
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Session</p>
              <p className="font-medium">{selectedCalibration.name}</p>
            </div>

            {selectedCalibration.targetScore && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Target Score</p>
                <p className="text-2xl font-bold">{selectedCalibration.targetScore}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="text-sm font-medium">Your Score *</label>
              <input
                type="number"
                min="0"
                max="100"
                value={myScore}
                onChange={(e) => setMyScore(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Score
              </button>
              <button
                onClick={() => setSelectedCalibration(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
