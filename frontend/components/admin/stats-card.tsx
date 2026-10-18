// components/admin/stats-card.tsx
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  /** Kept for existing callers; tiles use the accent colour */
  iconColor?: string
}

export function StatsCard({ title, value, change, changeType = "neutral", icon: Icon }: StatsCardProps) {
  return (
    <div className="spotlight rounded-xl border bg-card/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-3 font-display text-4xl leading-none tabular-nums">{value}</p>
      {change && (
        <p
          className={cn(
            "mt-3 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            changeType === "positive" && "bg-success/15 text-success",
            changeType === "negative" && "bg-destructive/15 text-destructive",
            changeType === "neutral" && "bg-muted text-muted-foreground"
          )}
        >
          {change}
        </p>
      )}
    </div>
  )
}
