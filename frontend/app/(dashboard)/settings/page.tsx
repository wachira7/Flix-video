// app/(dashboard)/settings/page.tsx 

"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import { User, CreditCard, Monitor, Bell, Palette, Shield, ChevronRight, Settings as SettingsIcon } from "lucide-react"

const settingsLinks = [
  {
    href: "/settings/account",
    label: "Account",
    icon: User,
    description: "Email, phone, account status",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    href: "/settings/billing",
    label: "Billing",
    icon: CreditCard,
    description: "Payment methods, subscription, invoices",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    href: "/settings/devices",
    label: "Devices",
    icon: Monitor,
    description: "Manage logged-in devices and sessions",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Email, push, and in-app notifications",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
  {
    href: "/settings/preferences",
    label: "Preferences",
    icon: Palette,
    description: "Language, theme, playback settings",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10"
  },
  {
    href: "/settings/privacy",
    label: "Privacy",
    icon: Shield,
    description: "Data collection and privacy controls",
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
]

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-purple-500" />
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="space-y-3">
        {settingsLinks.map((link) => {
          const Icon = link.icon
          
          return (
            <Link key={link.href} href={link.href}>
              <Card className="p-5 bg-gray-900 border-gray-800 hover:border-purple-700 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${link.bgColor} rounded-lg transition-transform group-hover:scale-110`}>
                      <Icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {link.label}
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-500 transition-colors" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-sm text-blue-400">
          💡 <span className="font-medium">Tip:</span> Click on any category above to manage specific settings
        </p>
      </div>
    </div>
  )
}