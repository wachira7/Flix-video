// components/landing/ai-showcase.tsx
import { AIConversation } from "./ai-conversation"
import type { AIPick } from "./landing-types"

const PROMPT = "A smart sci-fi film under two hours with a hopeful ending"

export function AIShowcase({ picks }: { picks: AIPick[] }) {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-6xl gap-14 px-5 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <div className="reveal space-y-6 lg:pt-6" data-reveal="left">
          <p className="eyebrow">Ask FlixVideo</p>
          <h2 className="text-4xl leading-[1.05] md:text-5xl">
            Describe a mood. Get a film, <em className="italic">and the reason why.</em>
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            Ask the way you&apos;d ask a friend who has seen everything. Each pick comes with a short reason
            tied to what you asked for, so you can decide in seconds instead of scrolling for twenty minutes.
          </p>
          <p className="text-sm text-muted-foreground">
            The AI assistant is included with Premium. Every plan gets daily AI picks.
          </p>
        </div>

        <AIConversation prompt={PROMPT} picks={picks} />
      </div>
    </section>
  )
}
