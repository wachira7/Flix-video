// app/(dashboard)/my-list/history/page.tsx
// Merged into /library. Kept as a redirect so old links keep working.
import { redirect } from "next/navigation"

export default function Page() {
  redirect("/library?tab=history")
}
