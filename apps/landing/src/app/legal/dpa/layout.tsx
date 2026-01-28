import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Agreement (DPA)',
  description: 'AssureQAi Data Processing Agreement - Our commitment to data protection and compliance with GDPR and other data privacy regulations.',
  keywords: ['DPA', 'data processing agreement', 'GDPR compliance', 'data protection', 'AssureQAi DPA'],
  openGraph: {
    title: 'Data Processing Agreement | AssureQAi',
    description: 'Our commitment to data protection and compliance with GDPR and other data privacy regulations.',
    url: 'https://assureqai.com/legal/dpa',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://assureqai.com/legal/dpa',
  },
};

export default function DPALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
