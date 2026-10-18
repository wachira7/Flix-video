// components/landing/features-section.tsx
import { Compass, MapPin, Users, ListChecks } from "lucide-react"

const features = [
  {
    icon: Compass,
    title: "Picks that explain themselves",
    body: "Every recommendation says why it was chosen, based on what you have rated, saved and watched. No mystery algorithm.",
  },
  {
    icon: MapPin,
    title: "Where to watch, in one place",
    body: "See whether a title is streaming, for rent or to buy in Kenya, with prices, then go straight to it.",
  },
  {
    icon: Users,
    title: "Watch parties",
    body: "Pick something with friends, chat in real time and keep everyone on the same scene. Up to 50 guests on Premium.",
  },
  {
    icon: ListChecks,
    title: "Lists, ratings and reviews",
    body: "Keep a watchlist, build themed lists to share, and rate what you have seen so your picks keep getting better.",
  },
]

export function FeaturesSection() {
  return (
    <section className="border-y bg-card/40 py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="reveal max-w-2xl space-y-5" data-reveal="left">
          <p className="eyebrow">What FlixVideo does</p>
          <h2 className="text-4xl leading-[1.05] md:text-5xl">
            Built to help you choose, <em className="italic">not to keep you scrolling.</em>
          </h2>
        </div>

        <div className="reveal-stagger mt-14 grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="spotlight group space-y-3 rounded-xl border bg-background/60 p-7">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="max-w-md leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
