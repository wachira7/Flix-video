// components/landing/cta-section.tsx
import Image from "next/image"
import Link from "next/link"
import type { CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { tmdbImage, type LandingTitle } from "./landing-data"

function PosterRow({ posters, reverse, seconds }: { posters: LandingTitle[]; reverse?: boolean; seconds: number }) {
  // Duplicate the row so the -50% loop is seamless
  const loop = [...posters, ...posters]
  return (
    <div
      className={cn("marquee flex gap-3", reverse && "marquee-reverse")}
      style={{ "--marquee-s": `${seconds}s` } as CSSProperties}
    >
      {loop.map((p, i) => {
        const src = tmdbImage(p.poster, "w342")
        return (
          <div key={`${p.id}-${i}`} className="relative aspect-2/3 w-28 shrink-0 overflow-hidden rounded-md bg-muted md:w-36">
            {src && <Image src={src} alt="" fill sizes="144px" className="object-cover" />}
          </div>
        )
      })}
    </div>
  )
}

export function CTASection({ posters }: { posters: LandingTitle[] }) {
  const half = Math.ceil(posters.length / 2)
  const rowA = posters.slice(0, half)
  const rowB = posters.slice(half)

  return (
    <section className="relative isolate overflow-hidden border-t py-28 md:py-40">
      {rowA.length > 2 && (
        <div aria-hidden="true" className="absolute inset-0 -z-20 flex -rotate-6 scale-110 flex-col justify-center gap-3 opacity-55">
          <PosterRow posters={rowA} seconds={90} />
          {rowB.length > 2 && <PosterRow posters={rowB} seconds={110} reverse />}
        </div>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_center,hsl(var(--background)/0.88)_0%,hsl(var(--background)/0.55)_70%,hsl(var(--background)/0.9)_100%)]"
      />

      <div className="reveal mx-auto max-w-3xl px-5 text-center md:px-8" data-reveal="zoom">
        <h2 className="text-4xl leading-[1.05] md:text-6xl">
          Your next favourite film <em className="italic">is already out there.</em>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
          Rate a few titles you love and FlixVideo will take it from there.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="h-12 px-8 text-base" asChild>
            <Link href="/signup">Start free</Link>
          </Button>
          <Button size="lg" variant="ghost" className="h-12 px-6 text-base" asChild>
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
