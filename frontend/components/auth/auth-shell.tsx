// components/auth/auth-shell.tsx
// Persistent frame for every auth page. The art panel and the
// "Sign in / Create account" switch live here, so they stay put while the
// form slides between pages.
"use client"

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Wordmark } from "@/components/landing/wordmark"
import { tmdbImage, type LandingTitle } from "@/components/landing/landing-types"
import { cn } from "@/lib/utils"
import { AuthArt } from "./auth-art"

// Order decides which way the form slides when moving between pages
const ORDER = ["/login", "/forgot-password", "/reset-password", "/signup", "/verify-email"]

const tabs = [
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create account" },
]

function AuthSwitch({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Account" className="relative inline-flex rounded-full border bg-card/60 p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="auth-switch-pill"
                className="absolute inset-0 -z-10 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Phones don't get the art panel, so show a slow poster strip instead */
function MobilePosterStrip({ posters }: { posters: LandingTitle[] }) {
  if (posters.length < 6) return null
  const row = posters.slice(0, 12)
  return (
    <div aria-hidden="true" className="relative mt-4 overflow-hidden lg:hidden">
      <div className="marquee flex gap-2 opacity-50" style={{ "--marquee-s": "60s" } as CSSProperties}>
        {[...row, ...row].map((p, i) => {
          const src = tmdbImage(p.poster, "w342")
          return (
            <div key={`${p.id}-${i}`} className="relative aspect-2/3 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
              {src && <Image src={src} alt="" fill sizes="64px" className="object-cover" />}
            </div>
          )
        })}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background)),transparent_20%,transparent_80%,hsl(var(--background))),linear-gradient(0deg,hsl(var(--background)),transparent_60%)]" />
    </div>
  )
}

export function AuthShell({ posters, children }: { posters: LandingTitle[]; children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const prev = useRef(pathname)

  const from = ORDER.indexOf(prev.current)
  const to = ORDER.indexOf(pathname)
  const dir = from === -1 || to === -1 || from === to ? 0 : to > from ? 1 : -1
  useEffect(() => {
    prev.current = pathname
  }, [pathname])

  const showSwitch = pathname === "/login" || pathname === "/signup"

  return (
    <div className="dark grid grid-cols-[minmax(0,1fr)] min-h-svh bg-background text-foreground lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthArt posters={posters} />

      <main className="relative flex min-h-svh flex-col overflow-x-hidden">
        <div aria-hidden="true" className="light-leak absolute -top-1/3 right-[-30%] -z-10 h-[60%] w-[90%] lg:hidden" />

        <header className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-10 sm:pt-8">
          <div className="lg:hidden">
            <Wordmark />
          </div>
          <Link
            href="/"
            className="group ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
            Back to home
          </Link>
        </header>
        <MobilePosterStrip posters={posters} />

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[420px] space-y-8">
            {showSwitch && <AuthSwitch pathname={pathname} />}
            <motion.div
              key={pathname}
              initial={reduce ? false : { opacity: 0, x: dir * 48, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
