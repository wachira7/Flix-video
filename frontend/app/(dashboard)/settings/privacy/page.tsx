// app/(dashboard)/settings/privacy/page.tsx
"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Download, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { accountAPI } from "@/lib/api/account"
import { logout } from "@/lib/auth"
import { useSettings } from "@/lib/hooks/use-settings"
import { LoadError, SettingRow, SettingsCard, SettingsHeader, ToggleRow } from "@/components/settings/settings-ui"

function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await accountAPI.deleteAccount(password || undefined)
      toast("Your account has been deleted")
      setTimeout(logout, 1200)
    } catch (e) {
      const message = (e as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(message || "We couldn't delete your account. Please try again.")
      setBusy(false)
    }
  }

  return (
    <SettingsCard title="Delete account" tone="danger" description="This can't be undone.">
      <div className="space-y-4 px-5 py-5 sm:px-6">
        <p className="text-sm text-muted-foreground">
          We&apos;ll delete your watchlist, favorites, ratings, reviews, lists, watch history and AI conversations, cancel your
          subscription and sign you out everywhere. Payment records are kept for accounting, without your personal details.
        </p>
        <AnimatePresence initial={false} mode="wait">
          {!open ? (
            <motion.button
              key="ask"
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/50 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Delete my account
            </motion.button>
          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Your password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Leave blank if you use Google"
                    className="h-11 w-full rounded-lg border border-input bg-background/60 px-3 focus:border-destructive/60 focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">
                    Type <span className="font-mono text-destructive">DELETE</span> to confirm
                  </span>
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoComplete="off"
                    className="h-11 w-full rounded-lg border border-input bg-background/60 px-3 font-mono tracking-wider focus:border-destructive/60 focus:outline-none"
                  />
                </label>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={run}
                  disabled={typed !== "DELETE" || busy}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-40"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Permanently delete
                </button>
                <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border px-4 text-sm hover:bg-accent">
                  Keep my account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SettingsCard>
  )
}

export default function PrivacySettingsPage() {
  const { settings, error, update } = useSettings()
  const [exporting, setExporting] = useState(false)

  const download = async () => {
    setExporting(true)
    try {
      const blob = await accountAPI.exportData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `flixvideo-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Your data is downloading")
    } catch {
      toast.error("We couldn't prepare your data. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <SettingsHeader title="Privacy" italic="& data">
        Control what we record, take a copy of everything, or delete your account.
      </SettingsHeader>

      {error ? (
        <LoadError what="privacy settings" />
      ) : (
        <SettingsCard>
          <ToggleRow
            id="record-history"
            label="Record my watch history"
            description="Used for Continue watching and better picks. When off, nothing new is saved. Clear past history in Library."
            checked={settings?.privacy.record_watch_history ?? true}
            disabled={!settings}
            onChange={async (v) => {
              if (await update({ privacy: { record_watch_history: v } })) toast.success(v ? "Watch history is on" : "We'll stop recording your history")
              else toast.error("Couldn't save that. Please try again.")
            }}
          />
        </SettingsCard>
      )}

      <SettingsCard>
        <SettingRow label="Download your data" description="A JSON file with your account, lists, ratings, reviews, history, AI chats and payments.">
          <button
            type="button"
            onClick={download}
            disabled={exporting}
            className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Preparing" : "Download"}
          </button>
        </SettingRow>
      </SettingsCard>

      <DeleteAccount />
    </>
  )
}
