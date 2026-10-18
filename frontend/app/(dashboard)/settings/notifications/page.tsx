// app/(dashboard)/settings/notifications/page.tsx
"use client"

import { toast } from "sonner"
import { useSettings } from "@/lib/hooks/use-settings"
import type { UserSettings } from "@/lib/api/account"
import { LoadError, SettingsCard, SettingsHeader, ToggleRow } from "@/components/settings/settings-ui"

type Key = keyof UserSettings["notifications"]

const EMAILS: { key: Key; label: string; description: string }[] = [
  { key: "billing_reminders", label: "Billing reminders", description: "A heads-up a few days before your plan renews or runs out." },
  { key: "watch_party_invites", label: "Watch party invites", description: "When a friend invites you to watch together." },
  { key: "review_activity", label: "Activity on my reviews", description: "When someone replies to or likes your review." },
]

export default function NotificationSettingsPage() {
  const { settings, error, update } = useSettings()

  const toggle = async (key: Key, value: boolean) => {
    const ok = await update({ notifications: { [key]: value } })
    if (ok) toast.success(value ? "Emails turned on" : "Emails turned off")
    else toast.error("Couldn't save that. Please try again.")
  }

  return (
    <>
      <SettingsHeader title="Notification" italic="emails">
        Choose which emails FlixVideo sends you. You&apos;ll still see everything in the bell at the top of the app.
      </SettingsHeader>
      {error ? (
        <LoadError what="notification settings" />
      ) : (
        <SettingsCard title="Email me about">
          {EMAILS.map((e) => (
            <ToggleRow
              key={e.key}
              id={`n-${e.key}`}
              label={e.label}
              description={e.description}
              checked={settings?.notifications[e.key] ?? true}
              disabled={!settings}
              onChange={(v) => toggle(e.key, v)}
            />
          ))}
          <ToggleRow id="n-receipts" label="Payment receipts" description="Receipts and failed-payment alerts. These are always sent." checked locked />
        </SettingsCard>
      )}
    </>
  )
}
