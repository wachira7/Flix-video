// frontend/components/landing/stats-section.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Film, Star, Zap, CreditCard } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const stats = [
  {
    icon: Film,
    value: 10000,
    suffix: '+',
    label: 'Movies & TV Shows',
    description: 'Extensive content TMDB database',
  },
  {
    icon: CreditCard,
    value: 3,
    suffix: 'Plans',
    label: 'Subscription Tiers',
    description: 'Free, Basic & Premium options',
  },
  {
    icon: Star,
    value: 4.5,
    suffix: '/5',
    label: 'User Rating',
    description: 'Highly rated platform',
    decimals: 1,
  },
  {
    icon: Zap,
    value: 99.9,
    suffix: '%',
    label: 'Uptime',
    description: 'Reliable streaming',
    decimals: 1,
  },
];

function CountUpAnimation({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!nodeRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to({ val: 0 }, {
        val: value,
        duration: 2.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: nodeRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        onUpdate: function() {
          setCount(this.targets()[0].val);
        },
      });
    });

    return () => ctx.revert();
  }, [value]);

  return (
    <div ref={nodeRef} className="text-3xl md:text-4xl font-bold gradient-text">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}
      {suffix}
    </div>
  );
}

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Stagger animation for stat cards
    gsap.fromTo(
      cardsRef.current,
      {
        opacity: 0,
        y: 30,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.5)',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section className="py-20 bg-secondary/30" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              className="text-center space-y-3 p-6 rounded-lg hover:bg-background transition-colors"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <CountUpAnimation 
                value={stat.value} 
                decimals={stat.decimals} 
                suffix={stat.suffix}
              />
              <div className="font-semibold">{stat.label}</div>
              <div className="text-sm text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}