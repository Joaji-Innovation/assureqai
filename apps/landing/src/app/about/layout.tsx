import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Our Mission & Team',
  description: 'Meet the team behind AssureQAi. We are practitioners who built the AI-powered QA platform to audit 100% of customer interactions, eliminating the bottleneck of manual QA.',
  keywords: ['about AssureQAi', 'QA automation team', 'AI company', 'quality assurance startup'],
  openGraph: {
    title: 'About AssureQAi - The Architects of Automated QA',
    description: 'Meet the team behind AssureQAi. We are practitioners who built the AI-powered QA platform to audit 100% of customer interactions.',
    url: 'https://assureqai.com/about',
    images: [
      {
        url: '/og/about.png',
        width: 1200,
        height: 630,
        alt: 'About AssureQAi - Our Mission and Team',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About AssureQAi - The Architects of Automated QA',
    description: 'Meet the team behind AssureQAi. We are practitioners who built the AI-powered QA platform.',
    images: ['/og/about.png'],
    site: '@assureQAI',
    creator: '@assureQAI',
  },
  alternates: {
    canonical: 'https://assureqai.com/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
