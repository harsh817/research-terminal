"use client"

import { Info } from 'lucide-react'
import { NewsItem } from '@/components/news-item'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
}

interface PaneProps {
  id: string
  title: string
  description: string
  items: NewsItemData[]
}

export function Pane({ title, description, items }: PaneProps) {
  const displayItems = items.slice(0, 10).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <Card className="flex h-full flex-col overflow-hidden border-zinc-800 bg-zinc-900/50 shadow-lg transition-all hover:border-zinc-700">
      <CardHeader className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-zinc-100">{title}</h2>
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
