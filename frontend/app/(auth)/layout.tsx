// app/(auth)/layout.tsx
import { Toaster } from "sonner"
import { AuthShell } from "@/components/auth/auth-shell"
import { getPosterWall } from "@/components/landing/landing-data"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const posters = await getPosterWall()

  return (
    <>
      <AuthShell posters={posters}>{children}</AuthShell>
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={4000}
        theme="dark"
      />
    </>
  )
}
