"use client"

import { useState, useEffect } from 'react'
import { Pane } from '@/components/pane'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SoundPermissionModal } from '@/components/sound-permission-modal'
import { useConnection } from '@/lib/connection-context'
import { useNewsFeed } from '@/hooks/use-news-feed'
import { AlertCircle } from 'lucide-react'

const PANE_CONFIGS = [
  {
    id: 'americas',
    title: 'Americas',
    description: 'News tagged with Americas region and market themes including equities, rates, and commodities.',
    pane: 'americas'
  },
  {
    id: 'europe',
    title: 'Europe',
    description: 'European market news covering EU, UK, and regional economic developments.',
    pane: 'europe'
  },
  {
    id: 'asia_pacific',
    title: 'Asia Pacific',
    description: 'APAC market news including China, Japan, India, and Southeast Asia.',
    pane: 'asia_pacific'
  },
  {
    id: 'macro_policy',
    title: 'Macro & Policy',
    description: 'Central bank decisions, fiscal policy, and macroeconomic indicators.',
    pane: 'macro_policy'
  },
  {
    id: 'corporate',
    title: 'Corporate',
    description: 'Earnings, M&A, corporate actions, and company-specific developments.',
    pane: 'corporate'
  },
  {
    id: 'risk_events',
    title: 'Risk Events',
    description: 'Geopolitical events, regulatory changes, and systemic risk factors.',
    pane: 'risk_events'
  }
]

function PaneContainer({ config }: { config: typeof PANE_CONFIGS[0] }) {
  const { newsItems, isLoading, error } = useNewsFeed({
    pane: config.pane,
    maxItems: 10,
    soundCooldown: 5000
  })

  if (error) {
    const isConfigError = error.includes('not configured') || error.includes('Missing Supabase')
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-red-900/50 bg-red-950/20 p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <p className="text-sm font-medium text-red-400">
            {isConfigError ? 'Supabase Not Configured' : 'Configuration Error'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-red-300/70">{error}</p>
          {isConfigError && (
            <p className="mt-3 text-xs text-red-300/50">
              Check SUPABASE_SETUP.md for setup instructions
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Pane
      id={config.id}
      title={config.title}
      description={config.description}
      items={newsItems}
    />
  )
}

export default function TerminalPage() {
  const { status, setStatus } = useConnection()
  const [showSoundPermissionModal, setShowSoundPermissionModal] = useState(false)

  useEffect(() => {
    checkSoundPermission()
    simulateConnectionEvents()
  }, [])

  const checkSoundPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'denied') {
        setTimeout(() => {
          setShowSoundPermissionModal(true)
        }, 2000)
      }
    }
  }

  const simulateConnectionEvents = () => {
    setTimeout(() => {
      setStatus('reconnecting')

      setTimeout(() => {
        setStatus('live')
      }, 3000)
    }, 10000)
  }

  return (
    <>
      <SoundPermissionModal
        open={showSoundPermissionModal}
        onOpenChange={setShowSoundPermissionModal}
      />

      {status === 'reconnecting' && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-2">
          <Alert className="border-0 bg-transparent p-0">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm text-amber-400">
              Connection interrupted. Attempting to reconnect...
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className={`relative overflow-hidden bg-[#0a0a0a] ${status === 'reconnecting' ? 'h-[calc(100vh-6.5rem)]' : 'h-[calc(100vh-4rem)]'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className="relative grid h-full grid-cols-3 grid-rows-2 gap-5 p-6">
          {PANE_CONFIGS.map((config) => (
            <PaneContainer key={config.id} config={config} />
          ))}
        </div>
      </div>
    </>
  )
}
