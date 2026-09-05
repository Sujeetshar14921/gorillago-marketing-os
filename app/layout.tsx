import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GorillaGO — AI Marketing Operating System',
  description:
    'Automate your entire digital marketing lifecycle with AI. Content, social media, advertising, analytics — all from one intelligent platform.',
  openGraph: {
    title: 'GorillaGO — AI Marketing Operating System',
    description:
      'Automate your entire digital marketing lifecycle with AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GorillaGO — AI Marketing Operating System',
    description:
      'Automate your entire digital marketing lifecycle with AI.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
