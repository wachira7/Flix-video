// components/admin/stats-card.tsx

import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor?: string
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-primary'
}: StatsCardProps) {
  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          {change && (
            <p className={`text-sm mt-2 ${
              changeType === 'positive' ? 'text-green-500' :
              changeType === 'negative' ? 'text-red-500' :
              'text-muted-foreground'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-secondary ${iconColor}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </Card>
  )
}
