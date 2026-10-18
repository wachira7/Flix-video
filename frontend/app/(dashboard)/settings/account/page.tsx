// app/(dashboard)/settings/account/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { BadgeCheck, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { userAPI } from "@/lib/api/user"
import { PasswordChecklist, useReveal } from "@/components/auth/auth-fields"
import { SettingRow, SettingsCard, SettingsHeader } from "@/components/settings/settings-ui"

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/

interface Me {
  email?: string
  email_verified?: boolean
  phone?: string | null
  created_at?: string
}

function PasswordInput({ id, label, value, onChange, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const reveal = useReveal()
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          type={reveal.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-lg border border-input bg-background/60 pr-11 pl-10 text-sm focus:border-primary/60 focus:ring-[3px] focus:ring-primary/15 focus:outline-none"
        />
        {reveal.toggle}
      </div>
    </div>
  )
}

export default function AccountSettingsPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    userAPI
      .getProfile()
      .then((r) => setMe(r.user ?? {}))
      .catch(() => setMe({}))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!passwordRegex.test(next)) return setError("Your new password doesn't meet all the rules below.")
    if (next !== confirm) return setError("The new passwords don't match.")
    setBusy(true)
    try {
      await userAPI.changePassword({ current_password: current, new_password: next })
      toast.success("Password updated")
      setCurrent("")
      setNext("")
      setConfirm("")
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string; message?: string } } }).response?.data
      setError(message?.error || message?.message || "We couldn't change your password. Check your current password and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SettingsHeader title="Your" italic="account">
        Sign-in details and password.{" "}
        <Link href="/profile" className="text-primary hover:underline">
          Edit your profile and avatar
        </Link>
        .
      </SettingsHeader>

      <SettingsCard title="Sign-in details">
        <SettingRow label="Email" description={me === null ? "Loading…" : me.email || "Not available"}>
          {me?.email_verified ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <BadgeCheck className="h-4 w-4" /> Verified
            </span>
          ) : me ? (
            <span className="text-xs text-muted-foreground">Not verified</span>
          ) : null}
        </SettingRow>
        {me?.created_at && <SettingRow label="Member since" description={format(new Date(me.created_at), "d MMMM yyyy")}>{null}</SettingRow>}
      </SettingsCard>

      <SettingsCard title="Change password" description="If you signed up with Google and never set a password, use Forgot password on the sign-in page to create one.">
        <form onSubmit={save} className="space-y-5 px-5 py-5 sm:px-6">
          <PasswordInput id="current-password" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
          <div className="space-y-2">
            <PasswordInput id="new-password" label="New password" value={next} onChange={setNext} autoComplete="new-password" />
            <PasswordChecklist password={next} />
          </div>
          <PasswordInput id="confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          {error && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !current || !next || !confirm}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </SettingsCard>
    </>
  )
}
