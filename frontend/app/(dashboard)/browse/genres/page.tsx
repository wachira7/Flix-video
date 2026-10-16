// app/(dashboard)/browse/genres/page.tsx
// Merged into /browse. Kept as a redirect so old links keep working.
import { redirect } from "next/navigation"

export default function Page() {
  redirect("/browse")
}
