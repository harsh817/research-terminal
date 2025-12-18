"use client"

import Link from 'next/link'
import { ArrowLeft, Grid3x3, Tag, Bell, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/terminal">
          <Button variant="ghost" size="icon" className="text-zinc-400 transition-all hover:scale-110 hover:text-zinc-200">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Help & Documentation</h1>
          <p className="mt-1 text-sm text-zinc-400">Learn how to use the Research Terminal effectively</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                <Grid3x3 className="h-5 w-5 text-zinc-300" />
              </div>
              <CardTitle>How the Terminal Works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">
              The Research Terminal is designed for continuous monitoring of live financial news with minimal interaction.
              It displays six independent panes that update in real-time, allowing you to scan multiple market dimensions simultaneously.
            </p>

            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <h4 className="font-medium text-zinc-100">Key Principles</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  <span>All six panes are visible at once, no scrolling or navigation required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  <span>Each pane shows the 10 most recent items matching its filter rules</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  <span>News items update automatically without page refresh</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  <span>Click any headline to open the full article in a new tab</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                <Tag className="h-5 w-5 text-zinc-300" />
              </div>
              <CardTitle>Tag Glossary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-3 font-medium text-zinc-100">Region Tags</h4>
              <p className="mb-3 text-sm text-zinc-400">
                Geographic classification for news items
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/20">
                  Americas
                </Badge>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/20">
                  Europe
                </Badge>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/20">
                  Asia Pacific
                </Badge>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/20">
                  Middle East
                </Badge>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/20">
                  Africa
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium text-zinc-100">Market Tags</h4>
              <p className="mb-3 text-sm text-zinc-400">
                Asset class or market segment classification
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/20">
                  Equities
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/20">
                  Rates
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/20">
                  FX
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/20">
                  Commodities
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/20">
                  Credit
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/20">
                  Crypto
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium text-zinc-100">Theme Tags</h4>
              <p className="mb-3 text-sm text-zinc-400">
                Topic or event classification
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/20">
                  <Bell className="mr-1 h-3 w-3" />
                  Monetary Policy
                </Badge>
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/20">
                  <Bell className="mr-1 h-3 w-3" />
                  Geopolitics
                </Badge>
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/20">
                  <Bell className="mr-1 h-3 w-3" />
                  Risk Events
                </Badge>
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/20">
                  Corporate
                </Badge>
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/20">
                  Earnings
                </Badge>
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/20">
                  Regulation
                </Badge>
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                <Bell className="mr-1 inline h-3 w-3" />
                Tags marked with a bell icon can trigger sound alerts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                <Bell className="h-5 w-5 text-zinc-300" />
              </div>
              <CardTitle>Sound Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">
              Sound alerts notify you of critical market events in real-time. They are designed to be rare and
              meaningful, triggering only for high-impact news.
            </p>

            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <h4 className="font-medium text-zinc-100">How Sound Alerts Work</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  <span>Only predefined high-priority tags can trigger sound</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  <span>You can enable/disable alerts per tag in Settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  <span>Cooldown periods prevent alert fatigue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  <span>One sound per event, even if it appears in multiple panes</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-zinc-100">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="fixed-panes" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-200 hover:text-zinc-100">Why are the panes fixed?</AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400">
                  Fixed panes eliminate decision fatigue and establish consistent scanning patterns. The six
                  panes cover all critical market dimensions without overwhelming the interface. This design
                  prioritizes speed and reliability over customization.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="limited-tags" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-200 hover:text-zinc-100">Why are there limited tags?</AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400">
                  A strict taxonomy ensures consistent categorization and reliable filtering. Too many tags
                  create noise and reduce the effectiveness of the system. The current tag set covers all
                  essential dimensions for professional market monitoring.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="no-scrolling" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-200 hover:text-zinc-100">Why can&apos;t I scroll through more items?</AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400">
                  Limiting each pane to 10 items forces focus on recent, relevant news. If you need to track
                  older items, you should open the full article. The terminal is designed for real-time
                  monitoring, not historical analysis.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="duplicate-items" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-200 hover:text-zinc-100">Why do some items appear in multiple panes?</AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400">
                  News items can have multiple tags and may match the rules of different panes. For example,
                  a Fed rate decision would appear in both &quot;Americas&quot; and &quot;Macro & Policy&quot;. This is
                  intentional and ensures you see relevant news regardless of which pane you&apos;re focused on.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="connection-lost" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-200 hover:text-zinc-100">What happens if the connection is lost?</AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400">
                  The terminal will show a &quot;Reconnecting&quot; indicator in the header. Content freezes in place
                  and no new items appear until connection is restored. Once reconnected, any missed items
                  will be loaded automatically.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-800/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ExternalLink className="h-5 w-5 flex-shrink-0 text-zinc-400" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-zinc-100">Need More Help?</p>
                <p className="text-zinc-400">
                  For additional support or feature requests, contact the Research Terminal team or refer
                  to the full documentation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
