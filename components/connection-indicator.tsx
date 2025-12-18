import { Badge } from '@/components/ui/badge'

interface ConnectionIndicatorProps {
  status: 'live' | 'reconnecting' | 'disconnected'
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const statusConfig = {
    live: {
      label: 'Live',
      className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
      dotClassName: 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]'
    },
    reconnecting: {
      label: 'Reconnecting',
      className: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
      dotClassName: 'bg-amber-500 animate-pulse shadow-[0_0_4px_rgba(245,158,11,0.5)]'
    },
    disconnected: {
      label: 'Disconnected',
      className: 'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
      dotClassName: 'bg-red-500'
    }
  }

  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      <div className={`mr-2 h-2 w-2 rounded-full ${config.dotClassName}`} />
      {config.label}
    </Badge>
  )
}
