import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { config, validateConfig } from './config'

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null
let configValidated = false

export function isSupabaseConfigured(): boolean {
  return validateConfig(config)
}

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be created on the client side')
  }

  if (supabaseClient) {
    return supabaseClient
  }

  if (!configValidated) {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase not configured. Please update your .env file with valid Supabase credentials. See SUPABASE_SETUP.md for instructions.'
      )
    }
    configValidated = true
  }

  supabaseClient = createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return supabaseClient
}
