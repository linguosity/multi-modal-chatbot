'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              A critical error occurred in the application.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}