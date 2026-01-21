"use client"

import { useState, useEffect } from 'react'
import { Activity, AlertCircle, CheckCircle, Clock, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase-client'
import { Skeleton } from '@/components/ui/skeleton'

interface RSSSource {
  id: string
  name: string
  url: string
  region: string
  active: boolean
}

interface IngestionLog {
  feed_id: string
  status: string
  items_fetched: number
  created_at: string
  error_message: string | null
}

interface SourceStats {
  source: RSSSource
  last24h: number
  lastFetch: string | null
  lastStatus: string | null
  lastError: string | null
  isActive: boolean
}

export function SourceMonitorDashboard() {
  const [sources, setSources] = useState<RSSSource[]>([])
  const [stats, setStats] = useState<SourceStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalItems24h, setTotalItems24h] = useState(0)
  const [activeSources, setActiveSources] = useState(0)

  useEffect(() => {
    loadSourceData()
    const interval = setInterval(loadSourceData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const loadSourceData = async () => {
    try {
      const supabase = createClient()

      // Fetch all RSS sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('rss_sources')
        .select('*')
        .order('name')

      if (sourcesError) throw sourcesError

      // Fetch ingestion logs from last 24 hours
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: logsData, error: logsError } = await supabase
        .from('ingestion_logs')
        .select('*')
        .gte('created_at', last24h)
        .order('created_at', { ascending: false })

      if (logsError) throw logsError

      // Calculate stats for each source
      const sourceStats: SourceStats[] = (sourcesData || []).map((source: any) => {
        const sourceLogs = (logsData || []).filter((log: any) => log.feed_id === source.id)
        const last24hItems = sourceLogs.reduce((sum: number, log: any) => sum + (log.items_fetched || 0), 0)
        const lastLog: any = sourceLogs[0]

        return {
          source,
          last24h: last24hItems,
          lastFetch: lastLog?.created_at || null,
          lastStatus: lastLog?.status || null,
          lastError: lastLog?.error_message || null,
          isActive: source.active
        }
      })

      // Sort by most items fetched in last 24h
      sourceStats.sort((a, b) => b.last24h - a.last24h)

      setSources(sourcesData || [])
      setStats(sourceStats)
      setTotalItems24h(sourceStats.reduce((sum, s) => sum + s.last24h, 0))
      setActiveSources(sourceStats.filter(s => s.isActive).length)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading source data:', error)
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const getStatusBadge = (status: string | null) => {
    if (status === 'success') {
      return (
        <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Success
        </Badge>
      )
    }
    if (status === 'failed') {
      return (
        <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-zinc-500/20 text-zinc-400 border-zinc-500/20">
        <Clock className="h-3 w-3 mr-1" />
        Unknown
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Items (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{totalItems24h}</div>
            <p className="text-xs text-zinc-500 mt-1">Total items fetched</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{activeSources}</div>
            <p className="text-xs text-zinc-500 mt-1">Out of {sources.length} total</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">Online</div>
            <p className="text-xs text-zinc-500 mt-1">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Source List */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            RSS Sources
          </CardTitle>
          <CardDescription>
            Monitoring {sources.length} news feeds
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {stats.map((stat) => (
              <div
                key={stat.source.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    {stat.isActive ? (
                      <Wifi className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-zinc-600" />
                    )}
                    <span className="font-medium text-zinc-100">{stat.source.name}</span>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/20 text-xs">
                      {stat.source.region}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 ml-7">{stat.source.url}</p>
                  {stat.lastError && (
                    <p className="text-xs text-red-400 ml-7">Error: {stat.lastError}</p>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium text-zinc-100">{stat.last24h}</div>
                    <div className="text-xs text-zinc-500">items</div>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <div className="text-xs text-zinc-400">{formatTimestamp(stat.lastFetch)}</div>
                    <div className="mt-1">{getStatusBadge(stat.lastStatus)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
