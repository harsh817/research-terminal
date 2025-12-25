"use client"

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useSoundSettings } from '@/lib/sound-settings-context'

export interface NewsTag {
  type: 'region' | 'market' | 'theme'
  value: string
  soundEnabled: boolean
}

export interface NewsItemData {
  id: string
  headline: string
  source: string
  url: string
  timestamp: Date
  tags: NewsTag[]
  summary?: string
  isNew?: boolean
}

interface UseNewsFeedOptions {
  pane: string
  maxItems?: number
  soundCooldown?: number
}

export function useNewsFeed({ pane, maxItems = 10, soundCooldown = 5000 }: UseNewsFeedOptions) {
  const [newsItems, setNewsItems] = useState<NewsItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastSoundTime = useRef<number>(0)
  const loadedItemIds = useRef<Set<string>>(new Set())
  const { shouldPlaySoundForTags, playNotificationSound } = useSoundSettings()
  const channelRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const isActiveRef = useRef(true)

  // Handle visibility change (laptop wake/sleep)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(`[useNewsFeed:${pane}] Page visible again, refreshing data...`)
        // Refetch data to catch missed updates
        const supabase = createClient()
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        supabase
          .from('news_items')
          .select('id, headline, source, url, published_at, region, markets, themes, summary')
          .gte('published_at', threeDaysAgo)
          .order('published_at', { ascending: false })
          .limit(10)
          .then(({ data, error }) => {
            if (error) {
              console.error(`[useNewsFeed:${pane}] Error refreshing data:`, error)
              return
            }
            if (data && data.length > 0) {
              const newItems = data.filter((item: any) => !loadedItemIds.current.has(item.id))
              if (newItems.length > 0) {
                console.log(`[useNewsFeed:${pane}] Found ${newItems.length} new items during sleep`)
              }
            }
          })
      }
    }

    const handleOnline = () => {
      console.log(`[useNewsFeed:${pane}] Network online, connection restored`)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [pane])

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>

    try {
      supabase = createClient()
    } catch (err) {
      console.error('Failed to create Supabase client:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize database connection')
      setIsLoading(false)
      return
    }

    const fetchInitialNews = async () => {
      try {
        console.log(`[useNewsFeed:${pane}] Fetching pane configuration...`)
        const { data: paneData, error: paneError } = await supabase
          .from('panes')
          .select('id, title, rules')
          .eq('id', pane)
          .maybeSingle() as any

        if (paneError) throw paneError
        if (!paneData) {
          throw new Error(`Pane ${pane} not found`)
        }

        const rules = paneData.rules as { regions?: string[], markets?: string[], themes?: string[] }
        console.log(`[useNewsFeed:${pane}] Pane rules:`, rules)

        console.log(`[useNewsFeed:${pane}] Fetching news items...`)
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        const { data: newsData, error } = await supabase
          .from('news_items')
          .select('id, headline, source, url, published_at, region, markets, themes, summary')
          .gte('published_at', threeDaysAgo)
          .order('published_at', { ascending: false })
          .limit(100)

        if (error) throw error

        console.log(`[useNewsFeed:${pane}] Fetched ${newsData?.length || 0} total news items`)

        const filteredNews = newsData
          ?.filter((item: any) => {
            const hasRegionRules = Array.isArray(rules.regions) && rules.regions.length > 0
            const hasMarketRules = Array.isArray(rules.markets) && rules.markets.length > 0
            const hasThemeRules = Array.isArray(rules.themes) && rules.themes.length > 0

            // If no rules specified at all, include everything
            if (!hasRegionRules && !hasMarketRules && !hasThemeRules) return true

            const matchesRegion = hasRegionRules && rules.regions ? rules.regions.includes(item.region) : false
            const matchesMarket = hasMarketRules && rules.markets ? item.markets?.some((m: string) => rules.markets!.includes(m)) : false
            const matchesTheme = hasThemeRules && rules.themes ? item.themes?.some((t: string) => rules.themes!.includes(t)) : false

            // Match if any of the specified rule groups match
            return matchesRegion || matchesMarket || matchesTheme
          })
          .slice(0, maxItems)
          .map((item: any) => {
            loadedItemIds.current.add(item.id)
            return transformNewsItem(item, false)
          }) || []

        console.log(`[useNewsFeed:${pane}] Filtered to ${filteredNews.length} matching items for display`)
        setNewsItems(filteredNews)
        setError(null)
      } catch (error) {
        console.error('Error fetching news:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch news')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialNews()

    console.log(`[useNewsFeed:${pane}] Setting up real-time subscription...`)
    const channel = supabase
      .channel(`news-updates-${pane}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_items',
        },
        async (payload) => {
          console.log(`[useNewsFeed:${pane}] Received real-time insert:`, payload.new)
          const newItemId = payload.new.id

          if (loadedItemIds.current.has(newItemId)) {
            console.log(`[useNewsFeed:${pane}] Item ${newItemId} already loaded, skipping`)
            return
          }

          const { data: paneData } = await supabase
            .from('panes')
            .select('rules')
            .eq('id', pane)
            .maybeSingle() as any

          if (!paneData) return

          const rules = paneData.rules as { regions?: string[], markets?: string[], themes?: string[] }
          const newItem = payload.new as any

          const hasRegionRules = Array.isArray(rules.regions) && rules.regions.length > 0
          const hasMarketRules = Array.isArray(rules.markets) && rules.markets.length > 0
          const hasThemeRules = Array.isArray(rules.themes) && rules.themes.length > 0

          // If no rules specified at all, accept everything
          if (!hasRegionRules && !hasMarketRules && !hasThemeRules) {
            console.log(`[useNewsFeed:${pane}] No rules specified, accepting all items`)
            // proceed
          } else {
            const matchesRegion = hasRegionRules && rules.regions ? rules.regions.includes(newItem.region) : false
            const matchesMarket = hasMarketRules && rules.markets ? newItem.markets?.some((m: string) => rules.markets!.includes(m)) : false
            const matchesTheme = hasThemeRules && rules.themes ? newItem.themes?.some((t: string) => rules.themes!.includes(t)) : false

            console.log(`[useNewsFeed:${pane}] Item matching:`, { matchesRegion, matchesMarket, matchesTheme })
            
            if (!matchesRegion && !matchesMarket && !matchesTheme) {
              console.log(`[useNewsFeed:${pane}] Item doesn't match pane rules, skipping`)
              return
            }
          }

          console.log(`[useNewsFeed:${pane}] Adding new item to pane`)

          const transformedTags: NewsTag[] = [
            { type: 'region', value: newItem.region, soundEnabled: false },
            ...(newItem.markets || []).map((m: string) => ({ type: 'market' as const, value: m, soundEnabled: false })),
            ...(newItem.themes || []).map((t: string) => ({ type: 'theme' as const, value: t, soundEnabled: true }))
          ]

          const now = Date.now()
          const canPlaySound = now - lastSoundTime.current >= soundCooldown

          if (canPlaySound && shouldPlaySoundForTags(transformedTags)) {
            console.log(`[useNewsFeed:${pane}] Playing sound alert for new item`)
            lastSoundTime.current = now
            playNotificationSound()
          } else if (!canPlaySound) {
            console.log(`[useNewsFeed:${pane}] Sound on cooldown, skipping alert`)
          }

          loadedItemIds.current.add(newItemId)
          const transformedItem = transformNewsItem(newItem, true)

          setNewsItems((prev) => {
            const updated = [transformedItem, ...prev].slice(0, maxItems)
            return updated
          })

          setTimeout(() => {
            setNewsItems((prev) =>
              prev.map((item) =>
                item.id === newItemId ? { ...item, isNew: false } : item
              )
            )
          }, 5000)
        }
      )
      .subscribe((status) => {
        console.log(`[useNewsFeed:${pane}] Subscription status:`, status)
        
        if (status === 'SUBSCRIBED') {
          console.log(`[useNewsFeed:${pane}] ✅ Successfully subscribed`)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[useNewsFeed:${pane}] ❌ Subscription error, will retry in 5s`)
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isActiveRef.current && channelRef.current) {
              console.log(`[useNewsFeed:${pane}] Attempting reconnect...`)
              supabase.removeChannel(channelRef.current)
              // Trigger re-setup via dependency change
            }
          }, 5000)
        } else if (status === 'CLOSED') {
          console.log(`[useNewsFeed:${pane}] Connection closed, will reconnect in 3s`)
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isActiveRef.current && channelRef.current) {
              console.log(`[useNewsFeed:${pane}] Reconnecting after close...`)
              supabase.removeChannel(channelRef.current)
            }
          }, 3000)
        }
      })

    channelRef.current = channel

    return () => {
      isActiveRef.current = false
      console.log(`[useNewsFeed:${pane}] Cleaning up subscription`)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [pane, maxItems, soundCooldown])

  return { newsItems, isLoading, error }
}

function transformNewsItem(rawItem: any, isNew: boolean): NewsItemData {
  const tags: NewsTag[] = [
    { type: 'region', value: rawItem.region, soundEnabled: false },
    ...(rawItem.markets || []).map((m: string) => ({ type: 'market' as const, value: m, soundEnabled: false })),
    ...(rawItem.themes || []).map((t: string) => ({ type: 'theme' as const, value: t, soundEnabled: true }))
  ]

  return {
    id: rawItem.id,
    headline: rawItem.headline,
    source: rawItem.source,
    url: rawItem.url,
    timestamp: new Date(rawItem.published_at),
    tags,
    summary: rawItem.summary,
    isNew,
  }
}
