"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { VolumeX, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'

interface SoundSettings {
  masterEnabled: boolean
  volume: number
  tagSettings: Record<string, boolean>
}

interface SoundSettingsContextType extends SoundSettings {
  setMasterEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
  toggleTag: (tagId: string) => void
  shouldPlaySoundForTags: (tags: Array<{ value: string; soundEnabled: boolean }>) => boolean
  playTestSound: () => void
  playNotificationSound: () => Promise<boolean>
}

const SoundSettingsContext = createContext<SoundSettingsContextType | undefined>(undefined)

const DEFAULT_SETTINGS: SoundSettings = {
  masterEnabled: true,
  volume: 70,
  tagSettings: {}
}

const STORAGE_KEY = 'news-terminal-sound-settings'
let hasShownAudioBlockedToast = false

export function SoundSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings(parsed)
      } catch (e) {
        console.error('Failed to parse stored settings:', e)
      }
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  }, [settings, isInitialized])

  const setMasterEnabled = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, masterEnabled: enabled }))
  }

  const setVolume = (volume: number) => {
    setSettings(prev => ({ ...prev, volume }))
  }

  const toggleTag = (tagId: string) => {
    setSettings(prev => ({
      ...prev,
      tagSettings: {
        ...prev.tagSettings,
        [tagId]: !prev.tagSettings[tagId]
      }
    }))
  }

  const shouldPlaySoundForTags = (tags: Array<{ value: string; soundEnabled: boolean }>) => {
    if (!settings.masterEnabled) return false

    return tags.some(tag => {
      if (!tag.soundEnabled) return false

      const tagKey = tag.value.toLowerCase().replace(/\s+/g, '-')

      if (settings.tagSettings[tagKey] === undefined) {
        return true
      }

      return settings.tagSettings[tagKey]
    })
  }

  const playNotificationSound = async (): Promise<boolean> => {
    if (!settings.masterEnabled) return false

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

      gainNode.gain.setValueAtTime(settings.volume / 100, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)

      return true
    } catch (error) {
      console.error('Failed to play notification sound:', error)

      if (!hasShownAudioBlockedToast) {
        hasShownAudioBlockedToast = true
        toast.error('Sound alerts blocked by browser', {
          description: 'Click the lock icon in your address bar to enable sound permissions.',
          duration: 8000,
          icon: <VolumeX className="h-4 w-4" />,
          action: {
            label: 'Settings',
            onClick: () => {
              window.location.href = '/settings'
            }
          }
        })
      }

      return false
    }
  }

  const playTestSound = async () => {
    await playNotificationSound()
  }

  return (
    <SoundSettingsContext.Provider
      value={{
        ...settings,
        setMasterEnabled,
        setVolume,
        toggleTag,
        shouldPlaySoundForTags,
        playTestSound,
        playNotificationSound
      }}
    >
      {children}
    </SoundSettingsContext.Provider>
  )
}

export function useSoundSettings() {
  const context = useContext(SoundSettingsContext)
  if (context === undefined) {
    throw new Error('useSoundSettings must be used within a SoundSettingsProvider')
  }
  return context
}
