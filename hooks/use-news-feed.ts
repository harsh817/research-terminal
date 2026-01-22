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
  isNew?: boolean
  isRead?: boolean
  isSaved?: boolean
}

interface UseNewsFeedOptions {
  pane: string
  maxItems?: number
  soundCooldown?: number
}

// Priority order: 1=highest priority (gets first dibs on news)
const PANE_PRIORITIES: Record<string, number> = {
  'risk_events': 1,      // Highest - crisis/geopolitical
  'corporate': 2,         // Earnings/M&A
  'macro_policy': 3,      // Macro indicators
  'americas': 4,          // Regional
  'europe': 4,            // Regional (same priority)
  'asia_pacific': 4,      // Regional (same priority)
}

function getBestMatchingPane(item: any, allPanes: any[]): string | null {
  const itemMarkets = Array.isArray(item.markets) ? item.markets : []
  const itemThemes = Array.isArray(item.themes) ? item.themes : []
  const searchText = `${item.headline} ${item.source}`.toLowerCase()
  
  let bestMatch: { paneId: string, priority: number, score: number } | null = null
  
  for (const pane of allPanes) {
    const rules = pane.rules as {
      regions?: string[]
      markets?: string[]
      themes?: string[]
      keywords?: string[]
    }
    
    // Check if this pane matches based on tags
    const matchesRegion = !rules.regions || rules.regions.length === 0 || rules.regions.includes(item.region)
    const matchesMarket = !rules.markets || rules.markets.length === 0 || itemMarkets.some((m: string) => rules.markets?.includes(m))
    const matchesTheme = !rules.themes || rules.themes.length === 0 || itemThemes.some((t: string) => rules.themes?.includes(t))
    
    const matchesTags = matchesRegion || matchesMarket || matchesTheme
    
    // Count keyword matches
    let keywordMatches = 0
    if (rules.keywords && rules.keywords.length > 0) {
      keywordMatches = rules.keywords.filter((kw: string) =>
        searchText.includes(kw.toLowerCase())
      ).length
    }
    
    // Must match tags AND have at least one keyword match
    if (matchesTags && keywordMatches > 0) {
      const priority = PANE_PRIORITIES[pane.id] || 99
      
      // Best match = highest priority (lowest number), then highest keyword score
      if (!bestMatch || priority < bestMatch.priority || 
          (priority === bestMatch.priority && keywordMatches > bestMatch.score)) {
        bestMatch = { paneId: pane.id, priority, score: keywordMatches }
      }
    }
  }
  
  return bestMatch?.paneId || null
}

