// app/(dashboard)/settings/layout.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, CreditCard, MonitorSmartphone, Shield, SlidersHorizontal, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { href: "/settings/account", label: "Account", icon: UserRound },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/preferences", label: "Preferences", icon: SlidersHorizontal },
  { href: "/settings/privacy", label: "Privacy & data", icon: Shield },
  { href: "/settings/devices", label: "Devices", icon: MonitorSmartphone },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <nav aria-label="Settings" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow mb-4 hidden lg:block">Settings</p>
        <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 scrollbar-hide sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {SECTIONS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span layoutId="settings-active" className="absolute inset-0 -z-10 rounded-lg bg-accent" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                  )}
                  <Icon className={cn("h-4 w-4", active && "text-primary")} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="min-w-0 max-w-3xl space-y-6">{children}</div>
    </div>
  )
}
