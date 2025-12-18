import { HeaderBar } from '@/components/header-bar'
import { ConnectionProvider } from '@/lib/connection-context'

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConnectionProvider>
      <HeaderBar />
      {children}
    </ConnectionProvider>
  )
}
