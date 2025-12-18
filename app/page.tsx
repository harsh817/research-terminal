'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Activity,
  Bell,
  Filter,
  Globe,
  Grid3x3,
  Layers,
  Radio,
  Target,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <TerminalPreviewSection />
        <FeaturesSection />
        <SoundAlertsSection />
        <ContactSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <Activity className="h-5 w-5" />
          <span className="text-lg font-medium">Research Terminal</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#overview" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Overview
          </a>
          <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Features
          </a>
          <a href="#contact" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Contact
          </a>
          <div className="flex items-center space-x-3 ml-4">
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800">
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                Sign Up
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-800">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div className="container relative mx-auto px-4 py-32 md:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6 border-zinc-700 bg-zinc-900 text-zinc-300">
            Professional Research Platform
          </Badge>
          <h1 className="mb-6 text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">
            Real-time market news,
            <br />
            structured for fast decisions.
          </h1>
          <p className="mb-10 text-lg text-zinc-400 md:text-xl">
            Track global events as they happen. Filter signal from noise.
            <br />
            Never miss critical news.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/terminal">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
                Launch Terminal
              </Button>
            </Link>
            <Button variant="link" className="text-zinc-400 hover:text-white">
              See how it works →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="overview" className="border-b border-zinc-800 py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-8 text-3xl font-medium">Why this exists</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                <p className="text-zinc-400">News is scattered across sources</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                <p className="text-zinc-400">Important events are easy to miss</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                <p className="text-zinc-400">Too much noise, not enough structure</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                <p className="text-zinc-400">Alerts are either late or overwhelming</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-8 text-3xl font-medium">Our approach</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-medium text-white">Live aggregation</h3>
                <p className="text-zinc-400">
                  Real-time news ingestion from multiple trusted sources, unified in a single interface.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-white">Strict tagging</h3>
                <p className="text-zinc-400">
                  Consistent taxonomy across region, market, and theme. Every story tagged with precision.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-white">Pane-based scanning</h3>
                <p className="text-zinc-400">
                  Six fixed panes update independently. Scan multiple streams without switching views.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-white">Critical event alerts</h3>
                <p className="text-zinc-400">
                  Sound alerts trigger only for high-impact events. Rare by design. Never overwhelming.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: Radio,
      title: 'Live News Intake',
      description:
        'Real-time ingestion from multiple trusted sources with automatic de-duplication and normalization.',
    },
    {
      icon: Filter,
      title: 'Structured Tagging',
      description:
        'Consistent taxonomy by region, market, and theme. Every story categorized with precision.',
    },
    {
      icon: Grid3x3,
      title: 'Pane-Based Monitoring',
      description:
        'Six fixed panes update independently. Fast scanning without context switching or tab overload.',
    },
  ];

  return (
    <section id="how-it-works" className="border-b border-zinc-800 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-medium">How the Research Terminal Works</h2>
          <p className="text-zinc-400">Three core components drive the system</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={index} className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
                  <step.icon className="h-6 w-6 text-zinc-400" />
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-zinc-400">{step.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function TerminalPreviewSection() {
  return (
    <section className="border-b border-zinc-800 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-medium">Terminal Layout</h2>
            <p className="text-zinc-400">Six panes. Independent updates. One unified view.</p>
          </div>
          <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/30 p-8">
            <div className="absolute right-8 top-8 animate-pulse rounded bg-amber-500/20 px-3 py-1 text-xs text-amber-400 ring-1 ring-amber-500/30">
              Breaking
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                'Americas',
                'Europe',
                'Asia Pacific',
                'Macro & Policy',
                'Corporate',
                'Risk Events',
              ].map((pane, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded border border-zinc-800 bg-[#0a0a0a] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-300">{pane}</h3>
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="space-y-1.5 border-l-2 border-zinc-800 pl-3">
                      <div className="h-3 w-full rounded bg-zinc-800" />
                      <div className="flex gap-2">
                        <div className="h-2 w-12 rounded bg-zinc-800/50" />
                        <div className="h-2 w-16 rounded bg-zinc-800/50" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 space-y-2 text-center text-sm text-zinc-400">
            <p>Each pane updates independently</p>
            <p>One story can appear in multiple panes</p>
            <p>Tags drive visibility and alerts</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: 'Real-time news updates',
      description: 'Sub-second latency from source to display. No polling. No refresh required.',
    },
    {
      icon: Grid3x3,
      title: 'Six-pane fixed layout',
      description: 'Pre-configured panes for Americas, Europe, APAC, Macro, Corporate, and Risk.',
    },
    {
      icon: Target,
      title: 'Strict tag system',
      description: 'Consistent taxonomy ensures reliable filtering and routing.',
    },
    {
      icon: Bell,
      title: 'Tag-based sound alerts',
      description: 'Audio notifications for critical events only. Configurable per user.',
    },
    {
      icon: Layers,
      title: 'De-duplication',
      description: 'Intelligent merging of duplicate stories across sources.',
    },
    {
      icon: Globe,
      title: 'Click-through to source',
      description: 'Direct links to original articles for full context.',
    },
    {
      icon: CheckCircle2,
      title: 'System reliability',
      description: 'Built for uptime. Automatic reconnection and state recovery.',
    },
    {
      icon: Activity,
      title: 'Performance monitoring',
      description: 'Real-time system health indicators and connection status.',
    },
  ];

  return (
    <section id="features" className="border-b border-zinc-800 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-medium">Core Capabilities</h2>
          <p className="text-zinc-400">Enterprise-grade features for professional market monitoring</p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="flex space-x-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-zinc-800 bg-zinc-900">
                <feature.icon className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <h3 className="mb-2 font-medium">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SoundAlertsSection() {
  return (
    <section className="border-b border-zinc-800 py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-medium">
              Critical events
              <br />
              should interrupt you.
            </h2>
            <p className="text-zinc-400">
              Sound alerts trigger only for predefined high-impact tags. No noise. No spam. When you
              hear an alert, it matters.
            </p>
          </div>
          <div>
            <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="mb-4 text-lg font-medium">Alert triggers</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded border border-zinc-800 bg-[#0a0a0a] p-3">
                  <span className="text-sm text-zinc-300">Monetary policy</span>
                  <Bell className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-800 bg-[#0a0a0a] p-3">
                  <span className="text-sm text-zinc-300">Geopolitics</span>
                  <Bell className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-800 bg-[#0a0a0a] p-3">
                  <span className="text-sm text-zinc-300">Risk events</span>
                  <Bell className="h-4 w-4 text-zinc-500" />
                </div>
              </div>
              <Separator className="bg-zinc-800" />
              <p className="text-sm text-zinc-500">Sound is rare by design.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="border-b border-zinc-800 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 text-3xl font-medium">Get Started with Research Terminal</h2>
          <p className="mb-8 text-lg text-zinc-400">
            Built for market professionals who demand speed, clarity, and trust. Request access to experience real-time market intelligence without the noise.
          </p>
          <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-800">
            Request Access
          </Button>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: 'Who is this terminal for?',
      answer:
        'Market professionals, research teams, traders, and risk analysts who need structured real-time news flow without the noise.',
    },
    {
      question: 'Is this a trading platform?',
      answer:
        'No. This is a research tool for monitoring news and events. It does not execute trades or provide market data feeds.',
    },
    {
      question: 'How real-time is the data?',
      answer:
        'Sub-second latency from source publication to display. Updates appear instantly without refresh.',
    },
    {
      question: 'Why fixed panes?',
      answer:
        'Fixed panes eliminate decision fatigue and ensure consistent scanning patterns. Six panes cover all critical dimensions without overwhelming the interface.',
    },
  ];

  return (
    <section className="border-b border-zinc-800 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-medium">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-zinc-800">
                <AccordionTrigger className="text-left hover:text-zinc-300">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span className="text-lg font-medium">Research Terminal</span>
            </div>
            <p className="text-sm text-zinc-500">
              Real-time financial research terminal for professional market monitoring.
            </p>
          </div>
          <div className="flex justify-end space-x-8 text-sm">
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#contact" className="text-zinc-400 hover:text-white transition-colors">
              Contact
            </a>
            <a href="#" className="text-zinc-400 hover:text-white transition-colors">
              Documentation
            </a>
          </div>
        </div>
        <Separator className="my-8 bg-zinc-800" />
        <div className="text-center text-sm text-zinc-500">© Research Terminal 2024</div>
      </div>
    </footer>
  );
}
