// components/dashboard/sidebar.tsx
// Desktop navigation rail. Collapses to icons (button or "[" key); the amber
// indicator slides to the active item.
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Crown, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useCurrentUser } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"
import { navGroups, isActive, type NavItem } from "./nav-config"
import { useShell } from "./shell-context"

export const SIDEBAR_WIDTH = { open: 248, closed: 76 }

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 -z-10 rounded-lg bg-accent"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        >
          <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-primary" />
        </motion.span>
      )}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-[color,transform] duration-200 group-hover:scale-110",
          active && "text-primary"
        )}
        aria-hidden="true"
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

function PlanCard({ collapsed }: { collapsed: boolean }) {
  const { plan } = useCurrentUser()
  if (!plan || plan === "premium") return null

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/subscription"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 text-primary transition-colors hover:bg-primary/10"
            aria-label="Upgrade your plan"
          >
            <Crown className="h-4 w-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          Upgrade
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href="/subscription"
      className="spotlight group block rounded-xl border border-primary/30 bg-primary/[0.06] p-4 transition-colors hover:border-primary/60"
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Crown className="h-4 w-4 text-primary" aria-hidden="true" />
        {plan === "free" ? "You're on Free" : "You're on Basic"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {plan === "free" ? "Get more AI picks and no ads from KSh 499." : "Unlock the AI assistant with Premium."}
      </p>
      <span className="mt-3 inline-flex text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
        See plans →
      </span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useShell()
  const settingsActive = pathname.startsWith("/settings")

  return (
    <TooltipProvider delayDuration={150}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? SIDEBAR_WIDTH.closed : SIDEBAR_WIDTH.open }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar lg:flex"
      >
        <div className={cn("flex h-16 items-center px-5", collapsed && "justify-center px-0")}>
          <Link href="/dashboard" aria-label="FlixVideo home" className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-primary" aria-hidden="true">
              <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9.5 7.5v9l7-4.5z" fill="currentColor" />
            </svg>
            {!collapsed && (
              <span className="font-display text-[1.4rem] leading-none tracking-tight">
                Flix<em className="italic">Video</em>
              </span>
            )}
          </Link>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-hide">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!collapsed ? (
                <p className="eyebrow px-3 pb-1 !text-muted-foreground/70">{group.label}</p>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-border" aria-hidden="true" />
              )}
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item)} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border p-3">
          <PlanCard collapsed={collapsed} />
          <NavLink
            item={{ href: "/settings", label: "Settings", icon: Settings }}
            active={settingsActive}
            collapsed={collapsed}
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={`${collapsed ? "Expand" : "Collapse"} sidebar ( [ )`}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />
                Collapse
                <kbd className="ml-auto rounded border px-1.5 font-mono text-[10px] text-muted-foreground">[</kbd>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
