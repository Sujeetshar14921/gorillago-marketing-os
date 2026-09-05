import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6"><Link href="/" aria-label="GorillaGO home"><Logo /></Link><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back home</Link></div></header>
      <article className="mx-auto max-w-3xl px-6 py-16"><p className="text-sm font-medium text-accent">Legal</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Privacy Policy</h1><p className="mt-3 text-sm text-muted-foreground">Last updated: September 5, 2026</p><div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground"><section><h2 className="text-lg font-semibold text-foreground">Information we use</h2><p className="mt-2">We use account, organization, product, campaign, and generation data to provide GorillaGO features, protect the service, and improve reliability.</p></section><section><h2 className="text-lg font-semibold text-foreground">Your generated content</h2><p className="mt-2">Generated images, videos, copy, and related metadata are stored with your organization so you can review, edit, approve, and reuse them.</p></section><section><h2 className="text-lg font-semibold text-foreground">Service providers</h2><p className="mt-2">Some features use infrastructure and AI providers to process requests. We share only the data needed to provide the requested feature and do not sell your personal information.</p></section><section><h2 className="text-lg font-semibold text-foreground">Your choices</h2><p className="mt-2">You can request account or data support by contacting <a className="text-accent hover:underline" href="mailto:support@gorillago.com">support@gorillago.com</a>. Disconnect integrations when you no longer want GorillaGO to access them.</p></section><section><h2 className="text-lg font-semibold text-foreground">Updates</h2><p className="mt-2">We may update this policy as the service changes. The date above shows when the latest version was published.</p></section></div></article>
    </main>
  );
}