export function useNewsFeed({ pane, maxItems = 10, soundCooldown = 5000 }: UseNewsFeedOptions) {
  const [newsItems, setNewsItems] = useState<NewsItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastSoundTime = useRef<number>(0)
  const loadedItemIds = useRef<Set<string>>(new Set())
  const { shouldPlaySoundForTags, playNotificationSound } = useSoundSettings()

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
        // Fetch ALL panes for priority-based matching
        const { data: allPanes, error: panesError } = await supabase
          .from('panes')
          .select('id, title, rules')

        if (panesError) throw panesError
        if (!allPanes || allPanes.length === 0) {
          throw new Error('No panes found')
        }

        // Fetch news with read status
        const { data: { user } } = await supabase.auth.getUser()
        
        // Get user's local timezone midnight
        const now = new Date()
        const userMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        
        // Add 6-hour buffer to handle timezone transitions gracefully
        const startTime = new Date(userMidnight.getTime() - (6 * 60 * 60 * 1000))
        const startTimeISO = startTime.toISOString()
        
        console.log(`[useNewsFeed:${pane}] Fetching from: ${startTimeISO} (user's today with 6h buffer)`)
        
        let query = supabase
          .from('news_items')
          .select(`
            id, headline, source, url, published_at, region, markets, themes
          `)
          .gte('published_at', startTimeISO)
          .order('published_at', { ascending: false })
          .limit(100)

        const { data: newsData, error } = await query

        if (error) throw error

        // Fetch read and saved status separately for all news items
        const newsIds = newsData?.map((item: any) => item.id) || []
        let readItemsSet = new Set<string>()
        let savedItemsSet = new Set<string>()

        if (user && newsIds.length > 0) {
          // Fetch read items
          const { data: readItems } = await supabase
            .from('user_read_items')
            .select('news_item_id')
            .eq('user_id', user.id)
            .in('news_item_id', newsIds)
          readItemsSet = new Set(readItems?.map((r: any) => r.news_item_id) || [])

          // Fetch saved items
          const { data: savedItems } = await supabase
            .from('user_saved_items')
            .select('news_item_id')
            .eq('user_id', user.id)
            .in('news_item_id', newsIds)
          savedItemsSet = new Set(savedItems?.map((s: any) => s.news_item_id) || [])
        }

        console.log(`Fetched status for ${newsIds.length} items:`, {
          readItems: readItemsSet.size,
          savedItems: savedItemsSet.size,
          savedItemIds: Array.from(savedItemsSet)
        })

        // Priority-based exclusive matching - each news item goes to only ONE pane
        const filteredNews = newsData
          ?.filter((item: any) => {
            const bestMatchPane = getBestMatchingPane(item, allPanes)
            return bestMatchPane === pane
          })
          .slice(0, maxItems)
          .map((item: any) => {
            loadedItemIds.current.add(item.id)
            // Check if user has read/saved this item using the sets
            const isRead = readItemsSet.has(item.id)
            const isSaved = savedItemsSet.has(item.id)
            return transformNewsItem(item, false, isRead, isSaved)
          }) || []

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

    let readItemsChannel: ReturnType<typeof supabase.channel> | null = null
    let savedItemsChannel: ReturnType<typeof supabase.channel> | null = null

    // Get current user and set up subscriptions
    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      // Subscribe to user_read_items changes to update read status in real-time
      // Use pane-specific channel names to avoid conflicts
      readItemsChannel = supabase
        .channel(`read-items-${pane}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_read_items'
          },
          async (payload) => {
            console.log('Read items subscription event:', payload.eventType, (payload.new || payload.old))
            // When user marks item as read, update the local state
            if (payload.eventType === 'INSERT') {
              const newsItemId = (payload.new as any).news_item_id
              const userId = (payload.new as any).user_id
              // Only update if it's the current user's action
              if (user && userId === user.id) {
                console.log('Setting isRead=true for:', newsItemId)
                setNewsItems((prev) =>
                  prev.map((item) =>
                    item.id === newsItemId ? { ...item, isRead: true } : item
                  )
                )
              }
            } else if (payload.eventType === 'DELETE') {
              // Handle unmark as read
              const newsItemId = (payload.old as any).news_item_id
              const userId = (payload.old as any).user_id
              if (user && userId === user.id) {
                console.log('Setting isRead=false for:', newsItemId)
                setNewsItems((prev) =>
                  prev.map((item) =>
                    item.id === newsItemId ? { ...item, isRead: false } : item
                  )
                )
              }
            }
          }
        )
        .subscribe()

      // Subscribe to user_saved_items changes to update saved status in real-time
      // Use pane-specific channel names to avoid conflicts
      savedItemsChannel = supabase
        .channel(`saved-items-${pane}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_saved_items'
          },
          async (payload) => {
            console.log('Saved items subscription event:', payload.eventType, (payload.new || payload.old))
            // When user saves/unsaves item, update the local state
            if (payload.eventType === 'INSERT') {
              const newsItemId = (payload.new as any).news_item_id
              const userId = (payload.new as any).user_id
              // Only update if it's the current user's action
              if (user && userId === user.id) {
                console.log('Setting isSaved=true for:', newsItemId)
                setNewsItems((prev) =>
                  prev.map((item) =>
                    item.id === newsItemId ? { ...item, isSaved: true } : item
                  )
                )
              }
            } else if (payload.eventType === 'DELETE') {
              const newsItemId = (payload.old as any).news_item_id
              const userId = (payload.old as any).user_id
              if (user && userId === user.id) {
                console.log('Setting isSaved=false for:', newsItemId)
                setNewsItems((prev) =>
                  prev.map((item) =>
                    item.id === newsItemId ? { ...item, isSaved: false } : item
                  )
                )
              }
            }
          }
        )
        .subscribe()
    }

    setupSubscriptions()

    // Subscribe to real-time updates for new news items
    // Use pane-specific channel names to avoid conflicts between multiple pane instances
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
          const newItemId = payload.new.id

          if (loadedItemIds.current.has(newItemId)) {
            return
          }

          // Fetch all panes for priority-based matching
          const { data: allPanes } = await supabase
            .from('panes')
            .select('id, title, rules')

          if (!allPanes || allPanes.length === 0) return

          const newItem = payload.new as any

          // Check if this news item should go to THIS pane based on priority
          const bestMatchPane = getBestMatchingPane(newItem, allPanes)
          if (bestMatchPane !== pane) return

          // Check if user has already read this item (unlikely for new items, but possible)
          const { data: { user } } = await supabase.auth.getUser()
          let isRead = false
          let isSaved = false
          if (user) {
            const { data: readData } = await supabase
              .from('user_read_items')
              .select('user_id')
              .eq('user_id', user.id)
              .eq('news_item_id', newItem.id)
              .maybeSingle()
            isRead = !!readData

            const { data: savedData } = await supabase
              .from('user_saved_items')
              .select('user_id')
              .eq('user_id', user.id)
              .eq('news_item_id', newItem.id)
              .maybeSingle()
            isSaved = !!savedData
          }

          // Parse PostgreSQL arrays if they come as strings
          const newItemMarkets = Array.isArray(newItem.markets) ? newItem.markets : []
          const newItemThemes = Array.isArray(newItem.themes) ? newItem.themes : []

          const transformedTags: NewsTag[] = [
            { type: 'region', value: newItem.region, soundEnabled: false },
            ...newItemMarkets.map((m: string) => ({ type: 'market' as const, value: m, soundEnabled: false })),
            ...newItemThemes.map((t: string) => ({ type: 'theme' as const, value: t, soundEnabled: true }))
          ]

          const now = Date.now()
          const canPlaySound = now - lastSoundTime.current >= soundCooldown

          if (canPlaySound && shouldPlaySoundForTags(transformedTags)) {
            lastSoundTime.current = now
            playNotificationSound()
          }

          loadedItemIds.current.add(newItemId)
          const transformedItem = transformNewsItem(newItem, true, isRead, isSaved)

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
          }, 10000) // 10 seconds for better visibility
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (readItemsChannel) supabase.removeChannel(readItemsChannel)
      if (savedItemsChannel) supabase.removeChannel(savedItemsChannel)
    }
  }, []) // Empty array - run once on mount, real-time subscriptions handle all updates

  return { newsItems, isLoading, error }
}

function transformNewsItem(rawItem: any, isNew: boolean, isRead: boolean = false, isSaved: boolean = false): NewsItemData {
  // Parse PostgreSQL arrays if they come as strings
  const itemMarkets = Array.isArray(rawItem.markets) ? rawItem.markets : []
  const itemThemes = Array.isArray(rawItem.themes) ? rawItem.themes : []
  
  const tags: NewsTag[] = [
    { type: 'region', value: rawItem.region, soundEnabled: false },
    ...itemMarkets.map((m: string) => ({ type: 'market' as const, value: m, soundEnabled: false })),
    ...itemThemes.map((t: string) => ({ type: 'theme' as const, value: t, soundEnabled: true }))
  ]

  return {
    id: rawItem.id,
    headline: rawItem.headline,
    source: rawItem.source,
    url: rawItem.url,
    timestamp: new Date(rawItem.published_at),
    tags,
    isNew,
    isRead,
    isSaved,
  }
}
