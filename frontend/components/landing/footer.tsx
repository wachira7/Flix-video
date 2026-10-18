// components/landing/footer.tsx
import Link from "next/link"
import { Wordmark } from "./wordmark"

const columns = [
  {
    title: "FlixVideo",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Top 10 this week", href: "/#this-week" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "About FlixVideo", href: "/about" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Create an account", href: "/signup" },
      { label: "Sign in", href: "/login" },
      { label: "Reset password", href: "/forgot-password" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t bg-card/40">
      <div className="reveal mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-4">
            <Wordmark />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Film and TV discovery that explains itself. Find it, then watch it wherever it&apos;s available.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="mailto:support@flixvideo.com" className="transition-colors hover:text-foreground">
                  support@flixvideo.com
                </a>
              </li>
              <li>
                <a href="tel:+254705274244" className="tabular-nums transition-colors hover:text-foreground">
                  +254 705 274 244
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} FlixVideo by WaruTech. Made in Kenya.</p>
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </div>
      </div>
    </footer>
  )
}
