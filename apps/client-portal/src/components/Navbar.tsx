'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AssureQaiLogo } from '@/components/AssureQaiLogo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { name: 'Features', href: '/#features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

          {/* Desktop Links with Spotlight */}
          <div className="hidden md:flex items-center gap-1 bg-neutral-100 dark:bg-white/5 rounded-full px-2 py-1.5 border border-neutral-200 dark:border-white/5">
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.name}
                href={link.href}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative px-5 py-2 text-sm font-medium text-neutral-600 dark:text-gray-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {hoveredIndex === index && (
                  <div className="absolute inset-0 bg-white dark:bg-white/10 rounded-full -z-10 shadow-sm dark:shadow-none" />
                )}
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4 ml-8">
            <ThemeSwitcher variant="ghost" className="text-neutral-600 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10" />
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link href="/book-demo">
              <Button size="sm" className="rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-gray-200 font-semibold px-6 shadow-[0_0_15px_-3px_rgba(0,0,0,0.3)] dark:shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_-3px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_0_20px_-3px_rgba(255,255,255,0.5)] transition-shadow">
                Book Demo
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <ThemeSwitcher variant="ghost" className="text-neutral-600 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10" />
            <button
              className="text-neutral-900 dark:text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-20 z-40 bg-white/95 dark:bg-black/90 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-3xl p-6 flex flex-col gap-4 md:hidden shadow-2xl">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-lg font-medium text-neutral-600 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white py-3 border-b border-neutral-100 dark:border-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col gap-4 mt-4">
            <Link href="/login" className="text-center py-3 text-neutral-600 dark:text-white/80 font-medium">
              Log in
            </Link>
            <Link href="/book-demo">
              <Button className="w-full h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg">
                Book Demo
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
