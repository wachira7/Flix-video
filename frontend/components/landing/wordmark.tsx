// components/landing/wordmark.tsx
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Wordmark({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="FlixVideo home">
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-primary" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9.5 7.5v9l7-4.5z" fill="currentColor" />
      </svg>
      <span className="font-display text-[1.45rem] leading-none tracking-tight text-foreground">
        Flix<em className="italic">Video</em>
      </span>
    </Link>
  )
}
