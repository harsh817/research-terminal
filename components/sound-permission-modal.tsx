"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Bell, Volume2 } from 'lucide-react'

interface SoundPermissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SoundPermissionModal({ open, onOpenChange }: SoundPermissionModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Volume2 className="h-6 w-6 text-amber-500" />
          </div>
          <AlertDialogTitle>Sound Alerts Blocked</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Sound notifications are currently blocked in your browser. To receive audio alerts for
              critical market events, you'll need to enable sound permissions.
            </p>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4" />
                <span>How to enable sound alerts:</span>
              </div>
              <ol className="ml-6 list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Find "Sound" or "Notifications" in the permissions list</li>
                <li>Change the setting to "Allow"</li>
                <li>Reload this page</li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground">
              You can continue using the terminal without sound alerts, but you may miss critical
              events.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
