"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Volume2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSoundSettings } from '@/lib/sound-settings-context'
import { createClient } from '@/lib/supabase-client'

interface TagData {
  id: string
  type: string
  value: string
  sound_enabled: boolean
}

export default function SettingsPage() {
  const {
    masterEnabled,
    volume,
    tagSettings,
    setMasterEnabled,
    setVolume,
    toggleTag,
    playTestSound
  } = useSoundSettings()

  const [soundEnabledTags, setSoundEnabledTags] = useState<TagData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSoundEnabledTags()
  }, [])

  const loadSoundEnabledTags = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('sound_enabled', true)
        .order('type', { ascending: true })
        .order('value', { ascending: true })

      if (error) throw error

      setSoundEnabledTags(data || [])
      setError(null)
    } catch (error) {
      console.error('Error loading tags:', error)
      setError(error instanceof Error ? error.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const getTagKey = (tagValue: string) => {
    return tagValue.toLowerCase().replace(/\s+/g, '-')
  }

  const isTagEnabled = (tagValue: string) => {
    const key = getTagKey(tagValue)
    return tagSettings[key] !== false
  }

  const handleToggleTag = (tagValue: string) => {
    const key = getTagKey(tagValue)
    toggleTag(key)
  }

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'theme':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20'
      case 'market':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
      case 'region':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/20'
      default:
        return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/20'
    }
  }

  const groupedTags = soundEnabledTags.reduce((acc, tag) => {
    if (!acc[tag.type]) {
      acc[tag.type] = []
    }
    acc[tag.type].push(tag)
    return acc
  }, {} as Record<string, TagData[]>)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/terminal">
            <Button variant="ghost" size="icon" className="text-zinc-400 transition-all hover:scale-110 hover:text-zinc-200">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Sound Settings</h1>
            <p className="mt-1 text-sm text-zinc-400">Configure audio alerts and notifications</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/50 shadow-lg">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Master Controls
              </CardTitle>
              <CardDescription>
                Global sound settings that apply to all notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="master-sound" className="text-base font-medium text-zinc-100">Master Sound</Label>
                  <p className="text-sm text-zinc-400">
                    Enable or disable all sound alerts
                  </p>
                </div>
                <Switch
                  id="master-sound"
                  checked={masterEnabled}
                  onCheckedChange={setMasterEnabled}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="volume" className="text-base font-medium text-zinc-100">Volume</Label>
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-100">
                    {volume}%
                  </span>
                </div>
                <Slider
                  id="volume"
                  value={[volume]}
                  onValueChange={([val]) => setVolume(val)}
                  max={100}
                  step={1}
                  disabled={!masterEnabled}
                  className="w-full"
                />
              </div>

              <div>
                <Button
                  variant="outline"
                  onClick={playTestSound}
                  disabled={!masterEnabled}
                  className="w-full border-zinc-700 transition-all hover:border-zinc-600 hover:bg-zinc-800"
                >
                  <Volume2 className="mr-2 h-4 w-4" />
                  Test Sound
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50 shadow-lg">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
              <CardTitle>Tag-Specific Alerts</CardTitle>
              <CardDescription>
                Choose which tags trigger sound notifications. Only high-priority tags are eligible for sound alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {error ? (
                <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center">
                  <p className="text-sm font-medium text-red-400">Configuration Error</p>
                  <p className="mt-2 text-xs text-red-300/70">{error}</p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : soundEnabledTags.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-400">No sound-enabled tags found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedTags).map(([type, tags]) => (
                    <div key={type} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                          {type}
                        </h3>
                        <div className="h-px flex-1 bg-zinc-800" />
                      </div>
                      <div className="space-y-3">
                        {tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`${getCategoryColor(tag.type)} border px-2.5 py-0.5 text-xs font-medium`}
                              >
                                {tag.type}
                              </Badge>
                              <Label
                                htmlFor={tag.id}
                                className="cursor-pointer text-sm font-medium text-zinc-200"
                              >
                                {tag.value}
                              </Label>
                            </div>
                            <Switch
                              id={tag.id}
                              checked={isTagEnabled(tag.value)}
                              onCheckedChange={() => handleToggleTag(tag.value)}
                              disabled={!masterEnabled}
                              className="data-[state=checked]:bg-emerald-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-zinc-100">Sound Alert Principles</p>
                <ul className="ml-4 space-y-2 text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    <span>Alerts only trigger for predefined high-impact tags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    <span>5-second cooldown period prevents alert fatigue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    <span>One sound per event, regardless of how many panes it appears in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    <span>Changes apply immediately, no save required</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
