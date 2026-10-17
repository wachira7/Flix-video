// app/error.tsx
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCcw } from "lucide-react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  // Don't show raw error messages to visitors; the digest lets support find it in logs
  return (
    <div className="dark flex min-h-svh flex-col items-center justify-center bg-background px-5 text-center text-foreground">
      <h1 className="text-4xl sm:text-5xl">
        Something went <em className="italic text-primary">wrong.</em>
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">It&apos;s not you. Try again, and if it keeps happening, email support@flixvideo.com.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:brightness-110">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="inline-flex h-12 items-center rounded-lg border px-6 text-[15px] font-medium hover:bg-accent">
          Go home
        </Link>
      </div>
      {error.digest && <p className="mt-8 font-mono text-xs text-muted-foreground/70">Reference: {error.digest}</p>}
    </div>
  )
}
