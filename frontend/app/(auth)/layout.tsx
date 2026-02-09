// app/(auth)/layout.tsx
import { Toaster } from "sonner"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={4000}
        theme="light"
      />
    </>
  )
}