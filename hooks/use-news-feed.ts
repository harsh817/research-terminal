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

        const { data: newsData, error } = await supabase
          .from('news_items')
          .select('id, headline, source, url, published_at, region, markets, themes')
          .order('published_at', { ascending: false })
          .limit(100)

        if (error) throw error

        const filteredNews = newsData
          ?.filter((item: any) => {
            const matchesRegion = !rules.regions || rules.regions.length === 0 || rules.regions.includes(item.region)
            const matchesMarket = !rules.markets || rules.markets.length === 0 || item.markets?.some((m: string) => rules.markets?.includes(m))
            const matchesTheme = !rules.themes || rules.themes.length === 0 || item.themes?.some((t: string) => rules.themes?.includes(t))

            return matchesRegion || matchesMarket || matchesTheme
          })
          .slice(0, maxItems)
          .map((item: any) => {
            loadedItemIds.current.add(item.id)
            return transformNewsItem(item, false)
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

    const channel = supabase
      .channel('news-updates')
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

          const { data: paneData } = await supabase
            .from('panes')
            .select('rules')
            .eq('id', pane)
            .maybeSingle() as any

          if (!paneData) return

          const rules = paneData.rules as { regions?: string[], markets?: string[], themes?: string[] }
          const newItem = payload.new as any

          const matchesRegion = !rules.regions || rules.regions.length === 0 || rules.regions.includes(newItem.region)
          const matchesMarket = !rules.markets || rules.markets.length === 0 || newItem.markets?.some((m: string) => rules.markets?.includes(m))
          const matchesTheme = !rules.themes || rules.themes.length === 0 || newItem.themes?.some((t: string) => rules.themes?.includes(t))

          if (!matchesRegion && !matchesMarket && !matchesTheme) return

          const transformedTags: NewsTag[] = [
            { type: 'region', value: newItem.region, soundEnabled: false },
            ...(newItem.markets || []).map((m: string) => ({ type: 'market' as const, value: m, soundEnabled: false })),
            ...(newItem.themes || []).map((t: string) => ({ type: 'theme' as const, value: t, soundEnabled: true }))
          ]

          const now = Date.now()
          const canPlaySound = now - lastSoundTime.current >= soundCooldown

          if (canPlaySound && shouldPlaySoundForTags(transformedTags)) {
            lastSoundTime.current = now
            playNotificationSound()
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
      .subscribe()

    return () => {
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
    isNew,
  }
}
