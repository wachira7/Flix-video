// app/(marketing)/about/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { Compass, Heart, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "About FlixVideo",
  description: "FlixVideo helps you decide what to watch, explains every pick, and shows where each title is available. Made in Kenya.",
}

const principles = [
  { icon: Compass, title: "Guide, don't push", body: "Every recommendation says why it was picked. We'd rather you watch one great film than scroll past a hundred." },
  { icon: ShieldCheck, title: "No dark patterns", body: "Clear prices in shillings, a free plan that stays free, and cancelling is one click in Settings." },
  { icon: Heart, title: "Your data is yours", body: "Turn off history tracking, download everything we store, or delete your account, all from Settings." },
]

const does = [
  { icon: Sparkles, title: "AI picks with reasons", body: "Describe a mood or a runtime and get titles that fit, each with a short reason." },
  { icon: MapPin, title: "Where to watch", body: "See which services stream, rent or sell a title in your country, then go straight there." },
  { icon: Users, title: "Watch parties", body: "Watch trailers in sync with friends, chat and react together." },
]

export default function AboutPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden pt-36 pb-20 md:pt-44">
        <div aria-hidden="true" className="light-leak absolute -top-1/3 -left-1/4 -z-10 h-[90%] w-[70%]" />
        <div className="mx-auto max-w-4xl space-y-6 px-5 md:px-8">
          <p className="hero-reveal eyebrow">About FlixVideo</p>
          <h1 className="hero-reveal text-5xl leading-[1.02] sm:text-6xl md:text-7xl" style={{ "--delay": "0.1s" } as React.CSSProperties}>
            Less scrolling. <em className="italic text-primary">Better nights in.</em>
          </h1>
          <p className="hero-reveal max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl" style={{ "--delay": "0.2s" } as React.CSSProperties}>
            FlixVideo is a film and TV guide made in Kenya. We help you decide what to watch, explain every pick, and show you
            where each title is available. We don&apos;t host films ourselves: trailers play here, and we send you to the service
            that has the title.
          </p>
        </div>
      </section>

      <section className="border-y bg-card/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="reveal max-w-xl text-4xl leading-tight md:text-5xl" data-reveal="left">
            What we <em className="italic">believe</em>
          </h2>
          <div className="reveal-stagger mt-12 grid gap-4 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, body }) => (
              <div key={title} className="spotlight rounded-xl border bg-background/60 p-7">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-6xl gap-12 px-5 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <h2 className="reveal text-4xl leading-tight md:text-5xl" data-reveal="left">
            What FlixVideo <em className="italic text-primary">does</em>
          </h2>
          <ul className="reveal-stagger space-y-6" data-reveal="right">
            {does.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4 border-t pt-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t bg-card/40 py-20 md:py-24">
        <div className="reveal mx-auto max-w-3xl space-y-6 px-5 text-center md:px-8" data-reveal="zoom">
          <h2 className="text-4xl leading-tight md:text-5xl">
            Built by <em className="italic text-primary">WaruTech</em>
          </h2>
          <p className="text-lg text-muted-foreground">
            Questions, ideas or partnership enquiries: write to{" "}
            <a href="mailto:support@flixvideo.com" className="text-foreground underline-offset-4 hover:underline">
              support@flixvideo.com
            </a>
            . Film data comes from TMDB, and availability from JustWatch.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" className="h-12 px-7 text-base" asChild>
              <Link href="/signup">Start free</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7 text-base" asChild>
              <Link href="/#pricing">See plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
