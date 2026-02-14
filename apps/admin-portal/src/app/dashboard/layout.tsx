'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Server,
  Globe,
  BarChart2,
  Settings,
  Users,
  Bell,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  FileText,
  Megaphone,
  HardDrive,
  Terminal,
  Coins,
  MessageSquare,
  ClipboardCheck,
  Package,
  CreditCard,
} from 'lucide-react';
import { authApi } from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: MessageSquare },
  { href: '/dashboard/clients', label: 'Clients', icon: Building2 },
  { href: '/dashboard/instances', label: 'Instances', icon: Server },
  { href: '/dashboard/domains', label: 'Domains', icon: Globe },
  { href: '/dashboard/credits', label: 'Credits', icon: Coins },
  { href: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
  { href: '/dashboard/plans', label: 'Credit Plans', icon: Package },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/audits', label: 'Audits', icon: ClipboardCheck },
  { href: '/dashboard/templates', label: 'Templates', icon: FileText },
  { href: '/dashboard/backups', label: 'Backups', icon: HardDrive },
  { href: '/dashboard/logs', label: 'Deploy Logs', icon: Terminal },
  { href: '/dashboard/usage', label: 'Usage & Limits', icon: BarChart2 },
  { href: '/dashboard/tickets', label: 'Tickets', icon: FileText },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/dashboard/users', label: 'Admin Users', icon: Users },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/security', label: 'Security', icon: Shield },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    fullName?: string;
    username: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    // Basic Client-side Auth Guard
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      router.push('/login');
    } else {
      setIsChecking(false);
      authApi
        .me()
        .then((user) => setCurrentUser(user))
        .catch(() => { });
    }
  }, [router, pathname]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('authToken');
    router.push('/login');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} h-screen sticky top-0 bg-card/50 backdrop-blur border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                AQ
              </div>
              <span className="font-bold text-lg">Admin</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`}
                />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {currentUser?.fullName
                  ? currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  : 'SA'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentUser?.fullName || currentUser?.username || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser?.role || 'admin'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/30 backdrop-blur">
          <h1 className="text-lg font-bold">
            {navItems.find(
              (item) =>
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href)),
            )?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
