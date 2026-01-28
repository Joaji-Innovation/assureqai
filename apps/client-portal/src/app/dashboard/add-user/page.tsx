'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Shield, Loader2, AlertCircle, Trash2, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsers, useCreateUser, useDeleteUser } from '@/lib/hooks';
import type { User } from '@/lib/api';
import { useState } from 'react';

export default function AddUserPage() {
  const { data: userData, isLoading, error } = useUsers(1, 50);
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', email: '', role: 'Agent' });

  // Use mock data when API is not available
  const users: User[] = userData?.data?.length ? userData.data : [
    { _id: '1', username: 'john.doe', fullName: 'John Doe', email: 'john@example.com', role: 'Manager', isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { _id: '2', username: 'jane.smith', fullName: 'Jane Smith', email: 'jane@example.com', role: 'QA Analyst', isActive: true, createdAt: '2026-01-02T00:00:00Z' },
    { _id: '3', username: 'bob.wilson', fullName: 'Bob Wilson', email: 'bob@example.com', role: 'Agent', isActive: false, createdAt: '2026-01-03T00:00:00Z' },
    { _id: '4', username: 'alice.brown', fullName: 'Alice Brown', email: 'alice@example.com', role: 'Auditor', isActive: true, createdAt: '2026-01-04T00:00:00Z' },
  ];

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync(newUser);
      setShowAddForm(false);
      setNewUser({ username: '', password: '', fullName: '', email: '', role: 'Agent' });
    } catch (err) {
      // Error handled by React Query
    }
  }

  async function handleDeleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUserMutation.mutateAsync(id);
    }
  }

  const roles = ['Administrator', 'Manager', 'QA Analyst', 'Auditor', 'Agent'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage team members and permissions</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'Add User'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Using demo data. Connect API at NEXT_PUBLIC_API_URL
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <Card className="bg-card/50 backdrop-blur border-primary/50">
          <CardHeader>
            <CardTitle>New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Username *</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={createUserMutation.isPending} className="w-full">
                  {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {(user.fullName || user.username).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.fullName || user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email || user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.role}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
