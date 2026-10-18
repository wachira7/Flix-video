// lib/hooks/use-settings.ts
// The signed-in user's settings, fetched once and shared. Updates are
// optimistic and roll back if the server refuses them.
"use client"

import { useCallback, useEffect, useState } from "react"
import { accountAPI, DEFAULT_SETTINGS, type SettingsPatch, type UserSettings } from "@/lib/api/account"

let cached: UserSettings | null = null
let request: Promise<UserSettings> | null = null
const listeners = new Set<(s: UserSettings) => void>()

function load() {
  request ??= accountAPI
    .getSettings()
    .then((s) => (cached = s))
    .catch((e) => {
      request = null
      throw e
    })
  return request
}

function publish(s: UserSettings) {
  cached = s
  listeners.forEach((l) => l(s))
}

function apply(base: UserSettings, patch: SettingsPatch): UserSettings {
  return {
    notifications: { ...base.notifications, ...patch.notifications },
    preferences: { ...base.preferences, ...patch.preferences },
    privacy: { ...base.privacy, ...patch.privacy },
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(cached)
  const [error, setError] = useState(false)

  useEffect(() => {
    listeners.add(setSettings)
    if (!cached) {
      load()
        .then(setSettings)
        .catch(() => setError(true))
    }
    return () => {
      listeners.delete(setSettings)
    }
  }, [])

  const update = useCallback(async (patch: SettingsPatch) => {
    const before = cached ?? DEFAULT_SETTINGS
    publish(apply(before, patch))
    try {
      publish(await accountAPI.updateSettings(patch))
      return true
    } catch {
      publish(before)
      return false
    }
  }, [])

  return { settings, error, update }
}

/** Settings for features that should just use defaults if they can't load */
export function useSettingsOrDefaults() {
  const { settings } = useSettings()
  return settings ?? DEFAULT_SETTINGS
}
