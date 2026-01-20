"use client"

import { useState, useEffect } from 'react'
import { Info, Filter, CheckCheck, ChevronDown, BookmarkPlus } from 'lucide-react'
import { NewsItem } from '@/components/news-item'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { markAllAsRead } from '@/lib/read-tracking'
import { saveMultiple } from '@/lib/saved-items'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Tag {
  type: 'region' | 'market' | 'theme'
  value: string
  soundEnabled?: boolean
}

interface NewsItemData {
  id: string
  headline: string
  source: string
  url: string
  timestamp: Date
  tags: Tag[]
  isNew?: boolean
  isRead?: boolean
  isSaved?: boolean
}

interface PaneProps {
  id: string
  title: string
  description: string
  items: NewsItemData[]
}

export function Pane({ id, title, description, items }: PaneProps) {
  const [keywordCount, setKeywordCount] = useState(0)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [savedFilter, setSavedFilter] = useState<'all' | 'saved'>('all')
  const { toast } = useToast()

  // Filter items based on read and saved status
  const filteredItems = items.filter(item => {
    // Apply read filter
    if (readFilter === 'unread' && item.isRead) return false
    if (readFilter === 'read' && !item.isRead) return false
    
    // Apply saved filter
    if (savedFilter === 'saved' && !item.isSaved) return false
    
    return true
  })

  const displayItems = filteredItems.slice(0, 10).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const unreadCount = items.filter(item => !item.isRead).length
  const savedCount = items.filter(item => item.isSaved).length

  // Debug logging
  useEffect(() => {
    console.log(`Pane ${id}:`, {
      totalItems: items.length,
      savedCount,
      itemsWithSaved: items.filter(i => i.isSaved).map(i => ({ id: i.id, headline: i.headline.substring(0, 50), isSaved: i.isSaved }))
    })
  }, [items, savedCount, id])

  const handleMarkAllAsRead = async () => {
    const itemIds = displayItems.map(item => item.id)
    if (itemIds.length === 0) return

    await markAllAsRead(itemIds)
    
    toast({
      title: "Marked as read",
      description: `${itemIds.length} item${itemIds.length === 1 ? '' : 's'} marked as read`,
      duration: 2000,
    })
  }

  const handleSaveAll = async () => {
    const itemIds = displayItems.map(item => item.id)
    if (itemIds.length === 0) return

    await saveMultiple(itemIds)
    
    toast({
      title: "Saved items",
      description: `${itemIds.length} item${itemIds.length === 1 ? '' : 's'} saved`,
      duration: 2000,
    })
  }

  useEffect(() => {
    const fetchKeywordCount = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('panes')
          .select('rules')
          .eq('id', id)
          .maybeSingle()

        if (!error && data) {
          const keywords = data.rules?.keywords || []
          setKeywordCount(keywords.length)
        }
      } catch (error) {
        console.error('Error fetching keyword count:', error)
      }
    }

    fetchKeywordCount()
  }, [id])

  return (
    <Card className="flex h-full flex-col overflow-hidden border-zinc-800 bg-zinc-900/50 shadow-lg transition-all hover:border-zinc-700">
      <CardHeader className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">{title}</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-xs border-blue-700 bg-blue-900/30 text-blue-300">
                {unreadCount} unread
              </Badge>
            )}
            {savedCount > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-700 bg-yellow-900/30 text-yellow-300">
                {savedCount} saved
              </Badge>
            )}
            {keywordCount > 0 && (
              <Badge variant="outline" className="text-xs border-zinc-700 bg-zinc-800/50 text-zinc-300">
                <Filter className="h-3 w-3 mr-1" />
                {keywordCount} {keywordCount === 1 ? 'keyword' : 'keywords'}
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  {readFilter === 'all' && savedFilter === 'all' && 'All'}
                  {readFilter === 'unread' && 'Unread'}
                  {readFilter === 'read' && 'Read'}
                  {savedFilter === 'saved' && 'Saved'}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => { setReadFilter('all'); setSavedFilter('all'); }}>
                  All Items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReadFilter('unread'); setSavedFilter('all'); }}>
                  Unread Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReadFilter('read'); setSavedFilter('all'); }}>
                  Read Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setReadFilter('all'); setSavedFilter('saved'); }}>
                  Saved Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    onClick={handleSaveAll}
                    disabled={displayItems.length === 0}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Save all visible</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    onClick={handleMarkAllAsRead}
                    disabled={displayItems.length === 0}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Mark all as read</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button className="text-zinc-400 transition-colors hover:text-zinc-200">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs border-zinc-800 bg-zinc-900 text-left">
                  <p className="text-sm leading-relaxed text-zinc-300">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-2.5">
        {displayItems.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <div className="text-center">
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                <Info className="h-5 w-5 text-zinc-500" />
              </div>
              <p className="text-xs font-medium text-zinc-400">No live items for this category</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pb-1">
            {displayItems.map((item) => (
              <NewsItem key={item.id} {...item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
