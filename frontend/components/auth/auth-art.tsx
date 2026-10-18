// components/auth/auth-art.tsx
// Left-hand art panel for the auth pages: three columns of real posters
// drifting at different speeds, with a caption that changes per page.
"use client"

import type { CSSProperties } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Wordmark } from "@/components/landing/wordmark"
import { tmdbImage, type LandingTitle } from "@/components/landing/landing-types"

const captions: Record<string, { title: string; italic: string; body: string }> = {
  "/login": {
    title: "Welcome back.",
    italic: "Your watchlist kept your seat.",
    body: "Pick up where you left off, with fresh picks waiting.",
  },
  "/signup": {
    title: "Rate a few films.",
    italic: "We'll find the next one.",
    body: "Free to start. Every recommendation tells you why it was chosen.",
  },
  "/forgot-password": {
    title: "It happens.",
    italic: "Let's get you back in.",
    body: "We'll email you a link to choose a new password.",
  },
  "/reset-password": {
    title: "New password,",
    italic: "same great taste.",
    body: "Choose something strong. You'll only need to do this once.",
  },
  "/verify-email": {
    title: "One last step.",
    italic: "Then the lights go down.",
    body: "Confirm your email and your account is ready.",
  },
}

function Column({ posters, seconds, reverse }: { posters: LandingTitle[]; seconds: number; reverse?: boolean }) {
  const loop = [...posters, ...posters]
  return (
    <div className="relative min-w-0 flex-1 overflow-hidden">
      <div
        className={reverse ? "poster-column poster-column-reverse" : "poster-column"}
        style={{ "--column-s": `${seconds}s` } as CSSProperties}
      >
        {loop.map((p, i) => {
          const src = tmdbImage(p.poster, "w342")
          return (
            <div key={`${p.id}-${i}`} className="relative aspect-2/3 w-full overflow-hidden rounded-md bg-muted">
              {src && <Image src={src} alt="" fill sizes="14vw" className="object-cover" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AuthArt({ posters }: { posters: LandingTitle[] }) {
  const pathname = usePathname()
  const caption = captions[pathname] ?? captions["/login"]
  const third = Math.ceil(posters.length / 3)
  const cols = [posters.slice(0, third), posters.slice(third, third * 2), posters.slice(third * 2)]
  const hasPosters = cols.every((c) => c.length >= 3)

  return (
    <aside className="relative isolate hidden overflow-hidden border-r lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
      {hasPosters ? (
        <div aria-hidden="true" className="absolute inset-0 -z-20 flex scale-110 -rotate-3 gap-3 px-3 opacity-60">
          <Column posters={cols[0]} seconds={70} />
          <Column posters={cols[1]} seconds={90} reverse />
          <Column posters={cols[2]} seconds={80} />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_30%_30%,hsl(var(--primary)/0.3),transparent_60%)]"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,hsl(var(--background)/0.85)_0%,hsl(var(--background)/0.35)_35%,hsl(var(--background)/0.55)_60%,hsl(var(--background))_100%)]"
      />
      <div aria-hidden="true" className="light-leak absolute -top-1/4 -left-1/4 -z-10 h-[70%] w-[80%]" />
      <div aria-hidden="true" className="film-grain absolute inset-0 -z-10" />

      <div className="p-10">
        <Wordmark />
      </div>

      <div className="mt-auto p-10 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md space-y-4"
          >
            <p className="font-display text-4xl leading-[1.05] xl:text-5xl">
              {caption.title} <em className="italic text-primary">{caption.italic}</em>
            </p>
            <p className="text-base text-foreground/70">{caption.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  )
}
