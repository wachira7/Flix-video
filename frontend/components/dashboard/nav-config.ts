// components/dashboard/nav-config.ts
// Single source of truth for the app navigation (sidebar + mobile tab bar).
import { Compass, Home, Library, Search, Sparkles, Users, type LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Other paths that should highlight this item */
  match?: string[]
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Discover",
    items: [
      { href: "/dashboard", label: "Home", icon: Home },
      { href: "/browse", label: "Browse", icon: Compass, match: ["/movie", "/tv"] },
      { href: "/search", label: "Search", icon: Search },
      { href: "/ai-chat", label: "Ask AI", icon: Sparkles },
    ],
  },
  {
    label: "Yours",
    items: [
      { href: "/library", label: "Library", icon: Library, match: ["/lists", "/my-list"] },
      { href: "/watch-party", label: "Watch parties", icon: Users },
    ],
  },
]

/** The five destinations on the phone tab bar */
export const mobileTabs: NavItem[] = [
  navGroups[0].items[0],
  navGroups[0].items[1],
  navGroups[0].items[2],
  navGroups[1].items[0],
  navGroups[0].items[3],
]

export function isActive(pathname: string, item: NavItem) {
  const roots = [item.href, ...(item.match ?? [])]
  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}
