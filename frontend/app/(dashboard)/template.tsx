// app/(dashboard)/template.tsx
// Re-mounts on every navigation, giving each page a soft entrance.
"use client"

import { motion, useReducedMotion } from "framer-motion"

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
