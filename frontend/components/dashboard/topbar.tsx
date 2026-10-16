// components/dashboard/topbar.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Wordmark } from "@/components/landing/wordmark"
import { cn } from "@/lib/utils"
import { NotificationsDropdown } from "./notifications-dropdown"
import { SearchBar } from "./search-bar"
import { UserMenu } from "./user-menu"

export function Topbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-origin-border transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-linear-to-b from-background/90 to-background/0"
      )}
    >
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <Wordmark href="/dashboard" />
        </div>

        <div className="hidden flex-1 sm:flex">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>
          <NotificationsDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
