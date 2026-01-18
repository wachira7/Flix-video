// app/(dashboard)/settings/billing/page.tsx - CREATE

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CreditCard, Download, Plus, Trash2, Calendar } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function BillingSettingsPage() {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      isDefault: true
    },
    {
      id: '2',
      type: 'mpesa',
      phone: '+254712345678',
      isDefault: false
    }
  ])

  const invoices = [
    {
      id: 'INV-001',
      date: '2025-01-01',
      amount: '$9.99',
      status: 'paid',
      plan: 'Premium Plan'
    },
    {
      id: 'INV-002',
      date: '2024-12-01',
      amount: '$9.99',
      status: 'paid',
      plan: 'Premium Plan'
    },
    {
      id: 'INV-003',
      date: '2024-11-01',
      amount: '$9.99',
      status: 'paid',
      plan: 'Premium Plan'
    }
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Billing Settings</h1>
          <p className="text-gray-400 mt-1">Manage payments and subscription</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Subscription */}
        <Card className="p-6 bg-linear-to-br from-purple-900/50 to-fuchsia-900/50 border-purple-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Premium Plan</h2>
              <p className="text-gray-300">$9.99/month</p>
            </div>
            <Badge className="bg-green-600">Active</Badge>
          </div>
          
          <Separator className="bg-purple-800/50 my-4" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Next billing date</p>
              <p className="text-white font-semibold">February 1, 2025</p>
            </div>
            <div>
              <p className="text-gray-400">Payment method</p>
              <p className="text-white font-semibold">Visa •••• 4242</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="border-purple-700 text-white hover:bg-purple-800">
              Change Plan
            </Button>
            <Button variant="outline" className="border-red-700 text-red-500 hover:bg-red-900/30">
              Cancel Subscription
            </Button>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-white">Payment Methods</h2>
            </div>
            <Button 
              size="sm"
              className="bg-linear-to-r from-purple-700 to-fuchsia-600"
              onClick={() => toast.info("Add payment method coming soon")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Method
            </Button>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-700 rounded">
                    <CreditCard className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    {method.type === 'card' ? (
                      <>
                        <p className="text-white font-medium">
                          {method.brand} •••• {method.last4}
                        </p>
                        <p className="text-sm text-gray-400">Expires {method.expiry}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white font-medium">M-Pesa</p>
                        <p className="text-sm text-gray-400">{method.phone}</p>
                      </>
                    )}
                  </div>
                  {method.isDefault && (
                    <Badge className="bg-purple-700">Default</Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button size="sm" variant="outline" className="border-gray-700">
                      Set Default
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Billing History */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Billing History</h2>
          </div>

          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white font-medium">{invoice.plan}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(invoice.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white font-semibold">{invoice.amount}</p>
                    <Badge className="bg-green-600 mt-1">Paid</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="border-gray-700">
                    <Download className="w-4 h-4 mr-2" />
                    Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}