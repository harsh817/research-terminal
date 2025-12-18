import { ConnectionProvider } from '@/lib/connection-context'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConnectionProvider>
      {children}
    </ConnectionProvider>
  )
}
