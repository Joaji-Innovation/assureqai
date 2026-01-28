import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AssureQAi Privacy Policy - Learn how we collect, use, and protect your personal information and business data when using our AI-powered QA services.',
  keywords: ['privacy policy', 'data protection', 'GDPR', 'CCPA', 'AssureQAi privacy'],
  openGraph: {
    title: 'Privacy Policy | AssureQAi',
    description: 'Learn how AssureQAi collects, uses, and protects your personal information.',
    url: 'https://assureqai.com/legal/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://assureqai.com/legal/privacy',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
