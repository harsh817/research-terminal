export interface AppConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

function getConfig(): AppConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return {
    supabaseUrl,
    supabaseAnonKey,
  }
}

export function validateConfig(config: AppConfig): boolean {
  return !!(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes('your-project-url-here') &&
    !config.supabaseAnonKey.includes('your-anon-key-here') &&
    config.supabaseUrl.startsWith('https://')
  )
}

export const config = getConfig()
