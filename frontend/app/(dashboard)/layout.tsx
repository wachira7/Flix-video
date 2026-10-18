// app/(dashboard)/layout.tsx
"use client"

import type { CSSProperties } from "react"
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar"
import { ShellProvider, useShell } from "@/components/dashboard/shell-context"
import { Sidebar, SIDEBAR_WIDTH } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"

function Shell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useShell()
  const width = collapsed ? SIDEBAR_WIDTH.closed : SIDEBAR_WIDTH.open

  return (
    <div
      className="dark min-h-svh bg-background text-foreground"
      style={{ "--sidebar-w": `${width}px` } as CSSProperties}
    >
      <Sidebar />
      <div className="transition-[padding] duration-300 ease-out lg:pl-[var(--sidebar-w)]">
        <Topbar />
        <main className="px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pb-12">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <Shell>{children}</Shell>
    </ShellProvider>
  )
}
