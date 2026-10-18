// components/admin/admin-sidebar.tsx
// Admin navigation: a rail on desktop, a scrolling tab strip on phones.
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, CreditCard, LayoutDashboard, LogOut, Shield, TrendingUp, Users } from "lucide-react"
import { logout } from "@/lib/auth"
import { displayName, useCurrentUser } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/admin/moderation", label: "Moderation", icon: Shield },
]

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useCurrentUser()

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" aria-hidden="true">
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9.5 7.5v9l7-4.5z" fill="currentColor" />
          </svg>
          <span className="font-display text-[1.35rem] leading-none">
            Flix<em className="italic">Video</em>
          </span>
          <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">Admin</span>
        </div>

        <nav aria-label="Admin" className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span layoutId="admin-active" className="absolute inset-0 -z-10 rounded-lg bg-accent" transition={{ type: "spring", stiffness: 500, damping: 40 }}>
                    <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-primary" />
                  </motion.span>
                )}
                <Icon className={cn("h-[18px] w-[18px]", active && "text-primary")} aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">
            Signed in as <span className="text-foreground">{displayName(user)}</span>
            {user?.role && ` · ${user.role}`}
          </p>
          <Link href="/dashboard" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground">
            <ArrowLeft className="h-[18px] w-[18px]" /> Back to the app
          </Link>
          <button type="button" onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>

      {/* Phones and tablets */}
      <div className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="font-display text-xl">
            Flix<em className="italic">Video</em> <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 align-middle font-sans text-[10px] font-semibold text-primary uppercase not-italic">Admin</span>
          </span>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Back to app
          </Link>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-hide">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
                isActive(pathname, href) ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
