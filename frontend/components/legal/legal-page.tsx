// components/legal/legal-page.tsx
// Shared layout for the Privacy and Terms pages: a short hero, a sticky
// contents list on wide screens, and readable long-form sections.
import Link from "next/link"

export interface LegalSection {
  id: string
  title: string
  body: React.ReactNode
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string
  title: React.ReactNode
  intro: React.ReactNode
  updated: string
  sections: LegalSection[]
}) {
  return (
    <>
      <section className="relative isolate overflow-hidden pt-36 pb-14 md:pt-44">
        <div aria-hidden="true" className="light-leak absolute -top-1/3 -left-1/4 -z-10 h-[90%] w-[70%]" />
        <div className="mx-auto max-w-4xl space-y-6 px-5 md:px-8">
          <p className="hero-reveal eyebrow">{eyebrow}</p>
          <h1 className="hero-reveal text-5xl leading-[1.02] sm:text-6xl" style={{ "--delay": "0.1s" } as React.CSSProperties}>
            {title}
          </h1>
          <div className="hero-reveal max-w-2xl text-lg leading-relaxed text-muted-foreground" style={{ "--delay": "0.2s" } as React.CSSProperties}>
            {intro}
          </div>
          <p className="hero-reveal text-sm text-muted-foreground/80" style={{ "--delay": "0.25s" } as React.CSSProperties}>
            Last updated {updated}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-5 pb-24 md:px-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-28">
            <p className="eyebrow mb-3 !text-muted-foreground/70">On this page</p>
            <ol className="space-y-2 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted-foreground transition-colors hover:text-foreground">
                    <span className="mr-2 tabular-nums text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <article className="max-w-3xl space-y-14">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="reveal scroll-mt-28">
              <h2 className="flex items-baseline gap-4 text-3xl leading-tight">
                <span className="font-sans text-sm tabular-nums text-primary">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="legal-prose mt-5 space-y-4 leading-relaxed text-muted-foreground">{s.body}</div>
            </section>
          ))}
          <p className="border-t pt-8 text-sm text-muted-foreground">
            Questions about this page? Email{" "}
            <a href="mailto:support@flixvideo.com" className="text-foreground underline underline-offset-4 hover:text-primary">
              support@flixvideo.com
            </a>
            . See also our{" "}
            <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary">
              Terms of Use
            </Link>
            .
          </p>
        </article>
      </div>
    </>
  )
}
