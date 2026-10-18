// components/dashboard/shell-context.tsx
// Sidebar collapsed state, remembered per browser.
"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

const KEY = "flix:sidebar-collapsed"

const ShellContext = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
})

export function ShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === "1")
    } catch {
      // storage blocked: keep the default
    }
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? "0" : "1")
      } catch {}
      return !c
    })
  }, [])

  // "[" toggles the sidebar, unless the user is typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== "[" || e.metaKey || e.ctrlKey || t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return
      toggle()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle])

  return <ShellContext.Provider value={{ collapsed, toggle }}>{children}</ShellContext.Provider>
}

export const useShell = () => useContext(ShellContext)
