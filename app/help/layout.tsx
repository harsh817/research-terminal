import { ConnectionProvider } from '@/lib/connection-context'

export default function HelpLayout({
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
