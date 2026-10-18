// app/(dashboard)/lists/create/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Globe, ListOrdered, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { listsAPI } from "@/lib/api/lists"
import { cn } from "@/lib/utils"

export default function CreateListPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isRanked, setIsRanked] = useState(false)
  const [busy, setBusy] = useState(false)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    try {
      const { list } = await listsAPI.create({ title: title.trim(), description: description.trim() || undefined, is_public: isPublic, is_ranked: isRanked })
      toast.success("List created. Add your first titles.")
      router.push(`/lists/${list.id}`)
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(message || "Couldn't create the list.")
      setBusy(false)
    }
  }

  const choice = (active: boolean) =>
    cn("flex gap-3 rounded-xl border p-4 text-left transition-colors", active ? "border-primary/70 bg-primary/10" : "hover:border-muted-foreground/50")

  return (
    <div className="mx-auto max-w-2xl space-y-8 pt-4">
      <Link href="/library?tab=lists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Lists
      </Link>
      <header className="space-y-3">
        <p className="eyebrow">New list</p>
        <h1 className="text-4xl leading-tight sm:text-5xl">
          Make a <em className="italic text-primary">list</em>
        </h1>
        <p className="text-muted-foreground">Sunday sci-fi, best of Nollywood, films to show your parents. Anything goes.</p>
      </header>

      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={create} className="space-y-6">
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Title</span>
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="e.g. Films that made me cry"
            className="h-14 w-full rounded-xl border border-input bg-card/60 px-4 font-display text-2xl focus:border-primary/60 focus:ring-4 focus:ring-primary/10 focus:outline-none"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} className="w-full resize-none rounded-xl border border-input bg-card/60 px-4 py-3 focus:border-primary/60 focus:outline-none" />
        </label>

        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium">Who can see it?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" aria-pressed={!isPublic} onClick={() => setIsPublic(false)} className={choice(!isPublic)}>
              <Lock className={cn("mt-0.5 h-5 w-5", !isPublic ? "text-primary" : "text-muted-foreground")} />
              <span>
                <span className="block text-sm font-semibold">Just me</span>
                <span className="text-sm text-muted-foreground">Private. Change it any time.</span>
              </span>
            </button>
            <button type="button" aria-pressed={isPublic} onClick={() => setIsPublic(true)} className={choice(isPublic)}>
              <Globe className={cn("mt-0.5 h-5 w-5", isPublic ? "text-primary" : "text-muted-foreground")} />
              <span>
                <span className="block text-sm font-semibold">Anyone with the link</span>
                <span className="text-sm text-muted-foreground">Share it with friends.</span>
              </span>
            </button>
          </div>
        </fieldset>

        <button type="button" aria-pressed={isRanked} onClick={() => setIsRanked((r) => !r)} className={cn(choice(isRanked), "w-full")}>
          <ListOrdered className={cn("mt-0.5 h-5 w-5", isRanked ? "text-primary" : "text-muted-foreground")} />
          <span>
            <span className="block text-sm font-semibold">Ranked list</span>
            <span className="text-sm text-muted-foreground">Show big numbers, like a Top 10. Titles are numbered in the order you add them.</span>
          </span>
        </button>

        <button type="submit" disabled={busy || !title.trim()} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Create list
        </button>
      </motion.form>
    </div>
  )
}
