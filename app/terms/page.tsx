import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6"><Link href="/" aria-label="GorillaGO home"><Logo /></Link><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back home</Link></div></header>
      <article className="mx-auto max-w-3xl px-6 py-16"><p className="text-sm font-medium text-accent">Legal</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Terms of Service</h1><p className="mt-3 text-sm text-muted-foreground">Last updated: September 5, 2026</p><div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground"><section><h2 className="text-lg font-semibold text-foreground">Using GorillaGO</h2><p className="mt-2">GorillaGO provides marketing workflow and content generation tools. You are responsible for the information you provide, the content you approve, and how you use generated materials.</p></section><section><h2 className="text-lg font-semibold text-foreground">Your content and approvals</h2><p className="mt-2">Review product facts, prices, claims, rights, and platform rules before publishing. AI output may contain mistakes and should be checked by a human.</p></section><section><h2 className="text-lg font-semibold text-foreground">Acceptable use</h2><p className="mt-2">Do not use GorillaGO for unlawful, deceptive, harmful, infringing, or fraudulent campaigns. We may limit access when necessary to protect users and the service.</p></section><section><h2 className="text-lg font-semibold text-foreground">Service changes</h2><p className="mt-2">Features, limits, models, and pricing may change as the product evolves. We will make reasonable efforts to keep the service available and communicate material changes.</p></section><section><h2 className="text-lg font-semibold text-foreground">Contact</h2><p className="mt-2">Questions about these terms can be sent to <a className="text-accent hover:underline" href="mailto:support@gorillago.com">support@gorillago.com</a>.</p></section></div></article>
    </main>
  );
}
