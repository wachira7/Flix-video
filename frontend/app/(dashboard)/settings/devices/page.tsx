// app/(dashboard)/settings/devices/page.tsx
"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { Laptop, Loader2, LogOut, Smartphone, Tv } from "lucide-react"
import { toast } from "sonner"
import { accountAPI, type Session } from "@/lib/api/account"
import { logout } from "@/lib/auth"
import { LoadError, SettingsCard, SettingsHeader } from "@/components/settings/settings-ui"

const ICON = { ios: Smartphone, android: Smartphone, tv: Tv, web: Laptop, desktop: Laptop } as const

export default function DevicesPage() {
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    accountAPI
      .listSessions()
      .then(setSessions)
      .catch(() => setFailed(true))
  }, [])

  const signOut = async (s: Session) => {
    setBusy(s.id)
    try {
      await accountAPI.revokeSession(s.id)
      if (s.current) {
        toast("Signed out of this device")
        return setTimeout(logout, 600)
      }
      setSessions((list) => list?.filter((x) => x.id !== s.id) ?? null)
      toast.success(`Signed out of ${s.device_name ?? "that device"}`)
    } catch {
      toast.error("Couldn't sign that device out.")
    } finally {
      setBusy(null)
    }
  }

  const signOutOthers = async () => {
    setBusy("others")
    try {
      const r = await accountAPI.revokeOtherSessions()
      setSessions((list) => list?.filter((x) => x.current) ?? null)
      toast.success(r.signed_out ? `Signed out of ${r.signed_out} other device${r.signed_out === 1 ? "" : "s"}` : "No other devices were signed in")
    } catch {
      toast.error("Couldn't sign the other devices out.")
    } finally {
      setBusy(null)
    }
  }

  const others = sessions?.filter((s) => !s.current).length ?? 0

  return (
    <>
      <SettingsHeader title="Signed-in" italic="devices">
        Everywhere you&apos;re signed in to FlixVideo. Sign out anything you don&apos;t recognise.
      </SettingsHeader>

      {failed ? (
        <LoadError what="devices" />
      ) : (
        <SettingsCard>
          {sessions === null ? (
            <div className="space-y-3 p-5">
              {[0, 1].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              Devices appear here after you sign in again. Your current sign-in started before device tracking existed.
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {sessions.map((s) => {
                const Icon = ICON[s.device_type ?? "web"] ?? Laptop
                return (
                  <motion.div key={s.id} layout exit={{ opacity: 0, height: 0 }} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        {s.device_name ?? "Unknown device"}
                        {s.current && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">This device</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.last_active_at ? `Active ${formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })}` : "Active recently"}
                        {s.last_ip && ` · ${s.last_ip}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut(s)}
                      disabled={busy !== null}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
                    >
                      {busy === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                      Sign out
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </SettingsCard>
      )}

      {sessions && others > 0 && (
        <button
          type="button"
          onClick={signOutOthers}
          disabled={busy !== null}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-destructive/50 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          {busy === "others" && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign out of all other devices
        </button>
      )}
    </>
  )
}
