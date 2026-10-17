// app/(dashboard)/profile/page.tsx
// Your profile: who you are on FlixVideo, your numbers, and editing.
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Bookmark, Clock, Crown, Heart, ListVideo, Loader2, Settings } from "lucide-react"
import { toast } from "sonner"
import { userAPI } from "@/lib/api/user"
import { watchlistAPI } from "@/lib/api/watchlist"
import { favoritesAPI } from "@/lib/api/favorites"
import { listsAPI } from "@/lib/api/lists"
import { useCurrentUser } from "@/lib/hooks/use-auth"
import { planById } from "@/lib/plans"
import { AvatarUpload } from "@/components/profile/avatar-upload"

interface Profile {
  username?: string | null
  full_name?: string | null
  bio?: string | null
  date_of_birth?: string | null
  gender?: string | null
  country?: string | null
  city?: string | null
  timezone?: string | null
  language?: string | null
  avatar_url?: string | null
}

const field =
  "h-11 w-full rounded-lg border border-input bg-background/60 px-3 text-sm transition-[border-color,box-shadow] focus:border-primary/60 focus:ring-[3px] focus:ring-primary/15 focus:outline-none"

export default function ProfilePage() {
  const { plan } = useCurrentUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberSince, setMemberSince] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")
  const [counts, setCounts] = useState<{ watchlist?: number; favorites?: number; lists?: number }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    userAPI
      .getProfile()
      .then((r) => {
        setProfile(r.profile ?? {})
        setMemberSince(r.user?.created_at ?? null)
        setEmail(r.user?.email ?? "")
      })
      .catch(() => {
        setProfile({})
        toast.error("We couldn't load your profile.")
      })
    watchlistAPI.getWatchlist().then((r) => setCounts((c) => ({ ...c, watchlist: r.total ?? r.watchlist?.length }))).catch(() => {})
    favoritesAPI.getFavorites().then((r) => setCounts((c) => ({ ...c, favorites: r.total ?? r.favorites?.length }))).catch(() => {})
    listsAPI.getMyLists(1, 1).then((r) => setCounts((c) => ({ ...c, lists: r.total ?? r.lists?.length }))).catch(() => {})
  }, [])

  const set = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setProfile((p) => ({ ...p, [key]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (profile.username && !/^[a-zA-Z0-9_.]{3,30}$/.test(profile.username)) {
      toast.error("Usernames are 3–30 letters, numbers, dots or underscores.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        username: profile.username?.trim() || undefined,
        full_name: profile.full_name?.trim() || undefined,
        bio: profile.bio?.trim() || undefined,
        date_of_birth: profile.date_of_birth || undefined,
        gender: profile.gender || undefined,
        country: profile.country?.trim() || undefined,
        city: profile.city?.trim() || undefined,
        timezone: profile.timezone || undefined,
        language: profile.language || "en",
      }
      await userAPI.updateProfile(payload)
      // Keep the name shown in the shell in step
      try {
        const current = JSON.parse(localStorage.getItem("user") || "{}")
        localStorage.setItem("user", JSON.stringify({ ...current, full_name: payload.full_name ?? current.full_name, username: payload.username ?? current.username }))
      } catch {}
      toast.success("Profile saved")
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(message || "We couldn't save your profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const name = profile?.full_name || profile?.username || email.split("@")[0] || "You"
  const planInfo = planById(plan ?? "free")
  const stats = [
    { label: "Watchlist", value: counts.watchlist, icon: Bookmark, href: "/library" },
    { label: "Favorites", value: counts.favorites, icon: Heart, href: "/library?tab=favorites" },
    { label: "Lists", value: counts.lists, icon: ListVideo, href: "/library?tab=lists" },
    { label: "History", value: undefined, icon: Clock, href: "/library?tab=history" },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-10 pt-4">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border bg-card/60 p-6 sm:p-8">
        <div aria-hidden="true" className="light-leak absolute -top-1/2 -right-1/4 h-[150%] w-[70%]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {profile ? (
            <AvatarUpload
              currentAvatar={profile.avatar_url}
              username={name}
              onAvatarUpdate={(url) => setProfile((p) => ({ ...p, avatar_url: url }))}
            />
          ) : (
            <div className="h-28 w-28 animate-pulse rounded-full bg-muted" />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <p className="eyebrow">Your profile</p>
            <h1 className="truncate text-4xl leading-tight sm:text-5xl">{profile ? name : " "}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {profile?.username && <span>@{profile.username}</span>}
              {memberSince && <span>Member since {format(new Date(memberSince), "MMMM yyyy")}</span>}
              {planInfo && (
                <Link href="/subscription" className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Crown className="h-3 w-3" /> {planInfo.name}
                </Link>
              )}
            </p>
          </div>
          <Link href="/settings/account" className="inline-flex h-10 items-center gap-2 self-start rounded-lg border px-4 text-sm transition-colors hover:bg-accent sm:self-center">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.05 } }}>
              <Link href={s.href} className="group block rounded-xl border bg-background/50 p-4 transition-colors hover:border-primary/50">
                <s.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="mt-3 font-display text-3xl tabular-nums leading-none">{s.value ?? (s.label === "History" ? "→" : "–")}</p>
                <p className="mt-1 text-xs text-muted-foreground group-hover:text-foreground">{s.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Edit */}
      <section id="edit" className="scroll-mt-24 space-y-5">
        <h2 className="text-3xl">
          Edit <em className="italic text-primary">profile</em>
        </h2>
        {!profile ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <form onSubmit={save} className="space-y-5 rounded-2xl border bg-card/60 p-5 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium">Full name</span>
                <input value={profile.full_name ?? ""} onChange={set("full_name")} autoComplete="name" className={field} />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Username</span>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">@</span>
                  <input value={profile.username ?? ""} onChange={set("username")} autoComplete="username" className={`${field} pl-7`} />
                </div>
              </label>
            </div>
            <label className="block space-y-2 text-sm">
              <span className="flex justify-between font-medium">
                Bio <span className="text-xs font-normal text-muted-foreground tabular-nums">{(profile.bio ?? "").length}/300</span>
              </span>
              <textarea
                value={profile.bio ?? ""}
                onChange={set("bio")}
                maxLength={300}
                rows={3}
                placeholder="What do you love to watch?"
                className="w-full resize-none rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm focus:border-primary/60 focus:ring-[3px] focus:ring-primary/15 focus:outline-none"
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="space-y-2 text-sm">
                <span className="font-medium">Country</span>
                <input value={profile.country ?? ""} onChange={set("country")} autoComplete="country-name" placeholder="Kenya" className={field} />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">City</span>
                <input value={profile.city ?? ""} onChange={set("city")} autoComplete="address-level2" placeholder="Nairobi" className={field} />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Date of birth</span>
                <input type="date" value={profile.date_of_birth ?? ""} onChange={set("date_of_birth")} max={new Date().toISOString().slice(0, 10)} className={field} />
              </label>
            </div>
            <div className="flex items-center justify-between gap-4 border-t pt-5">
              <p className="text-xs text-muted-foreground">Your email and password are in Settings → Account.</p>
              <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save profile
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
