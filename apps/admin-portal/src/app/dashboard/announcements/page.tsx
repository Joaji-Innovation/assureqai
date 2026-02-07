'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Search, Plus, Trash2, Edit, X, Loader2, Clock, Users, AlertTriangle, Info, Wrench, Sparkles } from 'lucide-react';
import { announcementApi, Announcement } from '@/lib/api';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info', audience: 'all' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementApi.list(true); // Get all, including inactive
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const created = await announcementApi.create({
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        type: newAnnouncement.type as Announcement['type'],
        audience: newAnnouncement.audience as Announcement['audience'],
        isActive: true,
      });
      setAnnouncements(prev => [...prev, created]);
      setNewAnnouncement({ title: '', message: '', type: 'info', audience: 'all' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setToggling(id);
    try {
      if (isActive) {
        await announcementApi.deactivate(id);
        setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, isActive: false } : a));
      } else {
        await announcementApi.update(id, { isActive: true });
        setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, isActive: true } : a));
      }
    } catch (error) {
      console.error('Failed to toggle announcement:', error);
      alert('Failed to update announcement');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    setDeleting(id);
    try {
      await announcementApi.delete(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert('Failed to delete announcement');
    } finally {
      setDeleting(null);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
      {filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12 bg-card/50 rounded-xl border border-border">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search' : 'Create your first announcement'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div key={announcement._id} className={`bg-card/50 backdrop-blur rounded-xl border p-5 transition-colors ${announcement.isActive ? 'border-border hover:border-primary/50' : 'border-border/50 opacity-60'}`}>
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
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(announcement._id, announcement.isActive)}
                    disabled={toggling === announcement._id}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors disabled:opacity-50 ${announcement.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}
                  >
                    {toggling === announcement._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      announcement.isActive ? 'Active' : 'Inactive'
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{announcement.message}</p>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(announcement._id)}
                  disabled={deleting === announcement._id}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting === announcement._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
