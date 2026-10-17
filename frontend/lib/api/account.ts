// lib/api/account.ts
// Settings, signed-in devices, data export and account deletion
// (backend: api/controllers/account.controller.js)
import { apiClient } from "./client"

export interface UserSettings {
  notifications: { billing_reminders: boolean; watch_party_invites: boolean; review_activity: boolean }
  preferences: { region: string; autoplay_hero: boolean }
  privacy: { record_watch_history: boolean }
}

export type SettingsPatch = { [K in keyof UserSettings]?: Partial<UserSettings[K]> }

export interface Session {
  id: string
  device_name: string | null
  device_type: "web" | "ios" | "android" | "tv" | "desktop" | null
  os_name: string | null
  last_active_at: string | null
  last_ip: string | null
  created_at: string
  current: boolean
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: { billing_reminders: true, watch_party_invites: true, review_activity: true },
  preferences: { region: "KE", autoplay_hero: true },
  privacy: { record_watch_history: true },
}

export const accountAPI = {
  getSettings: async (): Promise<UserSettings> => (await apiClient.get("/api/users/settings")).data.settings,
  updateSettings: async (settings: SettingsPatch): Promise<UserSettings> =>
    (await apiClient.patch("/api/users/settings", { settings })).data.settings,
  listSessions: async (): Promise<Session[]> => (await apiClient.get("/api/users/sessions")).data.sessions,
  revokeSession: async (id: string) => (await apiClient.delete(`/api/users/sessions/${id}`)).data,
  revokeOtherSessions: async (): Promise<{ signed_out: number }> => (await apiClient.post("/api/users/sessions/revoke-others")).data,
  exportData: async (): Promise<Blob> =>
    (await apiClient.get("/api/users/me/export", { responseType: "blob" })).data,
  deleteAccount: async (password?: string) =>
    (await apiClient.post("/api/users/me/delete", { confirm: "DELETE", password })).data,
}
