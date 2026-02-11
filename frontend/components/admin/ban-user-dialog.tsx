// components/admin/ban-user-dialog.tsx
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface BanUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  onConfirm: (reason: string) => Promise<void>
}

export function BanUserDialog({ 
  open, 
  onOpenChange, 
  userEmail,
  onConfirm 
}: BanUserDialogProps) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleBan = async () => {
    if (!reason.trim()) {
      return
    }

    setLoading(true)
    try {
      await onConfirm(reason)
      setReason("")
      onOpenChange(false)
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Ban User
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            You are about to ban <span className="text-white font-semibold">{userEmail}</span>. 
            This will prevent them from accessing the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reason" className="text-white">
              Reason for ban *
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for banning this user..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 bg-gray-800 border-gray-700 text-white min-h-[100px]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be logged and visible to other administrators.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleBan}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Banning..." : "Ban User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
