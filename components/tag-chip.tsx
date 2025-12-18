import { Badge } from '@/components/ui/badge'
import { Volume2 } from 'lucide-react'

interface TagChipProps {
  type: 'region' | 'market' | 'theme'
  value: string
  soundEnabled?: boolean
}

export function TagChip({ type, value, soundEnabled }: TagChipProps) {
  const typeConfig = {
    region: {
      base: 'bg-blue-500/20 text-blue-300 border-blue-500/20 hover:bg-blue-500/30',
      sound: 'bg-blue-500/30 text-blue-300 border-blue-500/40 ring-2 ring-blue-500/30'
    },
    market: {
      base: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/30',
      sound: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/30'
    },
    theme: {
      base: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/30',
      sound: 'bg-cyan-500/30 text-cyan-300 border-cyan-500/40 ring-2 ring-cyan-500/30'
    }
  }

  const config = typeConfig[type]
  const className = soundEnabled ? config.sound : config.base

  return (
    <Badge
      variant="outline"
      className={`${className} text-[10px] font-medium transition-all inline-flex items-center gap-0.5 px-1.5 py-0`}
    >
      {soundEnabled && (
        <Volume2 className="h-2.5 w-2.5 animate-pulse" />
      )}
      {value}
    </Badge>
  )
}
