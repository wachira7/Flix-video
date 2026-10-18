// app/(dashboard)/settings/preferences/page.tsx
"use client"

import { toast } from "sonner"
import { useSettings } from "@/lib/hooks/use-settings"
import { LoadError, SettingRow, SettingsCard, SettingsHeader, ToggleRow } from "@/components/settings/settings-ui"

// Mirrors REGIONS in backend/src/config/user-settings.js
const REGIONS: { code: string; name: string }[] = [
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "RW", name: "Rwanda" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "ZA", name: "South Africa" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
]

export default function PreferencesPage() {
  const { settings, error, update } = useSettings()

  const save = async (patch: Parameters<typeof update>[0], message: string) => {
    if (await update(patch)) toast.success(message)
    else toast.error("Couldn't save that. Please try again.")
  }

  return (
    <>
      <SettingsHeader title="Your" italic="preferences">
        How FlixVideo behaves for you, on every device you sign in with.
      </SettingsHeader>
      {error ? (
        <LoadError what="preferences" />
      ) : (
        <SettingsCard>
          <SettingRow label="Where to watch region" description="Which country's streaming services we show on title pages." htmlFor="region">
            <select
              id="region"
              value={settings?.preferences.region ?? "KE"}
              disabled={!settings}
              onChange={(e) => {
                const name = REGIONS.find((r) => r.code === e.target.value)?.name
                save({ preferences: { region: e.target.value } }, `Showing services in ${name}`)
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:border-primary/60 focus:outline-none"
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </SettingRow>
          <ToggleRow
            id="autoplay-hero"
            label="Rotate the Home banner"
            description="Move to the next featured title every few seconds. Turn off to keep it still."
            checked={settings?.preferences.autoplay_hero ?? true}
            disabled={!settings}
            onChange={(v) => save({ preferences: { autoplay_hero: v } }, v ? "Banner will rotate" : "Banner will stay still")}
          />
        </SettingsCard>
      )}
    </>
  )
}
