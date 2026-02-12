'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Plus,
  Shield,
  Loader2,
  AlertCircle,
  Trash2,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsers, useCreateUser, useDeleteUser } from '@/lib/hooks';
import type { User } from '@/lib/api';
import { useState } from 'react';

const USERS_PER_PAGE = 10;

export default function AddUserPage() {
  const [page, setPage] = useState(1);
  const {
    data: userData,
    isLoading,
    error,
    isPlaceholderData,
  } = useUsers(page, USERS_PER_PAGE);
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'agent',
  });

  // Get users from API
  const users: User[] = userData?.data || [];
  const totalUsers = userData?.pagination?.total || 0;
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE) || 1;

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync(newUser);
      setShowAddForm(false);
      setNewUser({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'agent',
      });
    } catch (err) {
      // Error handled by React Query
    }
  }

  async function handleDeleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUserMutation.mutateAsync(id);
    }
  }

  // Role options with display name and backend value
  const roleOptions = [
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Client Admin', value: 'client_admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'QA Analyst', value: 'qa_analyst' },
    { label: 'Auditor', value: 'auditor' },
    { label: 'Agent', value: 'agent' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state when no users exist
  if (users.length === 0 && !showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              User Management
            </h2>
            <p className="text-muted-foreground">
              Manage team members and permissions
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed to load users. Please check your API connection.
          </div>
        )}

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              No Users Found
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Add User" to create your first team member.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage team members and permissions
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {showAddForm ? 'Cancel' : 'Add User'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Some data may be outdated. Connection issue detected.
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <Card className="bg-card/50 backdrop-blur border-primary/50">
          <CardHeader>
            <CardTitle>New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleAddUser}
              className="grid gap-4 md:grid-cols-2"
            >
              <div>
                <label className="text-sm font-medium">Username *</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
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
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={newUser.fullName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="w-full"
                >
                  {createUserMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
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
            Team Members ({totalUsers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {(user.fullName || user.username || '?')
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.email || user.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{{
                      super_admin: 'Super Admin',
                      client_admin: 'Client Admin',
                      manager: 'Manager',
                      qa_analyst: 'QA Analyst',
                      auditor: 'Auditor',
                      agent: 'Agent',
                    }[user.role] || user.role}</span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}
                  >
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * USERS_PER_PAGE + 1}–
            {Math.min(page * USERS_PER_PAGE, totalUsers)} of {totalUsers} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isPlaceholderData}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
