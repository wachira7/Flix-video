// components/dashboard/user-menu.tsx
"use client"

import Link from "next/link"
import { Crown, LogOut, Settings, Sparkles, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth"
import { displayName, useCurrentUser } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"

const planLabel = { free: "Free", basic: "Basic", premium: "Premium" } as const

export function UserMenu() {
  const { user, avatarUrl, plan } = useCurrentUser()
  const name = displayName(user)
  const initial = name.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="group relative rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        <Avatar
          className={cn(
            "h-9 w-9 ring-2 ring-transparent transition-[box-shadow,transform] duration-200 group-hover:scale-105 group-hover:ring-primary/50",
            plan === "premium" && "ring-primary/70"
          )}
        >
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">{initial}</AvatarFallback>
        </Avatar>
        {plan === "premium" && (
          <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
            <Crown className="h-2.5 w-2.5" aria-hidden="true" />
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="bg-primary/15 font-semibold text-primary">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>

        {plan && (
          <div className="mx-2 mb-1.5 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Plan: <span className="font-semibold text-foreground">{planLabel[plan]}</span>
            </span>
            {plan !== "premium" && (
              <Link href="/subscription" className="font-semibold text-primary hover:underline">
                Upgrade
              </Link>
            )}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-md px-2 py-2">
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-md px-2 py-2">
          <Link href="/ai-chat">
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            Ask AI
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-md px-2 py-2">
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={logout}
          className="rounded-md px-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
