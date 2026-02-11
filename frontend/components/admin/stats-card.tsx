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
  iconColor = 'text-purple-500'
}: StatsCardProps) {
  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          {change && (
            <p className={`text-sm mt-2 ${
              changeType === 'positive' ? 'text-green-500' :
              changeType === 'negative' ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gray-800 ${iconColor}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </Card>
  )
}
