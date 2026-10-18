// components/landing/pricing-section.tsx
// Plan details live in lib/plans.ts (mirrors backend/src/config/plans.js).
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PLANS } from "@/lib/plans"

const plans = PLANS.map((p) => ({
  ...p,
  price: String(p.price),
  cta: p.id === "free" ? "Start free" : `Choose ${p.name}`,
  href: p.id === "free" ? "/signup" : `/signup?plan=${p.id}`,
}))

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y bg-card/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="reveal max-w-2xl space-y-5" data-reveal="left">
          <p className="eyebrow">Plans</p>
          <h2 className="text-4xl leading-[1.05] md:text-5xl">
            Simple prices, <em className="italic">in shillings.</em>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start on the free plan and upgrade only if you want more. No contracts, and you can change plan whenever
            you like.
          </p>
        </div>

        <div className="reveal-stagger mt-14 grid gap-5 md:grid-cols-3" data-reveal="zoom">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "spotlight relative flex flex-col rounded-xl border bg-background p-7 transition-transform duration-300 hover:-translate-y-1",
                plan.featured && "sheen-border border-transparent shadow-[0_24px_60px_-30px_hsl(var(--primary)/0.45)]"
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Everything included
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>

              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-sm text-muted-foreground">KSh</span>
                <span className="font-display text-5xl tabular-nums leading-none">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </p>

              <ul className="mt-7 flex-1 space-y-3 border-t pt-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm leading-snug">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 h-11 w-full"
                variant={plan.featured ? "default" : "outline"}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Pay monthly with M-Pesa, card or crypto.
        </p>
      </div>
    </section>
  )
}
