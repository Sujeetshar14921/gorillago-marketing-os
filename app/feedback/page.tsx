'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MessageSquare } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" aria-label="GorillaGO home"><Logo /></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back home</Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><MessageSquare className="h-5 w-5" /></div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Tell us what to improve</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">Your feedback helps us make GorillaGO more useful, trustworthy, and effective for growing businesses.</p>
          <p className="mt-6 text-sm text-muted-foreground">For urgent account help, email <a href="mailto:support@gorillago.com" className="text-accent hover:underline">support@gorillago.com</a>.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          {submitted ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center"><CheckCircle2 className="h-10 w-10 text-success" /><h2 className="mt-4 text-xl font-semibold">Thanks for the feedback</h2><p className="mt-2 text-sm text-muted-foreground">We will review your message and use it to improve the product.</p><Link href="/" className="mt-6 text-sm font-medium text-accent hover:underline">Return home</Link></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label htmlFor="feedback-type" className="text-sm font-medium">What is this about?</label><select id="feedback-type" className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"><option>Product idea</option><option>Bug report</option><option>Generation quality</option><option>Account or billing</option><option>Other</option></select></div>
              <div><label htmlFor="feedback-email" className="text-sm font-medium">Email</label><input id="feedback-email" type="email" required placeholder="you@company.com" className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" /></div>
              <div><label htmlFor="feedback-message" className="text-sm font-medium">Your feedback</label><textarea id="feedback-message" required rows={6} placeholder="Tell us what happened or what you would like to see..." className="mt-2 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" /></div>
              <button type="submit" className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent/90">Send feedback</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
