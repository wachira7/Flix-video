//frontend-web/components/landing/ai-showcase.tsx
'use client';

import { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Target, TrendingUp, Users } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const aiFeatures = [
  {
    icon: Brain,
    title: 'Smart Learning',
    description: 'Our AI learns from your viewing patterns to deliver increasingly accurate recommendations.',
  },
  {
    icon: Target,
    title: 'Precision Matching',
    description: 'Advanced algorithms analyze hundreds of factors to find your perfect match.',
  },
  {
    icon: TrendingUp,
    title: 'Trend Analysis',
    description: 'Stay ahead with recommendations based on trending content in your region.',
  },
  {
    icon: Users,
    title: 'Social Insights',
    description: 'Discover what people with similar tastes are watching and loving.',
  },
];


export function AIShowcase() {
  const demoRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!demoRef.current || !badgeRef.current) return;

    // Parallax effect on demo card
    gsap.to(demoRef.current, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: demoRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

    // Floating badge animation
    gsap.to(badgeRef.current, {
      y: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: badgeRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold">
              Recommendations That
              <span className="gradient-text"> Actually Get You</span>
            </h2>

            <p className="text-xl text-muted-foreground">
              Our advanced AI doesn't just suggest popular content. It understands
              your unique taste, mood, and viewing habits to recommend content
              you'll genuinely love.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              {aiFeatures.map((feature, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <feature.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual Demo */}
          <div className="relative" ref={demoRef}>
            <Card className="bg-linear-to-br from-purple-500/10 to-pink-500/10 border-2">
              <CardContent className="p-8">
                <div className="space-y-4">
                  {/* Mock AI recommendation cards */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-background rounded-lg border animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    >
                      <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                      <div className="text-2xl">🎯</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  AI analyzing your preferences...
                </div>
              </CardContent>
            </Card>

            {/* Floating badges */}
            <div 
              ref={badgeRef} 
              className="absolute -top-4 -right-4 bg-background border-2 border-primary rounded-full px-4 py-2 shadow-lg"
              >
              <span className="text-sm font-semibold">98% Match</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}