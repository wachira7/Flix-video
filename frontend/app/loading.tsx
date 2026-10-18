// app/loading.tsx
export default function Loading() {
  return (
    <div className="dark flex min-h-svh items-center justify-center bg-background" role="status" aria-label="Loading">
      <svg viewBox="0 0 24 24" className="h-12 w-12 animate-pulse text-primary" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9.5 7.5v9l7-4.5z" fill="currentColor" />
      </svg>
    </div>
  )
}
