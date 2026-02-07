'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AssureQaiLogo } from '@/components/AssureQaiLogo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';

// Adjusted links for Admin Portal context but keeping structure
const NAV_LINKS: { name: string; href: string }[] = [
  // Keeping empty for Admin Portal login screen to avoid clutter
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={cn(
          'fixed top-4 left-0 right-0 mx-auto z-50 w-[95%] max-w-5xl rounded-full transition-all duration-300',
          scrolled
            ? 'bg-white/60 dark:bg-black/60 backdrop-blur-xl border border-neutral-200 dark:border-white/10 shadow-[0_0_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_-10px_rgba(255,255,255,0.1)] py-2 px-4'
            : 'bg-transparent py-4 px-2'
        )}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="https://assureqai.com" className="flex items-center gap-2 mr-8">
            <AssureQaiLogo
              showIcon={true}
              showLogo={true}
              width={120}
              className="h-8 w-auto"
            />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-8">
            <ThemeSwitcher variant="ghost" className="text-neutral-600 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10" />

            {/* Removed "Log in" link since we are ON the login page */}
            {/* Removed "Book Demo" link for admin portal */}
            <div className="text-sm font-medium text-neutral-600 dark:text-gray-400">
              Admin Portal
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
