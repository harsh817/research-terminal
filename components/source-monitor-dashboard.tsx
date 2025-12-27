"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SourceHealth {
  name: string
  url: string
  active: boolean
  error_count: number
  last_fetched: string | null
  last_error: string | null
  health_status: 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL'
  freshness: string
  items_last_24h: number
}

export function SourceMonitorDashboard() {
  const [sources, setSources] = useState<SourceHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSourceHealth = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('rss_source_health')
          .select('*')
        
        if (error) throw error
        setSources(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load source health')
      } finally {
        setLoading(false)
      }
    }

    fetchSourceHealth()
    const interval = setInterval(fetchSourceHealth, 60000) // Refresh every minute
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-500'
      case 'DEGRADED': return 'bg-yellow-500'
      case 'WARNING': return 'bg-orange-500'
      case 'CRITICAL': return 'bg-red-500'
      default: return 'bg-zinc-500'
    }
  }

  const stats = {
    total: sources.length,
    healthy: sources.filter(s => s.health_status === 'HEALTHY').length,
    degraded: sources.filter(s => s.health_status === 'DEGRADED').length,
    warning: sources.filter(s => s.health_status === 'WARNING').length,
    critical: sources.filter(s => s.health_status === 'CRITICAL').length,
    inactive: sources.filter(s => !s.active).length
  }

  if (loading) return <div className="p-6 text-zinc-400">Loading source health...</div>
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">RSS Source Health Monitor</h2>
        <p className="text-sm text-zinc-400">Real-time monitoring of RSS feed sources and ingestion status</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="text-2xl font-bold text-zinc-100">{stats.total}</div>
          <div className="text-xs text-zinc-400">Total Sources</div>
        </Card>
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="text-2xl font-bold text-green-400">{stats.healthy}</div>
          <div className="text-xs text-zinc-400">Healthy</div>
        </Card>
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="text-2xl font-bold text-yellow-400">{stats.degraded}</div>
          <div className="text-xs text-zinc-400">Degraded</div>
        </Card>
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="text-2xl font-bold text-orange-400">{stats.warning}</div>
          <div className="text-xs text-zinc-400">Warning</div>
        </Card>
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
          <div className="text-xs text-zinc-400">Critical</div>
        </Card>
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="text-2xl font-bold text-zinc-500">{stats.inactive}</div>
          <div className="text-xs text-zinc-400">Inactive</div>
        </Card>
      </div>

      {/* Source List */}
      <div className="space-y-2">
        {sources.map((source) => (
          <Card key={source.name} className="p-4 bg-zinc-900 border-zinc-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(source.health_status)}`} />
                  <span className="font-medium text-zinc-100">{source.name}</span>
                  {!source.active && (
                    <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500">
                      Inactive
                    </Badge>
                  )}
                </div>
                
                <div className="text-xs text-zinc-500 break-all">{source.url}</div>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    {source.items_last_24h} items/24h
                  </Badge>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    {source.freshness}
                  </Badge>
                  {source.error_count > 0 && (
                    <Badge variant="destructive" className="bg-red-900/20 text-red-400 border-red-800">
                      {source.error_count} errors
                    </Badge>
                  )}
                </div>

                {source.last_error && (
                  <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">
                    {source.last_error}
                  </div>
                )}
              </div>

              <Badge className={`${getStatusColor(source.health_status)} text-white border-0`}>
                {source.health_status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
