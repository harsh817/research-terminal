"use client"

import { createClient } from '@/lib/supabase-client'

/**
 * Save a news item for the current user
 * Uses composite primary key for idempotency
 */
export async function saveItem(newsItemId: string): Promise<void> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('Cannot save item: User not authenticated')
      return
    }

    console.log('Saving item:', newsItemId, 'for user:', user.id)

    const { error } = await supabase
      .from('user_saved_items')
      .insert({
        user_id: user.id,
        news_item_id: newsItemId,
        saved_at: new Date().toISOString()
      } as any)
      .select()
      
    if (error && !error.message.includes('duplicate key')) {
      console.error('Error saving item:', error)
    } else {
      console.log('Item saved successfully:', newsItemId)
    }
  } catch (error) {
    console.error('Error saving item:', error)
  }
}

/**
 * Unsave a news item for the current user
 */
export async function unsaveItem(newsItemId: string): Promise<void> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('Cannot unsave item: User not authenticated')
      return
    }

    console.log('Unsaving item:', newsItemId, 'for user:', user.id)

    const { error } = await supabase
      .from('user_saved_items')
      .delete()
      .eq('user_id', user.id)
      .eq('news_item_id', newsItemId)

    if (error) {
      console.error('Error unsaving item:', error)
    } else {
      console.log('Item unsaved successfully:', newsItemId)
    }
  } catch (error) {
    console.error('Error unsaving item:', error)
  }
}

/**
 * Save multiple news items for the current user
 * Useful for "save all" functionality
 */
export async function saveMultiple(newsItemIds: string[]): Promise<void> {
  if (newsItemIds.length === 0) return

  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('Cannot save items: User not authenticated')
      return
    }

    const savedItems = newsItemIds.map(id => ({
      user_id: user.id,
      news_item_id: id,
      saved_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('user_saved_items')
      .upsert(savedItems as any, {
        onConflict: 'user_id,news_item_id',
        ignoreDuplicates: true
      })

    if (error) {
      console.error('Error saving items:', error)
    }
  } catch (error) {
    console.error('Error saving items:', error)
  }
}

/**
 * Get saved status for multiple news items for the current user
 */
export async function getSavedStatus(newsItemIds: string[]): Promise<Set<string>> {
  if (newsItemIds.length === 0) return new Set()

  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Set()
    }

    const { data, error } = await supabase
      .from('user_saved_items')
      .select('news_item_id')
      .eq('user_id', user.id)
      .in('news_item_id', newsItemIds)

    if (error) {
      console.error('Error fetching saved status:', error)
      return new Set()
    }

    return new Set((data as any)?.map((item: any) => item.news_item_id) || [])
  } catch (error) {
    console.error('Error fetching saved status:', error)
    return new Set()
  }
}
