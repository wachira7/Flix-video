// frontend/app/layout.tsx
import type React from "react"
import type { Metadata, Viewport } from "next"
import { Bodoni_Moda, Instrument_Sans, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-bodoni",
  display: "swap",
})
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FlixVideo - AI-Powered Streaming Platform",
  description:
    "Experience unlimited movies and TV shows with AI-powered recommendations. Stream on any device, anytime, anywhere.",
  // Removed icons - Next.js auto-detects app/icon.tsx
}

export const viewport: Viewport = {
  themeColor: "#0F0D0B",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodoni.variable} ${instrument.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.style.backgroundColor = theme === 'dark' ? '#0F0D0B' : '#F8F5F0';
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
          theme="dark"
        />
        <div className="h-32" />
      </body>
    </html>
  )
}
