'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ConfigError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Alert variant="destructive" className="bg-red-950/20 border-red-900/50">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold mb-2">Configuration Error</AlertTitle>
          <AlertDescription className="space-y-4">
            <p className="text-sm">{message}</p>
            <div className="mt-4 p-4 bg-black/40 rounded-md border border-red-900/30">
              <p className="text-xs font-mono text-red-400 mb-2">Required Environment Variables:</p>
              <ul className="text-xs font-mono space-y-1 text-gray-400">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              For local development: Create a <code className="bg-black/40 px-1 py-0.5 rounded">.env</code> file with these variables.
              <br />
              For production: Set these as environment variables in your deployment platform.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
