// components/dashboard/mobile-tab-bar.tsx
// Phone navigation. Slides away while scrolling down, back on scroll up.
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { isActive, mobileTabs } from "./nav-config"

export function MobileTabBar() {
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && y > 120)
        lastY.current = y
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Always show again after navigating
  useEffect(() => setHidden(false), [pathname])

  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl transition-transform duration-300 ease-out lg:hidden",
        hidden && "translate-y-full"
      )}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {mobileTabs.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute top-0 h-[2px] w-10 rounded-b-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <motion.span
                  animate={active ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex"
                >
                  <Icon className={cn("h-5 w-5", active && "text-primary")} aria-hidden="true" />
                </motion.span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
