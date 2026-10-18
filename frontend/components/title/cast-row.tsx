// components/title/cast-row.tsx
import Image from "next/image"
import Link from "next/link"
import { tmdbImage } from "@/components/landing/landing-types"

export interface CastMember {
  id: number
  name: string
  character?: string
  profile_path: string | null
}

export function CastRow({ cast }: { cast: CastMember[] }) {
  if (!cast.length) return null
  return (
    <section aria-labelledby="cast-heading">
      <h2 id="cast-heading" className="text-3xl">
        Cast
      </h2>
      <ul className="-mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {cast.map((c) => {
          const src = tmdbImage(c.profile_path, "w185")
          return (
            <li key={c.id} className="w-28 shrink-0 snap-start sm:w-32">
              <Link
                href={`/search?q=${encodeURIComponent(c.name)}&type=person`}
                className="group block text-center focus-visible:outline-none"
              >
                <span className="relative mx-auto block aspect-square w-24 overflow-hidden rounded-full border border-border/60 bg-muted ring-2 ring-transparent ring-offset-2 ring-offset-background transition-[box-shadow,transform] duration-300 group-hover:-translate-y-1 group-hover:ring-primary/60 group-focus-visible:ring-ring sm:w-28">
                  {src ? (
                    <Image src={src} alt="" fill sizes="112px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <span className="flex h-full items-center justify-center font-display text-3xl text-muted-foreground">
                      {c.name.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="mt-3 block truncate text-sm font-medium transition-colors group-hover:text-primary">{c.name}</span>
                {c.character && <span className="block truncate text-xs text-muted-foreground">{c.character}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
