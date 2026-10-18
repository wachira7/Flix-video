// app/(dashboard)/profile/edit/page.tsx
// Editing lives on the profile page itself.
import { redirect } from "next/navigation"

export default function Page() {
  redirect("/profile#edit")
}
