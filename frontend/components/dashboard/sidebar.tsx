// components/dashboard/sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import { useSidebar } from "@/app/(dashboard)/layout"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Search, Heart, Film, Tv, User, Settings, LogOut, Play, ChevronLeft, ChevronRight, TrendingUp, Clock, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { logout, getUser } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const mainNavItems = [
  { href: "/dashboard", label: "Browse", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/my-list", label: "My List", icon: Heart },
]

const libraryNavItems = [
  { href: "/movie", label: "Movies", icon: Film },
  { href: "/tv", label: "TV Shows", icon: Tv },
]

const discoverNavItems = [
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/new-releases", label: "New Releases", icon: Sparkles },
  { href: "/top-rated", label: "Top Rated", icon: Star },
  { href: "/recently-added", label: "Recently Added", icon: Clock },
]

const bottomNavItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = useSidebar()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  return (
    <motion.aside
      initial={{ x: 0 }}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-screen bg-linear-to-b from-gray-900 to-black border-r border-gray-800"
    >
      <div className="flex flex-col h-full">
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="bg-linear-to-r from-purple-700 to-fuchsia-600 p-2 rounded-lg">
              <Play className="w-6 h-6 text-white" fill="white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold gradient-text whitespace-nowrap overflow-hidden"
                >
                  FlixVideo
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 hover:bg-gray-800"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            )}
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Avatar className="border-2 border-purple-600">
              <AvatarImage src={user?.avatar_url} alt={user?.email} />
              <AvatarFallback className="bg-linear-to-r from-purple-700 to-fuchsia-600">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-400 truncate">Premium Member</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Main Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Menu
              </p>
            )}
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-linear-to-r from-purple-700 to-fuchsia-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-white")} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )
            })}
          </div>

          {!collapsed && <Separator className="bg-gray-800" />}

          {/* Library Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Library
              </p>
            )}
            {libraryNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-linear-to-r from-purple-700 to-fuchsia-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )
            })}
          </div>

          {!collapsed && <Separator className="bg-gray-800" />}

          {/* Discover Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Discover
              </p>
            )}
            {discoverNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-linear-to-r from-purple-700 to-fuchsia-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 space-y-1 border-t border-gray-800">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-linear-to-r from-purple-700 to-fuchsia-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 w-full"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.aside>
  )
}