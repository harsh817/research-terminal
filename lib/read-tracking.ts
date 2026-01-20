"use client"

import { createClient } from '@/lib/supabase-client'

/**
 * Mark a news item as read for the current user
 * Uses ON CONFLICT DO NOTHING for idempotency
 */
export async function markAsRead(newsItemId: string): Promise<void> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('Cannot mark as read: User not authenticated')
      return
    }

    const { error } = await supabase
      .from('user_read_items')
      .insert({
        user_id: user.id,
        news_item_id: newsItemId,
        read_at: new Date().toISOString()
      } as never)
      .select()
      // Ignore conflicts (item already marked as read)
      
    if (error && !error.message.includes('duplicate key')) {
      console.error('Error marking item as read:', error)
    }
  } catch (error) {
    console.error('Error marking item as read:', error)
  }
}

/**
 * Mark multiple news items as read for the current user
 * Useful for "mark all as read" functionality
 */
export async function markAllAsRead(newsItemIds: string[]): Promise<void> {
  if (newsItemIds.length === 0) return

  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('Cannot mark items as read: User not authenticated')
      return
    }

    const readItems = newsItemIds.map(id => ({
      user_id: user.id,
      news_item_id: id,
      read_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('user_read_items')
      .upsert(readItems as never, {
        onConflict: 'user_id,news_item_id',
        ignoreDuplicates: true
      })

    if (error) {
      console.error('Error marking items as read:', error)
    }
  } catch (error) {
    console.error('Error marking items as read:', error)
  }
}

/**
 * Get read status for multiple news items for the current user
 */
export async function getReadStatus(newsItemIds: string[]): Promise<Set<string>> {
  if (newsItemIds.length === 0) return new Set()

  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Set()
    }

    const { data, error } = await supabase
      .from('user_read_items')
      .select('news_item_id')
      .eq('user_id', user.id)
      .in('news_item_id', newsItemIds)

    if (error) {
      console.error('Error fetching read status:', error)
      return new Set()
    }

    return new Set(data?.map((item: any) => item.news_item_id) || [])
  } catch (error) {
    console.error('Error fetching read status:', error)
    return new Set()
  }
}

/**
 * Mark a news item as unread (remove from read items)
 */
export async function markAsUnread(newsItemId: string): Promise<void> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('Cannot mark as unread: User not authenticated')
      return
    }

    const { error } = await supabase
      .from('user_read_items')
      .delete()
      .eq('user_id', user.id)
      .eq('news_item_id', newsItemId)

    if (error) {
      console.error('Error marking item as unread:', error)
    }
  } catch (error) {
    console.error('Error marking item as unread:', error)
  }
}
