import './global.css';
import { Inter, Outfit } from 'next/font/google';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ui/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'AssureQai - AI-Powered Call Center Quality Assurance',
  description: 'Transform your call center QA with AI-powered audits, real-time analytics, and intelligent agent coaching.',
  keywords: ['call center', 'quality assurance', 'AI', 'audit', 'analytics', 'agent performance'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
