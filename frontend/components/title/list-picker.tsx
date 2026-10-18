// components/title/list-picker.tsx
// "Add to a list" menu: the user's own lists, loaded when opened.
"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ListPlus, Loader2, Lock, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { listsAPI, type List } from "@/lib/api/lists"
import type { MediaType } from "@/lib/media"

export function ListPicker({ mediaType, id, title }: { mediaType: MediaType; id: number; title: string }) {
  const [lists, setLists] = useState<List[] | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  const load = async (open: boolean) => {
    if (!open || lists) return
    try {
      const r = await listsAPI.getMyLists(1, 50)
      setLists(r.lists ?? [])
    } catch {
      setLists([])
      toast.error("Couldn't load your lists.")
    }
  }

  const add = async (list: List) => {
    if (added.has(list.id)) return
    setBusy(list.id)
    try {
      await listsAPI.addItem(list.id, { contentType: mediaType, contentId: id })
      setAdded((s) => new Set(s).add(list.id))
      toast.success(`Added ${title} to “${list.title}”`)
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? ""
      if (/already/i.test(message)) {
        setAdded((s) => new Set(s).add(list.id))
        toast(`${title} is already in “${list.title}”`)
      } else toast.error("Couldn't add it to that list.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <DropdownMenu onOpenChange={load}>
      <DropdownMenuTrigger
        aria-label={`Add ${title} to a list`}
        title="Add to a list"
        className="flex h-12 w-12 items-center justify-center rounded-lg border border-foreground/25 bg-background/30 backdrop-blur-sm transition-colors hover:border-foreground/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:border-primary/60"
      >
        <ListPlus className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Add to a list</DropdownMenuLabel>
        {lists === null ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Loading lists" />
          </div>
        ) : lists.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">You haven&apos;t made any lists yet.</p>
        ) : (
          lists.map((l) => (
            <DropdownMenuItem
              key={l.id}
              onSelect={(e) => {
                e.preventDefault()
                add(l)
              }}
              className="flex items-center gap-2 rounded-md px-2 py-2"
            >
              <span className="flex h-4 w-4 items-center justify-center">
                {busy === l.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : added.has(l.id) ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
              <span className="flex-1 truncate">{l.title}</span>
              {!l.is_public && <Lock className="h-3 w-3 text-muted-foreground" aria-label="Private" />}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-md px-2 py-2 text-primary">
          <Link href="/lists/create">
            <ListPlus className="mr-2 h-4 w-4" />
            New list
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
