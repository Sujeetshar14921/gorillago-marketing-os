'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Bot,
  PenLine,
  Image as ImageIcon,
  Video,
  Megaphone,
  BarChart3,
  Calendar,
  Zap,
  ArrowRight,
  Check,
  ShieldCheck,
  ClipboardCheck,
  LineChart,
  LockKeyhole,
  CircleCheck,
  Package as PackageIcon,
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';

const features = [
  {
    icon: Bot,
    title: 'AI Marketing Assistant',
    description: 'Tell it what you want — it analyzes products, creates campaigns, generates content, and schedules everything.',
  },
  {
    icon: PenLine,
    title: 'AI Content Studio',
    description: 'Captions, ad copy, emails, blogs, and SEO — generated in multiple languages and perfectly on-brand.',
  },
  {
    icon: ImageIcon,
    title: 'AI Image Studio',
    description: 'Banners, carousels, stories, and mockups — auto-resized for every platform.',
  },
  {
    icon: Video,
    title: 'AI Video Studio',
    description: 'Reels, shorts, and product promos with voice-over, music, and captions.',
  },
  {
    icon: Megaphone,
    title: 'Paid Advertising',
    description: 'Launch and optimize ads on Meta, Google, LinkedIn, and more with AI-powered targeting.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Forecasting',
    description: 'Track ROAS, CTR, conversions, and reach. AI predicts what works before you spend.',
  },
];

const platforms = ['Facebook', 'Instagram', 'LinkedIn', 'Pinterest', 'YouTube', 'X', 'Telegram', 'Threads'];

const stats = [
  { value: '01', label: 'Product brief' },
  { value: '04', label: 'Campaign stages' },
  { value: '100%', label: 'Human approval' },
  { value: '1', label: 'Clear workspace' },
];

const trustPrinciples = [
  {
    icon: ShieldCheck,
    title: 'Built around your real product',
    description: 'Link a product and GorillaGO uses its verified name, benefits, pricing, and details when creating campaigns.',
  },
  {
    icon: ClipboardCheck,
    title: 'Review before you publish',
    description: 'AI drafts the work. Your team stays in control of claims, offers, channels, and final approval.',
  },
  {
    icon: LineChart,
    title: 'Measure what matters',
    description: 'Bring campaign and platform performance into one view so decisions are based on actual results.',
  },
];

