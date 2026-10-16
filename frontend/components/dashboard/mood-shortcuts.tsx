// components/dashboard/mood-shortcuts.tsx
// One-tap prompts that open Ask AI with the request already sent.
import Link from "next/link"
import { Sparkles } from "lucide-react"

const MOODS = [
  { label: "Something hopeful", prompt: "A hopeful film that leaves me feeling good, under two hours" },
  { label: "Make me laugh", prompt: "A genuinely funny comedy for tonight" },
  { label: "Edge of my seat", prompt: "A tense thriller I can't look away from" },
  { label: "Family night", prompt: "A film the whole family will enjoy, kids aged 8 to 12" },
  { label: "African stories", prompt: "Great recent African films or series, especially from Kenya or Nigeria" },
  { label: "Quick watch", prompt: "Something excellent under 90 minutes" },
]

export function MoodShortcuts() {
  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <span className="flex shrink-0 items-center gap-1.5 pr-1 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        Ask AI:
      </span>
      {MOODS.map((m) => (
        <Link
          key={m.label}
          href={`/ai-chat?prompt=${encodeURIComponent(m.prompt)}`}
          className="shrink-0 rounded-full border px-4 py-1.5 text-sm transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary"
        >
          {m.label}
        </Link>
      ))}
    </div>
  )
}
