"use client"

import { ReactNode } from 'react'
import { AuthProvider, useAuth } from './auth-context'
import { SoundSettingsProvider } from './sound-settings-context'
import { ConfigError } from '@/components/config-error'

function ProvidersInner({ children }: { children: ReactNode }) {
  const { configError } = useAuth()

  if (configError) {
    return <ConfigError message={configError} />
  }

  return (
    <SoundSettingsProvider>
      {children}
    </SoundSettingsProvider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProvidersInner>{children}</ProvidersInner>
    </AuthProvider>
  )
}
