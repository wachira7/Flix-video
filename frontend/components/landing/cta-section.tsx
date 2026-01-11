"use client"

import { Button } from "@/components/ui/button"
import { Play, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-linear-to-r from-primary to-accent py-24 sm:py-32">
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-white opacity-10 blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-white opacity-10 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4" />
          <span>30-Day Free Trial</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-6 text-balance text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
        >
          Ready to start watching?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-6 text-pretty text-lg text-white/90 sm:text-xl"
        >
          Join millions of users enjoying unlimited entertainment with AI-powered recommendations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
            <Link href="/signup">
              Start Free Trial
              <Play className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-white bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="#pricing">View Plans</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-6 text-sm text-white/80"
        >
          No credit card required • Cancel anytime • Instant access
        </motion.p>
      </div>
    </section>
  )
}
