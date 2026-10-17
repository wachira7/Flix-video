// app/(dashboard)/subscription/payment/stripe/page.tsx
// Merged into the one-page checkout. Kept as a redirect for old links.
import { redirect } from "next/navigation"

export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams
  redirect(`/subscription/checkout?plan=${encodeURIComponent(plan ?? "premium")}&method=card`)
}
