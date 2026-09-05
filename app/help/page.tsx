import Link from 'next/link';
import { ArrowLeft, BookOpen, MessageCircleQuestion, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

const faqs = [
  {
    question: 'How do I create my first campaign?',
    answer: 'Add a product in Products, then open Content Studio, Image Studio, or Video Studio. Select the product and describe the campaign goal, audience, offer, and call to action.',
  },
  {
    question: 'Why should I link a product before generating?',
    answer: 'A linked product gives GorillaGO verified details such as name, description, price, discount, tags, and SEO copy. Those details help the AI create accurate, conversion-focused creative.',
  },
  {
    question: 'Can I edit generated content?',
    answer: 'Yes. Generated content can be edited, copied, and approved before you publish or schedule it.',
  },
  {
    question: 'Where can I report a problem?',
    answer: 'Use the Feedback page to describe the issue. You can also email support@gorillago.com for account or generation support.',
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" aria-label="GorillaGO home"><Logo /></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-2xl">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Help Center</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">Practical answers for turning your product information into trustworthy marketing creative with GorillaGO.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5"><MessageCircleQuestion className="h-5 w-5 text-accent" /><h2 className="mt-4 font-semibold">Generation help</h2><p className="mt-2 text-sm text-muted-foreground">Link a product and include a clear goal, audience, offer, and CTA for stronger results.</p></div>
          <div className="rounded-xl border border-border bg-card p-5"><ShieldCheck className="h-5 w-5 text-success" /><h2 className="mt-4 font-semibold">Review before publishing</h2><p className="mt-2 text-sm text-muted-foreground">Check product facts, pricing, claims, and links before approving any creative.</p></div>
          <div className="rounded-xl border border-border bg-card p-5"><MessageCircleQuestion className="h-5 w-5 text-warning" /><h2 className="mt-4 font-semibold">Need a person?</h2><p className="mt-2 text-sm text-muted-foreground">Email <a className="text-accent hover:underline" href="mailto:support@gorillago.com">support@gorillago.com</a>.</p></div>
        </div>
        <section className="mt-12 max-w-3xl space-y-4">
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          {faqs.map((faq) => <details key={faq.question} className="group rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer list-none font-medium text-foreground">{faq.question}</summary><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p></details>)}
        </section>
      </div>
    </main>
  );
}
