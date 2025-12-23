"use client"

import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { TagChip } from '@/components/tag-chip'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useSoundSettings } from '@/lib/sound-settings-context'

interface Tag {
  type: 'region' | 'market' | 'theme'
  value: string
  soundEnabled?: boolean
}

interface NewsItemProps {
  id: string
  headline: string
  source: string
  url: string
  timestamp: Date
  tags: Tag[]
  summary?: string
  isNew?: boolean
}

export function NewsItem({ id, headline, source, url, timestamp, tags, summary, isNew }: NewsItemProps) {
  const hasPlayedSound = useRef(false)
  const [showNewBadge, setShowNewBadge] = useState(isNew)
  const [isHighlighted, setIsHighlighted] = useState(isNew)
  const { shouldPlaySoundForTags, playNotificationSound } = useSoundSettings()

  useEffect(() => {
    if (isNew && !hasPlayedSound.current) {
      // Check if this news item has sound-enabled tags AND user settings allow it
      if (shouldPlaySoundForTags(tags)) {
        playNotificationSound().then(played => {
          if (played) {
            hasPlayedSound.current = true
            console.log('🔊 Sound alert for:', headline.substring(0, 50))
          }
        })
      }
    }
  }, [isNew, tags, shouldPlaySoundForTags, playNotificationSound, headline])

  // Auto-fade "NEW" badge and highlight after 5 seconds
  useEffect(() => {
    if (isNew) {
      // Remove "NEW" badge after 5 seconds
      const badgeTimer = setTimeout(() => {
        setShowNewBadge(false)
      }, 5000)

      // Remove highlight after 8 seconds (longer fade)
      const highlightTimer = setTimeout(() => {
        setIsHighlighted(false)
      }, 8000)

      return () => {
        clearTimeout(badgeTimer)
        clearTimeout(highlightTimer)
      }
    }
  }, [isNew])

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const regionTags = tags.filter(tag => tag.type === 'region').slice(0, 1)
  const marketTags = tags.filter(tag => tag.type === 'market').slice(0, 2)
  const themeTags = tags.filter(tag => tag.type === 'theme').slice(0, 2)

  return (
    <Card
      className={cn(
        'group relative cursor-pointer border-l-4 p-2 transition-all duration-700 hover:shadow-lg hover:shadow-zinc-950/50',
        isHighlighted
          ? 'border-l-amber-500 bg-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-500'
          : 'border-l-transparent bg-zinc-900 hover:border-l-zinc-700'
      )}
      onClick={() => window.open(url, '_blank')}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <time className="text-[11px] font-mono font-semibold tabular-nums text-zinc-400">
                {formatTimestamp(timestamp)}
              </time>
              {showNewBadge && (
                <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow-lg animate-pulse">
                  ⚡ NEW
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold leading-tight text-zinc-100 transition-colors group-hover:text-blue-400">
              {headline}
            </h3>

            {summary && (
              <p className="text-xs text-zinc-400 leading-relaxed mt-1 line-clamp-2">
                {summary}
              </p>
            )}

            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-[11px] font-medium text-zinc-500">{source}</span>
            </div>
          </div>

          <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="flex flex-wrap gap-1 pt-0.5">
          {regionTags.map((tag, index) => (
            <TagChip
              key={`${tag.type}-${tag.value}-${index}`}
              type={tag.type}
              value={tag.value}
              soundEnabled={tag.soundEnabled}
            />
          ))}
          {marketTags.map((tag, index) => (
            <TagChip
              key={`${tag.type}-${tag.value}-${index}`}
              type={tag.type}
              value={tag.value}
              soundEnabled={tag.soundEnabled}
            />
          ))}
          {themeTags.map((tag, index) => (
            <TagChip
              key={`${tag.type}-${tag.value}-${index}`}
              type={tag.type}
              value={tag.value}
              soundEnabled={tag.soundEnabled}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