const usageSteps = [
  {
    number: '01',
    title: 'Add your product once',
    description: 'Open Products and add a product manually, import a CSV, or connect a store source. Include the description, price, images, benefits, and tags you want the AI to use.',
    result: 'Your product becomes the source of truth for every campaign.',
  },
  {
    number: '02',
    title: 'Choose the outcome',
    description: 'Open Content, Image, or Video Studio. Pick the platform, format, tone, audience, offer, duration, and campaign goal. The clearer the brief, the more useful the first draft.',
    result: 'GorillaGO creates the right format instead of a generic asset.',
  },
  {
    number: '03',
    title: 'Generate a complete creative',
    description: 'The AI combines your product facts with your brief to create ad-ready copy, visuals, video scenes, benefits, proof points, and a clear call to action.',
    result: 'You get a campaign building block that is ready to review and edit.',
  },
  {
    number: '04',
    title: 'Review, approve, and publish',
    description: 'Check every claim, price, image, link, caption, and CTA. Edit anything that needs your brand voice, then approve and schedule it for connected channels.',
    result: 'Your team stays responsible for what customers actually see.',
  },
  {
    number: '05',
    title: 'Track and improve',
    description: 'Use Analytics to review reach, clicks, engagement, spend, conversions, revenue, and ROAS when those channels provide the data.',
    result: 'The next campaign is guided by performance, not guesswork.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="#how-it-works"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              How it works
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
          <div className="absolute right-1/4 top-40 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-[100px]" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">
              The AI Marketing Operating System
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Your entire marketing,
            <br />
            <span className="bg-gradient-to-r from-accent via-chart-2 to-chart-3 bg-clip-text text-transparent">
              powered by AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
          >
            Upload a product. GorillaGO analyzes it, generates content, creates banners and videos,
            schedules posts, launches ad campaigns, and monitors performance — all from one dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25"
            >
              Launch Your First Campaign
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted/40"
            >
              Explore Dashboard
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start"
          >
            {platforms.map((p) => (
              <span key={p} className="text-xs font-medium text-muted-foreground/60">
                {p}
              </span>
            ))}
          </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="relative mx-auto w-full max-w-lg"
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent/10 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <img src="/gorilla.png" alt="" className="h-6 w-6 object-contain" />
                  <span className="text-xs font-semibold text-foreground">Campaign workspace</span>
                </div>
                <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">Ready for review</span>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Product brief</p>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"><PackageIcon /></div>
                    <div><p className="text-sm font-semibold text-foreground">Your product, understood</p><p className="text-xs text-muted-foreground">Benefits, audience, offer, and CTA</p></div>
                    <CircleCheck className="ml-auto h-4 w-4 text-success" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Content', 'Creative', 'Publish'].map((item, index) => <div key={item} className="rounded-lg border border-border p-3"><p className="text-[10px] text-muted-foreground">0{index + 1}</p><p className="mt-2 text-xs font-semibold text-foreground">{item}</p><div className="mt-2 h-1 rounded-full bg-accent/20"><div className="h-1 rounded-full bg-accent" style={{ width: `${index === 2 ? 34 : 100}%` }} /></div></div>)}
                </div>
                <div className="rounded-xl bg-foreground p-4 text-background">
                  <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Human-controlled by design</span></div>
                  <p className="mt-2 text-xs leading-relaxed text-background/65">Every generated asset can be reviewed, edited, and approved before it reaches your audience.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 text-center"
            >
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust principles */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">A better way to use AI</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Fast enough to move. Clear enough to trust.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">GorillaGO is designed to help teams create more without handing over judgment. Your product context, review process, and performance data stay at the center.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {trustPrinciples.map((principle) => { const Icon = principle.icon; return <div key={principle.title} className="rounded-xl border border-border bg-background p-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><Icon className="h-5 w-5" /></div><h3 className="mt-4 text-sm font-semibold text-foreground">{principle.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{principle.description}</p></div>; })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Everything in one platform
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Replace Canva, ChatGPT, Buffer, Hootsuite, and your ad manager with a single AI-driven system.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent/15 to-chart-2/15">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Workflow */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 md:p-12">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              From product to campaign in minutes
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Start with facts about your product. End with a campaign your team can review, improve, and measure.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[
              { step: '01', title: 'Import Product', desc: 'URL, CSV, or store sync' },
              { step: '02', title: 'AI Analyzes', desc: 'Audience, keywords, USPs' },
              { step: '03', title: 'AI Creates', desc: 'Content, images, videos, ads' },
              { step: '04', title: 'Publish & Track', desc: 'Schedule, launch, monitor' },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="relative"
              >
                <span className="text-xs font-bold text-accent">{item.step}</span>
                <h3 className="mt-2 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                {idx < 3 && (
                  <ArrowRight className="absolute -right-3 top-6 hidden h-4 w-4 text-border md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User guide */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Getting started</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">A simple working rhythm for your team</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">You do not need to be an AI expert. Give GorillaGO accurate product context, explain the outcome you want, and keep a human review step before anything goes live.</p>
              <Link href="/help" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">Read the Help Center <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="space-y-4">
              {usageSteps.map((step) => (
                <div key={step.number} className="grid gap-4 rounded-xl border border-border bg-background p-5 sm:grid-cols-[3rem_1fr] sm:p-6">
                  <span className="text-sm font-bold text-accent">{step.number}</span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                    <div className="mt-4 flex items-start gap-2 text-xs font-medium text-success"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{step.result}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-medium text-muted-foreground">Ready when you are</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Stop managing tools.
            <br />
            Start growing your business.
          </h2>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-4">
              {['Product-aware generation', 'Human review before publish', 'Clear campaign reporting'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                GorillaGO helps growing teams turn products into campaigns, content, and measurable sales.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Product</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
                <Link href="/dashboard/content-studio" className="transition-colors hover:text-foreground">Content Studio</Link>
                <Link href="/dashboard/image-studio" className="transition-colors hover:text-foreground">Image Studio</Link>
                <Link href="/dashboard/video-studio" className="transition-colors hover:text-foreground">Video Studio</Link>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Resources</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <Link href="/help" className="transition-colors hover:text-foreground">Help Center</Link>
                <Link href="/feedback" className="transition-colors hover:text-foreground">Send Feedback</Link>
                <Link href="/sign-up" className="transition-colors hover:text-foreground">Create Account</Link>
                <Link href="/sign-in" className="transition-colors hover:text-foreground">Sign In</Link>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Support</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="mailto:support@gorillago.com" className="transition-colors hover:text-foreground">Contact Support</a>
                <Link href="/feedback" className="transition-colors hover:text-foreground">Report an Issue</Link>
                <span>Mon-Fri, 9:00-18:00 UTC</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Legal</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link>
                <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
                <Link href="/feedback" className="transition-colors hover:text-foreground">Trust & Safety</Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>GorillaGO - AI Marketing Operating System. All rights reserved.</p>
            <p>Built for teams that want to grow with clarity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
