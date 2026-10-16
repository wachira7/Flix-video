// components/landing/spotlight.tsx
// One delegated pointer listener that feeds cursor position to any `.spotlight`
// element, which paints an amber glow at that point (see globals.css).
"use client"

import { useEffect } from "react"

export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(".spotlight")
      if (!el) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        el.style.setProperty("--mx", `${e.clientX - r.left}px`)
        el.style.setProperty("--my", `${e.clientY - r.top}px`)
      })
    }
    document.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      document.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
