// app/(dashboard)/browse/tv-shows/page.tsx
// Merged into /browse. Kept as a redirect so old links keep working.
import { redirect } from "next/navigation"

export default function Page() {
  redirect("/browse?type=tv")
}
