// components/settings/settings-ui.tsx
// Building blocks for settings pages.
"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function SettingsHeader({ title, italic, children }: { title: string; italic?: string; children?: ReactNode }) {
  return (
    <header className="space-y-2">
      <h1 className="text-3xl leading-tight sm:text-4xl">
        {title} {italic && <em className="italic text-primary">{italic}</em>}
      </h1>
      {children && <p className="max-w-xl text-muted-foreground">{children}</p>}
    </header>
  )
}

export function SettingsCard({ title, description, children, tone }: { title?: string; description?: ReactNode; children: ReactNode; tone?: "danger" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("rounded-2xl border bg-card/60", tone === "danger" && "border-destructive/40")}
    >
      {(title || description) && (
        <div className="border-b px-5 py-4 sm:px-6">
          {title && <h2 className={cn("font-sans text-base font-semibold", tone === "danger" && "text-destructive")}>{title}</h2>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="divide-y">{children}</div>
    </motion.section>
  )
}

export function SettingRow({
  label,
  description,
  children,
  htmlFor,
}: {
  label: string
  description?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  locked,
  disabled,
}: {
  id: string
  label: string
  description?: ReactNode
  checked: boolean
  onChange?: (v: boolean) => void
  locked?: boolean
  disabled?: boolean
}) {
  return (
    <SettingRow label={label} description={description} htmlFor={id}>
      {locked ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Always on
        </span>
      ) : (
        <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} className="data-[state=checked]:bg-primary" />
      )}
    </SettingRow>
  )
}

export function LoadError({ what }: { what: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <p className="font-display text-2xl">We couldn&apos;t load your {what}</p>
      <p className="mt-2 text-sm text-muted-foreground">Check your connection and refresh the page.</p>
    </div>
  )
}
