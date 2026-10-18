// components/ai/chat-interface.tsx
// Chat composer: auto-growing textarea, Enter to send, Shift+Enter for a
// new line, animated send button.
"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComposerProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  busy: boolean
  placeholder?: string
}

export const ChatComposer = forwardRef<HTMLTextAreaElement, ComposerProps>(function ChatComposer(
  { value, onChange, onSend, busy, placeholder = "Ask for anything: a mood, a runtime, an actor…" },
  ref
) {
  const area = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => area.current!)

  // Grow with the text, up to ~6 lines
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`
  }, [value])

  const ready = value.trim().length > 0 && !busy

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (ready) onSend()
      }}
      className="group relative flex items-end gap-2 rounded-2xl border border-input bg-card/90 p-2 pl-4 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10"
    >
      <label htmlFor="chat-input" className="sr-only">
        Message FlixVideo AI
      </label>
      <textarea
        id="chat-input"
        ref={area}
        rows={1}
        value={value}
        maxLength={2000}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            if (ready) onSend()
          }
        }}
        placeholder={placeholder}
        className="max-h-42 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <motion.button
        type="submit"
        disabled={!ready}
        whileTap={ready ? { scale: 0.9 } : undefined}
        aria-label="Send message"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-200",
          ready ? "bg-primary text-primary-foreground hover:brightness-110" : "bg-muted text-muted-foreground"
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.5} />}
      </motion.button>
    </form>
  )
})
