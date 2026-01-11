"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

const faqs = [
  {
    question: "What is FlixVideo?",
    answer:
      "FlixVideo is an AI-powered streaming platform that offers unlimited movies and TV shows with personalized recommendations, multi-device support, and exclusive features like watch parties and offline downloads.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "You get 30 days completely free to explore all features of your chosen plan. No credit card required. Cancel anytime during the trial without being charged.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated accordingly.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards via Stripe, M-Pesa for mobile payments, and cryptocurrency (Bitcoin, Ethereum, USDT) for flexible payment options.",
  },
  {
    question: "How many devices can I watch on?",
    answer:
      "It depends on your plan: Basic allows 1 device, Standard allows 2 devices, and Premium allows up to 4 devices simultaneously.",
  },
  {
    question: "Can I download content for offline viewing?",
    answer:
      "Yes! Standard and Premium plans include offline downloads. You can download content to your devices and watch without an internet connection.",
  },
  {
    question: "What is the AI recommendation feature?",
    answer:
      "Our advanced AI learns from your viewing habits, ratings, and preferences to suggest content you'll love. It gets smarter over time and helps you discover hidden gems.",
  },
  {
    question: "Is there a contract or commitment?",
    answer:
      "No contracts ever! You can cancel your subscription at any time with no cancellation fees. Your access continues until the end of your billing period.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <p className="mt-4 text-lg text-muted-foreground">Everything you need to know about FlixVideo</p>
        </motion.div>

        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <AccordionItem value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-semibold">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
