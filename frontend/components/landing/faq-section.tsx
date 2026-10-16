// components/landing/faq-section.tsx
"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    q: "What is FlixVideo?",
    a: "FlixVideo helps you decide what to watch. It recommends films and shows based on your taste, explains each pick, plays trailers, and shows where every title is available to stream, rent or buy.",
  },
  {
    q: "Can I watch full movies on FlixVideo?",
    a: "Not yet. Trailers play right here, and for full titles we show you which services have them and take you straight there. We are working on adding free films you can watch on FlixVideo itself.",
  },
  {
    q: "Is there really a free plan?",
    a: "Yes. The free plan never expires and needs no card. It includes one AI pick a day, watchlists, ratings, reviews and watch parties.",
  },
  {
    q: "How do the AI picks work?",
    a: "They use your ratings, your lists and what you have watched to suggest titles, and every suggestion comes with a short reason. On Premium you can also chat with the assistant and ask for things like \"a feel-good comedy under 90 minutes\".",
  },
  {
    q: "How do I pay?",
    a: "Paid plans are billed monthly in Kenyan shillings. You can pay with M-Pesa, a debit or credit card, or crypto.",
  },
  {
    q: "Can I change or cancel my plan?",
    a: "Yes. Upgrade, downgrade or cancel from Settings, then Billing. There is no contract.",
  },
  {
    q: "What happens to my data?",
    a: "Your ratings, lists and activity are used to power your recommendations. You choose what is visible to other people in Settings, then Privacy.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 md:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
        <div className="reveal space-y-5" data-reveal="left">
          <p className="eyebrow">Questions</p>
          <h2 className="text-4xl leading-[1.05] md:text-5xl">Good to know</h2>
          <p className="text-muted-foreground">
            Something else? Email{" "}
            <a href="mailto:support@flixvideo.com" className="text-foreground underline-offset-4 hover:underline">
              support@flixvideo.com
            </a>
            .
          </p>
        </div>

        <Accordion type="single" collapsible className="reveal-stagger border-t" data-reveal="right">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.q} value={`item-${i}`}>
              <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
