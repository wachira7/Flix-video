// components/landing/alert-banner.tsx
'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AlertBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Alert className="fixed top-0 w-full z-60 rounded-none border-x-0 border-t-0 bg-linear-to-r from-purple-600 to-pink-600 text-white border-b-0">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          <AlertDescription className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">
              🎉 New Year Special: Get 50% OFF Premium - Limited Time!
            </span>
          </AlertDescription>
          <div className="flex items-center gap-2">
            <Link href="/signup?plan=premium">
              <Button size="sm" variant="secondary" className="hidden sm:inline-flex">
                Claim Offer
              </Button>
            </Link>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:bg-white/20 rounded p-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Alert>
  );
}