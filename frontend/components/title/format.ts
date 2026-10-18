// components/title/format.ts
import { pickTrailer } from "@/lib/media"

export function runtimeLabel(minutes?: number | null) {
  if (!minutes) return undefined
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`
}

export function languageName(code?: string) {
  if (!code) return undefined
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code
  } catch {
    return code
  }
}

export function money(amount?: number) {
  if (!amount) return undefined
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
  if (amount >= 1e6) return `$${Math.round(amount / 1e6)}M`
  return `$${amount.toLocaleString()}`
}

export function trailerFrom(videos: PromiseSettledResult<Parameters<typeof pickTrailer>[0]>) {
  return videos.status === "fulfilled" ? pickTrailer(videos.value) : undefined
}

export function settled<T>(r: PromiseSettledResult<T>, fallback: T): T {
  return r.status === "fulfilled" ? r.value : fallback
}

/** Drop undefined facts */
export function facts(list: [string, string | undefined | null][]) {
  return list.filter((f): f is [string, string] => !!f[1]).map(([label, value]) => ({ label, value }))
}
