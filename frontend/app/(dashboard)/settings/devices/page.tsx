// app/(dashboard)/settings/devices/page.tsx - CREATE

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Smartphone, Monitor, Tablet, LogOut } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function DevicesSettingsPage() {
  const [devices, setDevices] = useState([
    {
      id: '1',
      name: 'Chrome on Windows',
      type: 'desktop',
      location: 'Nairobi, Kenya',
      ip: '197.156.xxx.xxx',
      lastActive: '2 minutes ago',
      isCurrent: true
    },
    {
      id: '2',
      name: 'Safari on iPhone',
      type: 'mobile',
      location: 'Nairobi, Kenya',
      ip: '197.156.xxx.xxx',
      lastActive: '1 day ago',
      isCurrent: false
    },
    {
      id: '3',
      name: 'Firefox on Ubuntu',
      type: 'desktop',
      location: 'Nairobi, Kenya',
      ip: '197.156.xxx.xxx',
      lastActive: '3 days ago',
      isCurrent: false
    }
  ])

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      default:
        return Monitor
    }
  }

  const handleLogout = (deviceId: string) => {
    if (confirm("Are you sure you want to log out this device?")) {
      setDevices(devices.filter(d => d.id !== deviceId))
      toast.success("Device logged out successfully")
    }
  }

  const handleLogoutAll = () => {
    if (confirm("Are you sure you want to log out all other devices? You'll stay logged in on this device.")) {
      setDevices(devices.filter(d => d.isCurrent))
      toast.success("All other devices logged out")
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Device Management</h1>
          <p className="text-gray-400 mt-1">Manage devices that have access to your account</p>
        </div>
        {devices.length > 1 && (
          <Button 
            variant="outline" 
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            onClick={handleLogoutAll}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout All Other Devices
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Device Limit Info */}
        <Card className="p-4 bg-blue-900/20 border-blue-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-900/50 rounded">
              <Smartphone className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Active Devices: {devices.length}/5</p>
              <p className="text-sm text-gray-400 mt-1">
                Your Premium plan allows up to 5 simultaneous streams. Upgrade to Family plan for 10 devices.
              </p>
            </div>
          </div>
        </Card>

        {/* Active Devices */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Active Devices</h2>

          <div className="space-y-4">
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.type)
              
              return (
                <div key={device.id} className="flex items-start gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <DeviceIcon className="w-6 h-6 text-gray-300" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{device.name}</h3>
                          {device.isCurrent && (
                            <Badge className="bg-green-600">This Device</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {device.location} • {device.ip}
                        </p>
                      </div>
                      
                      {!device.isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          onClick={() => handleLogout(device.id)}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Log Out
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">
                      Last active: {device.lastActive}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Security Tips */}
        <Card className="p-6 bg-yellow-900/20 border-yellow-700">
          <h3 className="text-white font-semibold mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-1">•</span>
              <span>Don't recognize a device? Log it out immediately and change your password.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-1">•</span>
              <span>Enable two-factor authentication for extra security.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-1">•</span>
              <span>Always log out from public or shared devices.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}