'use client';

import { useEffect, useRef } from 'react';
import { Monitor, Smartphone, Tablet, Tv } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const devices = [
  { icon: Monitor, name: 'Desktop' },
  { icon: Smartphone, name: 'Mobile' },
  { icon: Tablet, name: 'Tablet' },
  { icon: Tv, name: 'Smart TV' },
];

export function DevicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const devicesRef = useRef<HTMLDivElement[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Animate header
    gsap.fromTo(
      headerRef.current,
      {
        opacity: 0,
        y: 30,
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

    // Stagger device icons with rotation
    gsap.fromTo(
      devicesRef.current,
      {
        opacity: 0,
        y: 50,
        scale: 0.5,
        rotation: -180,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
        stagger: 0.15,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      }
    );

    // Floating animation for icons
    devicesRef.current.forEach((device, index) => {
      if (!device) return;
      gsap.to(device, {
        y: -10,
        duration: 2 + index * 0.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.2,
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section className="py-20 bg-secondary/30" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Watch Anywhere,
            <span className="gradient-text"> On Any Device</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Seamlessly switch between devices without missing a beat. Your progress
            syncs automatically across all platforms.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {devices.map((device, index) => (
            <div
              key={index}
              ref={(el) => {
                if (el) devicesRef.current[index] = el;
              }}
              className="text-center space-y-4 p-6 rounded-lg hover:bg-background transition-colors"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-purple-500/20 to-pink-500/20 border-2 border-primary/20">
                <device.icon className="w-10 h-10 text-primary" />
              </div>
              <div className="font-semibold">{device.name}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 space-y-2">
          <p className="text-sm text-muted-foreground">
            Available on iOS, Android, Web, Smart TVs, and more
          </p>
          <p className="text-sm font-semibold">
            Download on your favorite platform today
          </p>
        </div>
      </div>
    </section>
  );
}