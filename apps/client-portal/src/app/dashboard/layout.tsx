'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { AssureQaiLogo } from '@/components/AssureQaiLogo';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { motion } from 'framer-motion';
import {
  BarChart2,
  ClipboardList,
  Edit,
  Layers,
  BookText,
  ListChecks,
  Users,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Coins,
  UploadCloud,
  FileText,
  Bell,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { authApi } from '@/lib/api';

interface User {
  username: string;
  fullName?: string;
  email?: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuditsOpen, setIsAuditsOpen] = useState(true);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userData = await authApi.me();
        // Cast to User type or ensure types match
        setCurrentUser(userData as unknown as User);
        setIsLoadingAuth(false);
      } catch (error: any) {
        console.error('Error fetching user details:', error);
        // Only redirect on auth errors, not network errors
        if (error.message.includes('401') || error.message.includes('403')) {
          router.push('/login');
        } else {
          // Keep loading false but don't redirect (maybe show error toast?)
          setIsLoadingAuth(false);
        }
      }
    };
    fetchUserDetails();
    setIsClient(true);
  }, [router]);

  const allNavItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      tabName: 'overview',
      icon: BarChart2,
      type: 'link',
      roles: ['super_admin', 'client_admin', 'manager', 'qa_analyst', 'auditor', 'agent'],
    },
    {
      label: 'Audits',
      icon: ClipboardList,
      type: 'collapsible',
      tabName: 'audits_group',
      roles: ['super_admin', 'client_admin', 'manager', 'qa_analyst', 'auditor'],
      subItems: [
        {
          href: '/dashboard/qa-audit',
          label: 'QAi Audit Form',
          tabName: 'qa-audit',
          icon: Layers,
          roles: ['super_admin', 'client_admin', 'manager', 'qa_analyst', 'auditor'],
        },
        {
          href: '/dashboard/manual-audit',
          label: 'Manual Audit Form',
          tabName: 'manual-audit',
          icon: Edit,
          roles: ['super_admin', 'client_admin', 'manager', 'qa_analyst', 'auditor'],
        },
        {
          href: '/dashboard/qa-audit/bulk',
          label: 'Bulk AI Audit',
          tabName: 'qa-audit-bulk',
          icon: UploadCloud,
          roles: ['super_admin', 'client_admin', 'manager', 'qa_analyst', 'auditor'],
        },
      ],
    },
    {
      href: '/dashboard/sop-management',
      label: 'SOP Management',
      tabName: 'sop-management',
      icon: BookText,
      type: 'link',
      roles: ['super_admin', 'client_admin', 'manager'],
    },
    {
      href: '/dashboard/parameter-management',
      label: 'Parameter Management',
      tabName: 'parameter-management',
      icon: ListChecks,
      type: 'link',
      roles: ['super_admin', 'client_admin', 'manager'],
    },
    {
      href: '/dashboard/profile',
      label: 'Profile',
      tabName: 'profile',
      icon: UserIcon,
      type: 'link',
      roles: ['super_admin', 'client_admin', 'manager', 'qa_analyst', 'auditor', 'agent'],
    },
    {
      href: '/dashboard/add-user',
      label: 'User Management',
      tabName: 'add-user',
      icon: Users,
      type: 'link',
      roles: ['super_admin', 'client_admin'],
    },
    {
      href: '/dashboard/audit-details',
      label: 'Audit Details',
      tabName: 'audit-details',
      icon: FileText,
      type: 'link',
      roles: ['super_admin', 'client_admin', 'manager', 'qa_analyst'],
    },
    {
      href: '/dashboard/agents',
      label: 'Agent Performance',
      tabName: 'agents',
      icon: Users,
      type: 'link',
      roles: ['super_admin', 'client_admin', 'manager'],
    },
    // Hidden for now - features not yet connected to API
    // {
    //   href: '/dashboard/disputes',
    //   label: 'Disputes',
    //   tabName: 'disputes',
    //   icon: AlertTriangle,
    //   type: 'link',
    //   roles: ['super_admin', 'client_admin', 'manager'],
    // },
    // {
    //   href: '/dashboard/calibration',
    //   label: 'Calibration',
    //   tabName: 'calibration',
    //   icon: Scale,
    //   type: 'link',
    //   roles: ['super_admin', 'client_admin', 'manager', 'qa_analyst'],
    // },
    {
      href: '/dashboard/notifications',
      label: 'Notifications',
      tabName: 'notifications',
      icon: Bell,
      type: 'link',
      roles: ['super_admin', 'client_admin', 'manager'],
    },
  ];

  const navItems = currentUser
    ? allNavItems
      .filter((item) => item.roles.includes(currentUser.role))
      .map((item) => {
        if (item.type === 'collapsible' && item.subItems) {
          const filteredSubItems = item.subItems.filter((subItem) =>
            subItem.roles.includes(currentUser.role)
          );
          if (filteredSubItems.length === 0) return null;
          return { ...item, subItems: filteredSubItems };
        }
        return item;
      })
      .filter(Boolean)
    : allNavItems;

  const auditTabNames =
    allNavItems
      .find((i) => i.type === 'collapsible')
      ?.subItems?.map((si) => si.tabName) || [];
  const isAuditGroupActive = auditTabNames.some((name) =>
    pathname.includes(name)
  );

  useEffect(() => {
    if (isAuditGroupActive) {
      setIsAuditsOpen(true);
    }
  }, [isAuditGroupActive]);

  if (!isClient || isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error during logout:', error);
    }
    router.replace('/login');
  };

  type NavLink = {
    href: string;
    label: string;
    tabName: string;
    icon: React.ForwardRefExoticComponent<
      Omit<React.SVGProps<SVGSVGElement>, 'ref'> &
      React.RefAttributes<SVGSVGElement>
    >;
  };

  const allNavLinks = allNavItems.flatMap((item) =>
    item.type === 'link'
      ? [item as NavLink]
      : item.subItems
        ? (item.subItems.filter(
          (subItem) => subItem.href !== undefined
        ) as NavLink[])
        : []
  );
  let currentPageLabel = (allNavLinks as NavLink[]).find(
    (item) => item.href && pathname.startsWith(item.href)
  )?.label;

  if (pathname === '/dashboard') {
    currentPageLabel = 'Dashboard';
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border/50 bg-sidebar/80 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/50 shadow-2xl">
        <SidebarHeader className="h-[72px] flex items-center justify-center border-b border-sidebar-border/30 bg-sidebar/20">
          <Link href="/dashboard" className="flex items-center justify-center w-full h-full p-2 group-data-[collapsible=icon]:p-0 transition-all duration-300">
            <AssureQaiLogo className="h-10 w-auto transition-all group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:opacity-0" />
            <div className="hidden group-data-[collapsible=icon]:flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart2 className="h-5 w-5" />
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4 gap-1">
          <SidebarMenu>
            {navItems.map((item) => {
              if (!item) return null;
              if (item.type === 'link') {
                const isLinkActive = Boolean(
                  item.href &&
                  (pathname === item.href ||
                    (pathname.startsWith(item.href) &&
                      item.href !== '/dashboard'))
                );
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isLinkActive}
                      tooltip={isMobile ? undefined : item.label}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 
                        ${isLinkActive
                          ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:pl-4'}
                      `}
                    >
                      {item.href !== undefined && (
                        <Link href={item.href} className="w-full h-full flex items-center gap-3 relative">
                          {isLinkActive && (
                            <motion.div
                              layoutId="active-nav-border"
                              className="absolute -left-3 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 24 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                          <item.icon className={`h-5 w-5 transition-colors duration-200 ${isLinkActive ? 'text-primary fill-primary/20' : 'text-sidebar-foreground/70 group-hover:text-primary'}`} />
                          <span className="text-sm tracking-tight">{item.label}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
              if (item.type === 'collapsible') {
                return (
                  <Collapsible
                    key={item.label}
                    open={isAuditsOpen}
                    onOpenChange={setIsAuditsOpen}
                    className="group/collapsible w-full space-y-1"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={`
                             w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200
                             ${isAuditGroupActive
                              ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:pl-4'}
                           `}
                          isActive={isAuditGroupActive}
                          tooltip={isMobile ? undefined : item.label}
                        >
                          {isAuditGroupActive && (
                            <motion.div
                              layoutId="active-nav-border-collapsible"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full"
                            />
                          )}
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-5 w-5 transition-colors duration-200 ${isAuditGroupActive ? 'text-primary fill-primary/20' : 'text-sidebar-foreground/70 group-hover:text-primary'}`} />
                            <span className="text-sm tracking-tight">{item.label}</span>
                          </div>
                          <ChevronDown
                            className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${isAuditsOpen ? 'rotate-180 text-primary' : 'text-sidebar-foreground/50'
                              }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="pl-3 pr-1 py-1 space-y-0.5 ml-3 border-l border-sidebar-border/50"
                      >
                        {item.subItems !== undefined && (
                          <SidebarMenu>
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname.startsWith(subItem.href);
                              return (
                                <SidebarMenuItem key={subItem.label}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={isSubActive}
                                    tooltip={isMobile ? undefined : subItem.label}
                                    size="sm"
                                    className={`
                                      h-9 px-3 rounded-lg transition-all duration-200 text-sm
                                      ${isSubActive
                                        ? 'text-primary font-medium bg-primary/10'
                                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}
                                    `}
                                  >
                                    <Link href={subItem.href} className="flex items-center gap-2.5">
                                      <subItem.icon className="h-4 w-4 opacity-80" />
                                      <span>{subItem.label}</span>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              );
                            })}
                          </SidebarMenu>
                        )}
                      </motion.div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              }
              return null;
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border/30 bg-sidebar/10">
          {currentUser && (
            <div className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent/50 cursor-pointer overflow-hidden`}>
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                  {currentUser.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : 'AQ'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-sidebar-background"></div>
              </div>

              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm font-semibold truncate text-sidebar-foreground">
                  {currentUser.fullName || 'User'}
                </span>
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {currentUser.email || currentUser.username}
                </span>
              </div>

              <div className="ml-auto group-data-[collapsible=icon]:hidden">
                <ThemeSwitcher />
              </div>
            </div>
          )}

          <div className="mt-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={isMobile ? undefined : 'Log out'}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors justify-start px-3 py-2.5 rounded-xl font-medium w-full group-data-[collapsible=icon]:justify-center"
              >
                <LogOut className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Log out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md px-6 transition-all duration-300">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 h-9 w-9 text-muted-foreground hover:text-foreground" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 leading-tight">{currentPageLabel}</h1>
              <span className="text-xs text-muted-foreground font-medium">Overview & Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground hidden sm:block">
              Last updated: <span className="font-mono text-foreground/80">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/30 via-background to-background">
          <div className="mx-auto max-w-7xl animate-in fade-in-50 duration-500 slide-in-from-bottom-4">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const dynamic = 'force-dynamic';
