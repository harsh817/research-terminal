"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, HelpCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConnectionIndicator } from '@/components/connection-indicator'
import { useConnection } from '@/lib/connection-context'
import { useAuth } from '@/lib/auth-context'

export function HeaderBar() {
  const { status } = useConnection()
  const { signOut } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/New_York',
      hour12: false
    })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80">
      <div className="container flex h-16 items-center justify-between px-6">
        <Link href="/terminal" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
            <span className="text-lg font-bold text-black">R</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Research Terminal</h1>
        </Link>

        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-zinc-400">NY Time:</span>
          <span className="font-mono text-zinc-100" suppressHydrationWarning>
            {formatTime(currentTime)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ConnectionIndicator status={status} />

          <div className="h-6 w-px bg-zinc-800" />

          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          <Link href="/help">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
