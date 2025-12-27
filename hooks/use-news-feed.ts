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
        console.log(`[useNewsFeed:${pane}] Page visible again, refreshing today's news...`)
        // Refetch data to catch missed updates and check if date changed
        const supabase = createClient()
        const startOfToday = new Date()
        startOfToday.setUTCHours(0, 0, 0, 0)
        // Use same expanded range as main query
        startOfToday.setUTCDate(startOfToday.getUTCDate() - 1)
        const startOfTodayISO = startOfToday.toISOString()
        
        supabase
          .from('news_items')
          .select('id, headline, source, url, published_at, region, markets, themes, summary')
          .gte('published_at', startOfTodayISO)
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
                console.log(`[useNewsFeed:${pane}] Found ${newItems.length} new items after wake`)
              }
            }
          })
      }
    }

    const handleOnline = () => {
      console.log(`[useNewsFeed:${pane}] Network online, will reconnect on visibility change`)
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
        
        // Get user's local timezone midnight
        const now = new Date()
        const userMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        
        // Add 6-hour buffer to handle timezone transitions gracefully
        const startTime = new Date(userMidnight.getTime() - (6 * 60 * 60 * 1000))
        const startTimeISO = startTime.toISOString()
        
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        console.log(`[useNewsFeed:${pane}] Timezone: ${userTimezone}, Fetching from: ${startTimeISO} (user's today with 6h buffer)`)
        
        const { data: newsData, error } = await supabase
          .from('news_items')
          .select('id, headline, source, url, published_at, region, markets, themes, summary')
          .gte('published_at', startTimeISO)
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

          // Check if item is from today
          const newItem = payload.new as any
          const itemDate = new Date(newItem.published_at)
          const todayStart = new Date()
          todayStart.setUTCHours(0, 0, 0, 0)
          
          if (itemDate < todayStart) {
            console.log(`[useNewsFeed:${pane}] Skipping old item (not from today): ${newItem.published_at}`)
            return
          }

          const { data: paneData } = await supabase
            .from('panes')
            .select('rules')
            .eq('id', pane)
            .maybeSingle() as any

          if (!paneData) return

          const rules = paneData.rules as { regions?: string[], markets?: string[], themes?: string[] }

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

    // Set up midnight refresh to show new day's news
    const now = new Date()
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    console.log(`[useNewsFeed:${pane}] Will auto-refresh at midnight UTC (in ${Math.round(msUntilMidnight / 1000 / 60)} minutes)`)
    
    const midnightTimer = setTimeout(() => {
      console.log(`[useNewsFeed:${pane}] 🌅 Midnight UTC reached! Clearing old news and fetching new day's news...`)
      loadedItemIds.current.clear()
      setNewsItems([])
      fetchInitialNews()
    }, msUntilMidnight)

    return () => {
      isActiveRef.current = false
      console.log(`[useNewsFeed:${pane}] Cleaning up subscription`)
      clearTimeout(midnightTimer)
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
