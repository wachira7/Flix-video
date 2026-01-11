// app/(dashboard)/layout.tsx
"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { useState, createContext, useContext } from "react"

// Create context for sidebar state
const SidebarContext = createContext({
  collapsed: false,
  setCollapsed: (collapsed: boolean) => {},
})

export const useSidebar = () => useContext(SidebarContext)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-black">
        <Sidebar />
        <div 
          className="transition-all duration-300"
          style={{ marginLeft: collapsed ? '80px' : '256px' }}
        >
          <Topbar />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}