import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Transparent Scale, Zero Surprises',
  description: 'Flexible, volume-based pricing that adapts to your needs. Start at ₹10/call and scale down to ₹2/call as your volume grows. No hidden fees, no surprises.',
  keywords: ['QA pricing', 'call auditing cost', 'AI QA pricing', 'conversation analytics pricing'],
  openGraph: {
    title: 'AssureQAi Pricing - Transparent Scale, Zero Surprises',
    description: 'Flexible, volume-based pricing that adapts to your needs. Start at ₹10/call and scale down as you grow.',
    url: 'https://assureqai.com/pricing',
    images: [
      {
        url: '/og/pricing.png',
        width: 1200,
        height: 630,
        alt: 'AssureQAi Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AssureQAi Pricing - Transparent Scale, Zero Surprises',
    description: 'Flexible, volume-based pricing that adapts to your needs.',
    images: ['/og/pricing.png'],
    site: '@assureQAI',
    creator: '@assureQAI',
  },
  alternates: {
    canonical: 'https://assureqai.com/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
