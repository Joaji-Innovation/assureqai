'use client';

import { useState } from 'react';
import { Megaphone, Search, Plus, Trash2, Edit, X, Loader2, Clock, Users, AlertTriangle, Info, Wrench, Sparkles } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance' | 'update';
  audience: 'all' | 'admins' | 'specific';
  isActive: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  createdAt: string;
}

const mockAnnouncements: Announcement[] = [
  { id: '1', title: 'Platform Update v2.5', message: 'We are releasing new features including improved AI accuracy and faster processing.', type: 'update', audience: 'all', isActive: true, createdAt: '2026-01-17' },
  { id: '2', title: 'Scheduled Maintenance', message: 'The platform will be under maintenance on Jan 20 from 2-4 AM UTC.', type: 'maintenance', audience: 'all', isActive: true, scheduledAt: '2026-01-20T02:00:00Z', createdAt: '2026-01-15' },
  { id: '3', title: 'API Rate Limit Changes', message: 'Starting Feb 1, API rate limits will be adjusted for better performance.', type: 'warning', audience: 'admins', isActive: true, createdAt: '2026-01-10' },
  { id: '4', title: 'Holiday Support Hours', message: 'Support hours will be reduced during the holiday period.', type: 'info', audience: 'all', isActive: false, expiresAt: '2026-01-02', createdAt: '2025-12-20' },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info', audience: 'all' });

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    await new Promise(r => setTimeout(r, 1000));
    setAnnouncements(prev => [...prev, {
      id: Date.now().toString(),
      ...newAnnouncement,
      type: newAnnouncement.type as any,
      audience: newAnnouncement.audience as any,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    }]);
    setNewAnnouncement({ title: '', message: '', type: 'info', audience: 'all' });
    setShowAddForm(false);
    setAdding(false);
  };

  const handleToggle = (id: string) => {
    setAnnouncements(prev => prev.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'update': return <Sparkles className="h-4 w-4 text-emerald-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500/10 text-blue-500';
      case 'warning': return 'bg-amber-500/10 text-amber-500';
      case 'maintenance': return 'bg-orange-500/10 text-orange-500';
      case 'update': return 'bg-emerald-500/10 text-emerald-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Announcements</h2>
          <p className="text-muted-foreground">Broadcast messages and maintenance notices to clients</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-card/50 backdrop-blur rounded-xl border border-primary/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Create Announcement</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                type="text"
                required
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message *</label>
              <textarea
                required
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                placeholder="Announcement message"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={newAnnouncement.type}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="update">Update</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Audience</label>
                <select
                  value={newAnnouncement.audience}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, audience: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Clients</option>
                  <option value="admins">Admins Only</option>
                  <option value="specific">Specific Instances</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish Announcement
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} className={`bg-card/50 backdrop-blur rounded-xl border p-5 transition-colors ${announcement.isActive ? 'border-border hover:border-primary/50' : 'border-border/50 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getTypeColor(announcement.type)}`}>
                  {getTypeIcon(announcement.type)}
                </div>
                <div>
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded-full ${getTypeColor(announcement.type)}`}>
                      {announcement.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {announcement.audience}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {announcement.createdAt}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(announcement.id)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${announcement.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}
                >
                  {announcement.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{announcement.message}</p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(announcement.id)}
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
