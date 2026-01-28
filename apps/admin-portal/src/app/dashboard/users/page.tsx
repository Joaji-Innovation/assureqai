'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Plus, Shield, X, Loader2, Trash2, Mail } from 'lucide-react';
import { userApi, User } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'support', password: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch users (ideally filtering by admin roles, but for now fetching all and filtering locally if needed)
      // Adjust limit as necessary
      const response = await userApi.list({ limit: 100 });
      // Client-side filtering for admin/support/super_admin if the backend doesn't support role filter yet
      // Assuming the response structure matched api.ts update
      setUsers(response.data.filter(u => ['admin', 'super_admin', 'support'].includes(u.role)));
    } catch (error) {
      console.error('Failed to fetch admin users', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.fullName || user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      // Basic password generation or prompt could be added here. 
      // For simplicity, using a default or user provided one.
      const password = newUser.password || Math.random().toString(36).slice(-8);

      await userApi.create({
        username: newUser.email.split('@')[0],
        email: newUser.email,
        fullName: newUser.name,
        role: newUser.role,
        password: password
      });

      await fetchUsers(); // Refresh list
      setNewUser({ name: '', email: '', role: 'support', password: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create user', error);
      alert('Failed to create user');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to remove this admin user?')) {
      try {
        await userApi.delete(id);
        setUsers(prev => prev.filter(u => u._id !== id));
      } catch (error) {
        console.error('Failed to delete user', error);
        alert('Failed to delete user');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500/10 text-purple-500';
      case 'admin': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Users</h2>
          <p className="text-muted-foreground">Manage platform administrators</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'Add Admin'}
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-card/50 backdrop-blur rounded-xl border border-primary/50 p-6">
          <h3 className="text-lg font-semibold mb-4">New Admin User</h3>
          <form onSubmit={handleAddUser} className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email *</label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="user@assureqai.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="support">Support</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Password (Optional)</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                <Mail className="h-4 w-4" />
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredUsers.map((user) => (
            <div key={user._id} className="bg-card/50 backdrop-blur rounded-xl border border-border p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white font-bold">
                    {(user.fullName || user.username || '?').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.fullName || user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(user.createdAt || '').toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && filteredUsers.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No users found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
