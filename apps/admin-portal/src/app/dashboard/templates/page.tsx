'use client';

import { useState } from 'react';
import { FileText, Search, Plus, Trash2, Edit, X, Loader2, Filter, Copy } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  type: 'sop' | 'parameter';
  industry: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
}

const mockTemplates: Template[] = [
  { id: '1', name: 'Insurance Claims SOP', type: 'sop', industry: 'Insurance', description: 'Standard SOP for insurance claims call handling', isDefault: true, createdAt: '2025-12-01' },
  { id: '2', name: 'Banking KYC Parameters', type: 'parameter', industry: 'Banking', description: 'QA parameters for KYC compliance calls', isDefault: true, createdAt: '2025-12-01' },
  { id: '3', name: 'Telecom Support SOP', type: 'sop', industry: 'Telecom', description: 'Standard SOP for telecom customer support', isDefault: true, createdAt: '2025-12-01' },
  { id: '4', name: 'Healthcare Compliance Parameters', type: 'parameter', industry: 'Healthcare', description: 'HIPAA-compliant QA parameters', isDefault: true, createdAt: '2025-12-01' },
  { id: '5', name: 'Retail Sales SOP', type: 'sop', industry: 'Retail', description: 'Sales call quality standards', isDefault: false, createdAt: '2026-01-05' },
];

const industries = ['Insurance', 'Banking', 'Telecom', 'Healthcare', 'Retail', 'E-commerce', 'Travel', 'Custom'];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(mockTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', type: 'sop', industry: 'Custom', description: '' });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesIndustry = industryFilter === 'all' || t.industry === industryFilter;
    return matchesSearch && matchesType && matchesIndustry;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    await new Promise(r => setTimeout(r, 1000));
    setTemplates(prev => [...prev, {
      id: Date.now().toString(),
      ...newTemplate,
      type: newTemplate.type as 'sop' | 'parameter',
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0],
    }]);
    setNewTemplate({ name: '', type: 'sop', industry: 'Custom', description: '' });
    setShowAddForm(false);
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Starter Templates</h2>
          <p className="text-muted-foreground">Industry-specific SOP and Parameter templates for new instances</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'Add Template'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-card/50 backdrop-blur rounded-xl border border-primary/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input
                  type="text"
                  required
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Template name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type *</label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="sop">SOP Template</option>
                  <option value="parameter">Parameter Template</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Industry *</label>
                <select
                  value={newTemplate.industry}
                  onChange={(e) => setNewTemplate({ ...newTemplate, industry: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Brief description"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Template
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
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="sop">SOP</option>
          <option value="parameter">Parameter</option>
        </select>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Industries</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-card/50 backdrop-blur rounded-xl border border-border p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${template.type === 'sop' ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}>
                  <FileText className={`h-5 w-5 ${template.type === 'sop' ? 'text-blue-500' : 'text-amber-500'}`} />
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${template.type === 'sop' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {template.type.toUpperCase()}
                  </span>
                </div>
              </div>
              {template.isDefault && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Default</span>
              )}
            </div>

            <h3 className="font-semibold mb-1">{template.name}</h3>
            <p className="text-xs text-muted-foreground mb-2">{template.industry}</p>
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{template.description}</p>
            )}

            <div className="flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                <Copy className="h-4 w-4" />
                Clone
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
