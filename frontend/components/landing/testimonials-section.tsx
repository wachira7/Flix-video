'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Star } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Movie Enthusiast',
    content: 'The AI recommendations are spot on! I\'ve discovered so many hidden gems I would have never found otherwise.',
    rating: 5,
    avatar: 'SJ',
  },
  {
    name: 'Michael Chen',
    role: 'Binge Watcher',
    content: 'Watch parties with friends are amazing! The sync is perfect and the chat makes it feel like we\'re in the same room.',
    rating: 5,
    avatar: 'MC',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Family Plan User',
    content: 'Perfect for our family. Each person gets their own profile with personalized recommendations. Worth every shilling!',
    rating: 5,
    avatar: 'ER',
  },
  {
    name: 'David Kamau',
    role: 'Tech Professional',
    content: 'The streaming quality is excellent, even on slower connections. The adaptive bitrate technology works perfectly!',
    rating: 4.5,
    avatar: 'DK',
  },
  {
    name: 'Amina Hassan',
    role: 'Student',
    content: 'Love the offline download feature! I can download shows at home and watch during my commute without using data.',
    rating: 5,
    avatar: 'AH',
  },
];

export function TestimonialsSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current) return;

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

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section className="py-20" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by
            <span className="gradient-text"> Thousands</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our users have to say about their experience
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
              align: 'start',
              loop: true,
            }}
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="border-2 h-full">
                    <CardContent className="p-6 space-y-4 flex flex-col h-full">
                      {/* Rating */}
                        <div className="flex gap-1">
                          {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
                            <Star
                              key={i}
                              className="w-5 h-5 text-yellow-500"
                              fill="currentColor"
                            />
                          ))}
                          {testimonial.rating % 1 !== 0 && (
                            <Star
                              className="w-5 h-5 text-yellow-500"
                              fill="currentColor"
                              style={{ clipPath: 'inset(0 50% 0 0)' }}
                            />
                          )}
                        </div>
                      {/* Content */}
                      <p className="text-muted-foreground italic flex-1">
                        "{testimonial.content}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Avatar>
                          <AvatarFallback className="bg-linear-to-br from-purple-500 to-pink-500 text-white">
                            {testimonial.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Auto-playing • Hover to pause
        </p>
      </div>
    </section>
  );
}