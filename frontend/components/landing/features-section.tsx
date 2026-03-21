//src/components/landing/features-section.tsx
'use client';

import { useRef, useEffect } from 'react';
import { Brain, Zap, Users, Shield, Download, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Recommendations',
    description: 'Get personalized movie and TV show suggestions based on your viewing history and preferences.',
    tooltip: 'Our AI learns from your watching patterns to suggest content you\'ll love',
  },
  {
    icon: Zap,
    title: 'Lightning Fast Streaming',
    description: 'Experience buffer-free streaming with our optimized CDN and adaptive bitrate technology.',
    tooltip: 'Up to 4K quality with automatic quality adjustment based on your connection',
  },
  {
    icon: Users,
    title: 'Watch Parties',
    description: 'Watch together with friends in real-time with synchronized playback and live chat.',
    tooltip: 'Invite unlimited friends and watch synchronized across all devices',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and protected. We never share your information with third parties.',
    tooltip: 'Bank-level encryption and GDPR compliant data handling',
  },
  {
    icon: Download,
    title: 'Offline Downloads',
    description: 'Download your favorite content and watch offline anywhere, anytime.',
    tooltip: 'Available on Premium plan - download up to 100 titles',
  },
  {
    icon: Sparkles,
    title: 'Multiple Profiles',
    description: 'Create separate profiles for each family member with personalized recommendations.',
    tooltip: 'Up to 5 profiles per account with individual watch history',
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Animate section title
    gsap.fromTo(
      sectionRef.current.querySelector('.section-header'),
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      }
    );

    // Stagger animate cards
    gsap.fromTo(
      cardsRef.current,
      {
        opacity: 0,
        y: 60,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section id="features" className="py-20" ref={sectionRef}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="section-header text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="gradient-text"> Enjoy Streaming</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Packed with features designed to enhance your viewing experience
          </p>
        </div>

        {/* Features Grid */}
        <TooltipProvider>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg h-full cursor-help">
                      <CardContent className="p-6 space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{feature.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </section>
  );
}