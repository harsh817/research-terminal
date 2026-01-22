"use client"

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Check, Star } from 'lucide-react'
import { TagChip } from '@/components/tag-chip'
import { Card } from '@/components/ui/card'
import { markAsRead } from '@/lib/read-tracking'
import { saveItem, unsaveItem } from '@/lib/saved-items'

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
  isNew?: boolean
  isRead?: boolean
  isSaved?: boolean
}

export function NewsItem({ id, headline, source, url, timestamp, tags, isNew, isRead: initialIsRead, isSaved: initialIsSaved }: NewsItemProps) {
  const hasPlayedSound = useRef(false)
  const [isRead, setIsRead] = useState(initialIsRead)
  const [isSaved, setIsSaved] = useState(initialIsSaved)

  // Update local state when props change
  useEffect(() => {
    setIsRead(initialIsRead)
  }, [initialIsRead])

  useEffect(() => {
    setIsSaved(initialIsSaved)
  }, [initialIsSaved])

  const handleClick = async () => {
    // Mark as read immediately (optimistic update)
    if (!isRead) {
      setIsRead(true)
      await markAsRead(id)
    }
    // Open URL
    window.open(url, '_blank')
  }

  const handleStarClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    // Toggle saved status (optimistic update)
    if (isSaved) {
      setIsSaved(false)
      await unsaveItem(id)
    } else {
      setIsSaved(true)
      await saveItem(id)
    }
  }

  useEffect(() => {
    if (isNew && !hasPlayedSound.current) {
      const hasSoundEnabledTags = tags.some(tag => tag.soundEnabled)

      if (hasSoundEnabledTags) {
        playNotificationSound()
        hasPlayedSound.current = true
      }
    }
  }, [isNew, tags])

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

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
      className={`group relative cursor-pointer border-l-4 bg-zinc-900 p-2 transition-all hover:shadow-lg hover:shadow-zinc-950/50 ${
        isNew
          ? 'border-l-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-500 ring-2 ring-emerald-500/30'
          : 'border-l-transparent hover:border-l-zinc-700'
      } ${
        isRead ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <time className="text-[11px] font-mono font-semibold tabular-nums text-zinc-400">
                {formatTimestamp(timestamp)}
              </time>
              {isNew && (
                <span className="inline-flex items-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/50 animate-pulse">
                  NEW
                </span>
              )}
              {isRead && (
                <Check className="h-3 w-3 text-green-500/70" />
              )}
              <button
                onClick={handleStarClick}
                className="ml-auto flex-shrink-0 transition-colors hover:scale-110"
                aria-label={isSaved ? "Unsave item" : "Save item"}
              >
                <Star
                  className={`h-3.5 w-3.5 ${
                    isSaved
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-zinc-500 hover:text-yellow-500'
                  }`}
                />
              </button>
            </div>

            <h3 className={`text-sm leading-tight transition-colors group-hover:text-blue-400 ${
              isRead ? 'font-normal text-zinc-300' : 'font-semibold text-zinc-100'
            }`}>
              {headline}
            </h3>

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
