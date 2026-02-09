// components/dashboard/sidebar.tsx

"use client"

import { useState, useEffect } from "react"
import { useSidebar } from "@/app/(dashboard)/layout"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Search, Heart, Film, Tv, User, Settings, LogOut, Play, ChevronLeft, ChevronRight, TrendingUp, Clock, Star, Sparkles, Brain, Users, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { logout, getUser } from "@/lib/auth"
import { subscriptionAPI } from "@/lib/api/subscriptions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { avatarEvents } from "@/lib/events/avatar-events"

const mainNavItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/my-list", label: "My List", icon: Heart },
  { href: "/lists", label: "My Lists", icon: List }, 
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
  { href: "/ai-chat", label: "AI Chat", icon: Brain },
  { href: "/watch-party", label: "Watch Party", icon: Users }, 
]

const bottomNavItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = useSidebar()
  const [user, setUser] = useState<any>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('free')
  const [mounted, setMounted] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const currentUser = getUser()
    setUser(currentUser)
    setAvatarUrl(currentUser?.avatar_url || null)

    // Fetch subscription plan
  const fetchSubscription = async () => {
    try {
      const response = await subscriptionAPI.getMySubscription()
      setSubscriptionPlan(response.subscription?.plan_type || 'free')
    } catch (error) {
      setSubscriptionPlan('free')
    }
  }
  fetchSubscription()

    // Subscribe to avatar updates
    const unsubscribe = avatarEvents.subscribe((newAvatarUrl) => {
      setAvatarUrl(newAvatarUrl)
    })

    return () => unsubscribe()
  }, [])

  if (!mounted) {
    return (
      <motion.aside
        initial={{ x: 0 }}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-40 h-screen bg-linear-to-b from-gray-900 to-black border-r border-gray-800"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-linear-to-r from-purple-700 to-fuchsia-600 p-2 rounded-lg">
                <Play className="w-6 h-6 text-white" fill="white" />
              </div>
              {!collapsed && (
                <span className="text-2xl font-bold gradient-text whitespace-nowrap">
                  FlixVideo
                </span>
              )}
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
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-800 animate-pulse" />
              {!collapsed && (
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-20 bg-gray-800 rounded animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    )
  }

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

        {/* User Info UPDATES REACTIVELY */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Avatar className="border-2 border-purple-600">
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={user?.email} />
              )}
              <AvatarFallback className="bg-linear-to-r from-purple-700 to-fuchsia-600">
                {user?.email?.charAt(0).toUpperCase() || "U"}
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
                    {user?.full_name || user?.email?.split('@')[0] || "User"}
                  </p>
                  <p className={cn(
                    "text-xs truncate",
                    subscriptionPlan === 'premium' ? "text-purple-400" : 
                    subscriptionPlan === 'basic' ? "text-blue-400" : 
                    "text-gray-400"
                  )}>
                    {subscriptionPlan === 'premium' && '👑 Premium Member'}
                    {subscriptionPlan === 'basic' && '⭐ Basic Member'}
                    {subscriptionPlan === 'free' && 'Free Plan'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation sections and links */}
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

          {/* Library & Discover sections...  */}
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