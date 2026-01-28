import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './global.css';
import { QueryProvider } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'AssureQai Admin - Super Admin Portal',
  description: 'Manage clients, instances, and platform settings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`antialiased bg-background text-foreground ${inter.variable} ${outfit.variable} font-sans`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
