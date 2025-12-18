"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

type ConnectionStatus = 'live' | 'reconnecting' | 'disconnected'

interface ConnectionContextType {
  status: ConnectionStatus
  setStatus: (status: ConnectionStatus) => void
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('live')
  const [previousStatus, setPreviousStatus] = useState<ConnectionStatus>('live')

  useEffect(() => {
    if (status !== previousStatus) {
      if (status === 'reconnecting' && previousStatus === 'live') {
        toast.error('Connection lost', {
          description: 'Attempting to reconnect to news feed...',
          icon: <AlertCircle className="h-4 w-4" />,
        })
      } else if (status === 'live' && previousStatus === 'reconnecting') {
        toast.success('Connection restored', {
          description: 'Live news feed is now active.',
          icon: <CheckCircle2 className="h-4 w-4" />,
        })
      }
      setPreviousStatus(status)
    }
  }, [status, previousStatus])

  return (
    <ConnectionContext.Provider value={{ status, setStatus }}>
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider')
  }
  return context
}
