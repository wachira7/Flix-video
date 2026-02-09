// components/dashboard/topbar.tsx
"use client"

import { useState, useEffect } from "react"
import { Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationsDropdown } from "./notifications-dropdown"
import { useRouter } from "next/navigation"
import { getUser, logout } from "@/lib/auth"
import { avatarEvents } from "@/lib/events/avatar-events"

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const currentUser = getUser()
    setUser(currentUser)
    setAvatarUrl(currentUser?.avatar_url || null)

    //Subscribe to avatar updates
    const unsubscribe = avatarEvents.subscribe((newAvatarUrl) => {
      setAvatarUrl(newAvatarUrl)
    })

    return () => unsubscribe()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery("")
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="flex items-center justify-between h-16 px-6">
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search movies, TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-600"
            />
          </div>
        </form>

        <div className="flex items-center space-x-4">
          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* User Menu */}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt={user?.email} />
                    )}
                    <AvatarFallback className="bg-linear-to-r from-purple-700 to-fuchsia-600">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}