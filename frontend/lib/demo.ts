// lib/demo.ts
// One-click demo: the backend creates a private, pre-filled account that's
// deleted after a day, and we sign it in exactly like a normal login.
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const EXPIRES_KEY = "demo_expires_at"

export interface DemoSession {
  token: string
  expires_at: string
  user: { id: string; email: string; username: string; full_name: string; is_demo: true }
}

export async function startDemo(): Promise<DemoSession> {
  const { data } = await axios.post(`${API_URL}/api/demo`)
  localStorage.setItem("token", data.token)
  localStorage.setItem("user", JSON.stringify(data.user))
  localStorage.setItem(EXPIRES_KEY, data.expires_at)
  // The cookie lets the route guard through; it ends with the demo
  const maxAge = Math.max(60, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000))
  document.cookie = `token=${data.token}; path=/; max-age=${maxAge}; SameSite=Strict`
  return data
}

/** When the current demo ends, or null if this isn't a demo session */
export function demoExpiresAt(): Date | null {
  if (typeof window === "undefined") return null
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null")
    const at = localStorage.getItem(EXPIRES_KEY)
    return user?.is_demo && at ? new Date(at) : null
  } catch {
    return null
  }
}

/** Leave the demo without the usual logout redirect, e.g. to sign up */
export function endDemo() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  localStorage.removeItem(EXPIRES_KEY)
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict"
}
