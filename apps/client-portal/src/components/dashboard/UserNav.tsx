
'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CreditCard, LogOut, Settings2, User } from 'lucide-react';
import { authApi } from '@/lib/api';

interface UserNavProps {
  handleLogout: () => void;
}

interface DisplayUser {
  fullName: string;
  emailOrUsername: string;
  avatarFallback: string;
}

export const UserNav: FC<UserNavProps> = ({ handleLogout }) => {
  const [displayUser, setDisplayUser] = useState<DisplayUser>({
    fullName: 'AssureQAI User',
    emailOrUsername: 'user@example.com',
    avatarFallback: 'AQ'
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const fetchUserDetails = async () => {
        try {
          const userDetails = await authApi.me();
          if (userDetails) {
            const fullName = userDetails.fullName || 'AssureQAI User';
            const emailOrUsername = userDetails.email || userDetails.username || 'user@example.com';
            const username = userDetails.username || 'AQ';
            
            setDisplayUser({
              fullName,
              emailOrUsername,
              avatarFallback: fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || username.substring(0, 2).toUpperCase()
            });
          }
        } catch (error) {
          console.error('Failed to fetch user details:', error);
        }
      };
      fetchUserDetails();
    }
  }, [isClient]);

  if (!isClient) {
      return (
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse"></div>
      );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://picsum.photos/seed/avatar-topnav/100/100" alt="User Avatar" data-ai-hint="user portrait" />
            <AvatarFallback>{displayUser.avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayUser.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">{displayUser.emailOrUsername}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/profile" passHref>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/billing" passHref>
            <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/add-user" passHref>
            <DropdownMenuItem>
                <Settings2 className="mr-2 h-4 w-4" />
                <span>Settings</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
