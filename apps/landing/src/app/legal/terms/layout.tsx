import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AssureQAi Terms of Service - Read the terms and conditions governing your use of our AI-powered quality assurance platform.',
  keywords: ['terms of service', 'terms and conditions', 'user agreement', 'AssureQAi terms'],
  openGraph: {
    title: 'Terms of Service | AssureQAi',
    description: 'Read the terms and conditions governing your use of AssureQAi.',
    url: 'https://assureqai.com/legal/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://assureqai.com/legal/terms',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
