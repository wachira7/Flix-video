// app/not-found.tsx
import Link from "next/link"
import { Wordmark } from "@/components/landing/wordmark"

export default function NotFound() {
  return (
    <div className="dark relative isolate flex min-h-svh flex-col overflow-hidden bg-background px-5 text-foreground">
      <div aria-hidden="true" className="light-leak absolute -top-1/4 -left-1/4 -z-10 h-[80%] w-[70%]" />
      <div className="pt-6">
        <Wordmark />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-[8rem] leading-none text-primary/90 italic sm:text-[11rem]">404</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">This scene was cut.</h1>
        <p className="mt-4 max-w-md text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist, or it moved. Let&apos;s get you back to something good.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:brightness-110">
            Go to Home
          </Link>
          <Link href="/search" className="inline-flex h-12 items-center rounded-lg border px-6 text-[15px] font-medium hover:bg-accent">
            Search titles
          </Link>
        </div>
      </div>
    </div>
  )
}
