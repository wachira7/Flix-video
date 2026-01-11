"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Check, Sparkles } from "lucide-react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const plans = [
  {
    name: "Free",
    price: "KSh 0",
    period: "/month",
    description: "Perfect for casual viewers",
    features: [
      "3 Watchlists",
      "5 Custom Lists",
      "1 AI Recommendation/day",
      "2 Watch Parties/day",
      "Standard Quality",
      "Ads Supported",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Basic",
    price: "KSh 499",
    period: "/month",
    description: "Best for regular viewers",
    features: [
      "10 Watchlists",
      "20 Custom Lists",
      "5 AI Recommendations/day",
      "10 Watch Parties/day",
      "HD Quality",
      "Ad-Free Experience",
      "Download for Offline",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=basic",
    popular: false,
  },
  {
    name: "Premium",
    price: "KSh 999",
    period: "/month",
    description: "For the ultimate experience",
    features: [
      "Unlimited Watchlists",
      "Unlimited Custom Lists",
      "Unlimited AI Recommendations",
      "Unlimited Watch Parties",
      "4K Quality",
      "Ad-Free Experience",
      "Download for Offline",
      "AI Chat Assistant",
      "Early Access Features",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=premium",
    popular: true,
  },
]

export function PricingSection() {
  const cardsRef = useRef<HTMLDivElement[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(
      cardsRef.current,
      {
        opacity: 0,
        y: 100,
        scale: 0.85,
        rotateX: 25,
        z: -200,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        z: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: {
          each: 0.2,
          from: "center",
        },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "top 30%",
          toggleActions: "play none none reverse",
        },
      },
    )

    cardsRef.current.forEach((card, index) => {
      gsap.to(card, {
        y: -10,
        duration: 2 + index * 0.3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: index * 0.2,
      })
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <section id="pricing" className="py-20 bg-secondary/30" ref={sectionRef}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your
            <span className="gradient-text"> Perfect Plan</span>
          </h2>
          <p className="text-xl text-muted-foreground">Start with a free trial. Upgrade anytime. Cancel anytime.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              ref={(el) => {
                if (el) cardsRef.current[index] = el
              }}
              style={{ perspective: "1000px" }}
              className="transition-transform duration-300 hover:scale-105"
            >
              <Card
                className={`relative ${plan.popular ? "border-primary shadow-xl scale-105" : "border-2"} hover:shadow-2xl transition-all duration-300`}
                style={{
                  transformStyle: "preserve-3d",
                  background: plan.popular
                    ? "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)"
                    : "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter>
                  <Link href={plan.href} className="w-full">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"} size="lg">
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
