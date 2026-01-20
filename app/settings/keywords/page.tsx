"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Filter, Loader2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'

interface PaneData {
  id: string
  title: string
  rules: {
    regions?: string[]
    markets?: string[]
    themes?: string[]
    keywords?: string[]
    filterMode?: 'hybrid' | 'keywords-only'
  }
}

const MAX_KEYWORDS_PER_PANE = 20

export default function KeywordSettingsPage() {
  const [panes, setPanes] = useState<PaneData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newKeywords, setNewKeywords] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    loadPanes()
  }, [])

  const loadPanes = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('panes')
        .select('id, title, rules')
        .order('id', { ascending: true })

      if (error) throw error

      setPanes(data || [])
      setError(null)
    } catch (error) {
      console.error('Error loading panes:', error)
      setError(error instanceof Error ? error.message : 'Failed to load panes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddKeyword = (paneId: string) => {
    const keyword = newKeywords[paneId]?.trim()
    if (!keyword) return

    const pane = panes.find(p => p.id === paneId)
    if (!pane) return

    const currentKeywords = pane.rules.keywords || []

    if (currentKeywords.length >= MAX_KEYWORDS_PER_PANE) {
      toast({
        title: "Keyword limit reached",
        description: `Maximum of ${MAX_KEYWORDS_PER_PANE} keywords allowed per pane`,
        variant: "destructive",
      })
      return
    }

    if (currentKeywords.some(kw => kw.toLowerCase() === keyword.toLowerCase())) {
      toast({
        title: "Duplicate keyword",
        description: "This keyword already exists for this pane",
        variant: "destructive",
      })
      return
    }

    setPanes(panes.map(p =>
      p.id === paneId
        ? {
            ...p,
            rules: {
              ...p.rules,
              keywords: [...currentKeywords, keyword]
            }
          }
        : p
    ))

    setNewKeywords({ ...newKeywords, [paneId]: '' })
  }

  const handleRemoveKeyword = (paneId: string, keywordToRemove: string) => {
    setPanes(panes.map(p =>
      p.id === paneId
        ? {
            ...p,
            rules: {
              ...p.rules,
              keywords: (p.rules.keywords || []).filter(kw => kw !== keywordToRemove)
            }
          }
        : p
    ))
  }

  const handleToggleFilterMode = (paneId: string) => {
    setPanes(panes.map(p =>
      p.id === paneId
        ? {
            ...p,
            rules: {
              ...p.rules,
              filterMode: p.rules.filterMode === 'keywords-only' ? 'hybrid' : 'keywords-only'
            }
          }
        : p
    ))
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()

      // Update each pane
      for (const pane of panes) {
        const { error } = await supabase
          .from('panes')
          .update({ rules: pane.rules })
          .eq('id', pane.id)

        if (error) throw error
      }

      toast({
        title: "Settings saved",
        description: "Keyword filters have been updated successfully",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, paneId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddKeyword(paneId)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto max-w-5xl px-6 py-8">
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center">
            <p className="text-sm font-medium text-red-400">Configuration Error</p>
            <p className="mt-2 text-xs text-red-300/70">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="text-zinc-400 transition-all hover:scale-110 hover:text-zinc-200">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Keyword Filters</h1>
              <p className="mt-1 text-sm text-zinc-400">Configure keywords for each pane</p>
            </div>
          </div>

          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          {panes.map((pane) => (
            <Card key={pane.id} className="border-zinc-800 bg-zinc-900/50 shadow-lg">
              <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      {pane.title}
                    </CardTitle>
                    <CardDescription>
                      {pane.rules.keywords?.length || 0} / {MAX_KEYWORDS_PER_PANE} keywords
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label htmlFor={`mode-${pane.id}`} className="text-sm text-zinc-400">
                      {pane.rules.filterMode === 'keywords-only' ? 'Keywords Only' : 'Hybrid Mode'}
                    </Label>
                    <Switch
                      id={`mode-${pane.id}`}
                      checked={pane.rules.filterMode === 'keywords-only'}
                      onCheckedChange={() => handleToggleFilterMode(pane.id)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 min-h-[2.5rem] rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    {pane.rules.keywords && pane.rules.keywords.length > 0 ? (
                      pane.rules.keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 pr-1"
                        >
                          {keyword}
                          <button
                            onClick={() => handleRemoveKeyword(pane.id, keyword)}
                            className="ml-2 rounded-full p-0.5 hover:bg-zinc-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 italic">No keywords added yet</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a keyword and press Enter..."
                      value={newKeywords[pane.id] || ''}
                      onChange={(e) => setNewKeywords({ ...newKeywords, [pane.id]: e.target.value })}
                      onKeyPress={(e) => handleKeyPress(e, pane.id)}
                      className="border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500"
                    />
                    <Button
                      onClick={() => handleAddKeyword(pane.id)}
                      disabled={(pane.rules.keywords?.length || 0) >= MAX_KEYWORDS_PER_PANE}
                      variant="outline"
                      className="border-zinc-700 hover:bg-zinc-800"
                    >
                      Add
                    </Button>
                  </div>

                  <Separator />

                  <div className="rounded-lg bg-zinc-800/30 p-3 text-xs text-zinc-400">
                    <p className="font-semibold text-zinc-300 mb-1">
                      {pane.rules.filterMode === 'keywords-only' ? 'Keywords Only Mode' : 'Hybrid Mode (Default)'}
                    </p>
                    <p>
                      {pane.rules.filterMode === 'keywords-only'
                        ? 'News items are filtered purely by keywords, ignoring tag rules. Use this when you want complete control over what appears in this pane.'
                        : 'News items must match BOTH the pane\'s tag rules (region/market/theme) AND contain at least one keyword. This provides precise filtering while maintaining regional context.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-zinc-800 bg-zinc-900/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-zinc-100">Keyword Filtering Principles</p>
              <ul className="ml-4 space-y-2 text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>Keywords are case-insensitive and match partial text in headlines and sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>Hybrid mode combines tag-based filtering with keyword precision</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>Keywords-only mode ignores tag rules for maximum flexibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>Changes take effect immediately after saving and apply to both existing and new news items</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
