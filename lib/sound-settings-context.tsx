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
const COOLDOWN_MS = 5000 // 5 second cooldown between sounds
let hasShownAudioBlockedToast = false
let lastSoundPlayedAt = 0
let audioBuffer: AudioBuffer | null = null

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

    // Cooldown check to prevent alert fatigue
    const now = Date.now()
    if (now - lastSoundPlayedAt < COOLDOWN_MS) {
      console.log('Sound on cooldown, skipping')
      return false
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      // Create audio buffer if not already created
      if (!audioBuffer) {
        const sampleRate = audioContext.sampleRate
        const duration = 0.4 // 400ms
        const frequency1 = 880 // A5
        const frequency2 = 1174.66 // D6 (perfect fourth)
        
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate)
        const data = buffer.getChannelData(0)
        
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate
          const envelope = Math.exp(-5 * t) // Exponential decay
          
          // Two-tone chord for pleasant sound
          const tone1 = Math.sin(2 * Math.PI * frequency1 * t)
          const tone2 = Math.sin(2 * Math.PI * frequency2 * t)
          
          data[i] = (tone1 * 0.35 + tone2 * 0.25) * envelope
        }
        
        audioBuffer = buffer
      }

      // Play the sound
      const source = audioContext.createBufferSource()
      const gainNode = audioContext.createGain()
      
      source.buffer = audioBuffer
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Apply user volume setting
      gainNode.gain.setValueAtTime(settings.volume / 100, audioContext.currentTime)
      
      source.start(0)
      
      // Update cooldown
      lastSoundPlayedAt = now
      console.log('✅ Notification sound played')

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
