// components/landing/scroll-motion.tsx
// Scroll-linked motion for the landing page:
//  - `.reveal` elements slide/fade in when they enter the viewport and out
//    again when they leave, exiting in the direction of travel.
//  - `.reveal-stagger` does the same for each direct child, one after another.
//  - `[data-parallax]` elements drift with scroll (factor = data-parallax).
// Content is only hidden once this has run (html.reveal-ready), so the page is
// fully visible without JS and under reduced motion.
"use client"

import { useEffect } from "react"

export function ScrollMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const root = document.documentElement

    const targets = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .reveal-stagger"))
    targets.forEach((el) => {
      if (el.classList.contains("reveal-stagger")) {
        Array.from(el.children).forEach((child, i) => (child as HTMLElement).style.setProperty("--i", String(i)))
      }
    })

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            el.dataset.exit = ""
            el.classList.add("is-visible")
          } else {
            // Left through the top of the screen: exit upwards. Otherwise downwards.
            el.dataset.exit = entry.boundingClientRect.top < 0 ? "up" : ""
            el.classList.remove("is-visible")
          }
        }
      },
      { threshold: 0.04, rootMargin: "0px 0px -4% 0px" }
    )

    // Mark what's already on screen before hiding anything, so nothing flashes
    const vh = window.innerHeight
    targets.forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.top < vh && r.bottom > 0) el.classList.add("is-visible")
      io.observe(el)
    })
    root.classList.add("reveal-ready")

    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"))
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // Hidden elements wait above or below the screen, matching where they'll
        // re-enter from. Kept current here because a fast jump can skip the observer.
        for (const el of targets) {
          if (el.classList.contains("is-visible")) continue
          el.dataset.exit = el.getBoundingClientRect().bottom < 0 ? "up" : ""
        }

        // Parallax
        const y = window.scrollY
        if (y > vh * 1.5) return
        for (const layer of layers) {
          const factor = Number(layer.dataset.parallax) || 0
          layer.style.transform = `translate3d(0, ${y * factor}px, 0)`
          if (layer.dataset.parallaxFade !== undefined) {
            layer.style.opacity = String(Math.max(0, 1 - y / (vh * 0.7)))
          }
        }
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      io.disconnect()
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
      root.classList.remove("reveal-ready")
    }
  }, [])

  return null
}
