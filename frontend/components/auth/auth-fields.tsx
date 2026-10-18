// components/auth/auth-fields.tsx
// Shared building blocks for the auth forms.
"use client"

import { forwardRef, useState, type ComponentType, type InputHTMLAttributes, type ReactNode } from "react"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

/** Stagger container + item variants for form rows */
export const formStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
export const formItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

export function FormHeader({ title, italic, children }: { title: string; italic?: string; children?: ReactNode }) {
  return (
    <motion.div variants={formItem} className="space-y-2">
      <h1 className="text-[2.1rem] leading-[1.05] sm:text-[2.5rem]">
        {title} {italic && <em className="italic text-primary">{italic}</em>}
      </h1>
      {children && <p className="text-[15px] text-muted-foreground">{children}</p>}
    </motion.div>
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -4 }}
          transition={{ duration: 0.25, ease }}
          className="overflow-hidden text-sm text-destructive"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  error?: string
  trailing?: ReactNode
  labelAside?: ReactNode
}

export const AuthField = forwardRef<HTMLInputElement, FieldProps>(function AuthField(
  { id, label, icon: Icon, error, trailing, labelAside, className, ...props },
  ref
) {
  return (
    <motion.div variants={formItem} className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {labelAside}
      </div>
      <div className="group relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
        <Input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-12 rounded-lg border-input bg-card/60 pl-11 text-[15px] shadow-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-muted-foreground/40 focus-visible:border-primary/70 focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-primary/20",
            trailing && "pr-11",
            error && "border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/20",
            className
          )}
          {...props}
        />
        {trailing}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </motion.div>
  )
})

/** Eye toggle for password inputs. */
export function useReveal() {
  const [shown, setShown] = useState(false)
  const toggle = (
    <button
      type="button"
      onClick={() => setShown((s) => !s)}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={shown ? "off" : "on"}
          initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
          transition={{ duration: 0.18 }}
          className="flex"
        >
          {shown ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
  return { type: shown ? "text" : "password", toggle }
}

// Mirrors passwordRegex in lib/validations/auth.ts
const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Upper and lower case letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
  { label: "One symbol (!@#$%^&*)", test: (p: string) => /[!@#$%^&*]/.test(p) },
  { label: "No other symbols or spaces", test: (p: string) => /^[A-Za-z\d!@#$%^&*]*$/.test(p) },
]

const levels = [
  { label: "Too weak", bar: "bg-destructive" },
  { label: "Weak", bar: "bg-destructive" },
  { label: "Almost there", bar: "bg-primary" },
  { label: "Good", bar: "bg-primary" },
  { label: "Strong", bar: "bg-success" },
]

export function PasswordChecklist({ password }: { password: string }) {
  const passed = rules.map((r) => r.test(password))
  const score = passed.filter(Boolean).length // 0..5
  const level = levels[Math.max(0, score - 1)]
  const filled = Math.min(4, Math.max(0, score - 1))

  return (
    <AnimatePresence initial={false}>
      {password && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease }}
          className="overflow-hidden"
        >
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1.5" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={cn("h-full rounded-full", level.bar)}
                      initial={false}
                      animate={{ width: i < filled ? "100%" : "0%" }}
                      transition={{ duration: 0.35, ease, delay: i * 0.04 }}
                    />
                  </div>
                ))}
              </div>
              <span className="w-24 text-right text-xs text-muted-foreground" aria-live="polite">
                {level.label}
              </span>
            </div>
            <ul className="grid gap-1.5 text-[13px] sm:grid-cols-2">
              {rules.map((rule, i) => (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-2 transition-colors duration-200",
                    passed[i] ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-300",
                      passed[i] ? "scale-100 border-success bg-success" : "scale-90 border-border"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-2.5 w-2.5 text-background transition-opacity",
                        passed[i] ? "opacity-100" : "opacity-0"
                      )}
                      strokeWidth={3.5}
                    />
                  </span>
                  <span className="sr-only">{passed[i] ? "Done: " : "Missing: "}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type SubmitState = "idle" | "loading" | "success"

export function SubmitButton({
  state,
  children,
  loadingText,
}: {
  state: SubmitState
  children: ReactNode
  loadingText: string
}) {
  return (
    <motion.div variants={formItem}>
      <motion.button
        type="submit"
        disabled={state !== "idle"}
        whileTap={state === "idle" ? { scale: 0.98 } : undefined}
        className={cn(
          "relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg text-[15px] font-semibold transition-[background-color,filter] duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-default",
          state === "success" ? "bg-success text-background" : "bg-primary text-primary-foreground hover:brightness-110"
        )}
      >
        {/* Light sweep on hover */}
        <span
          aria-hidden="true"
          className="button-sweep pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-linear-to-r from-transparent via-white/35 to-transparent"
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {state === "loading" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {loadingText}
              </>
            )}
            {state === "success" && (
              <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} className="flex">
                <Check className="h-5 w-5" strokeWidth={3} aria-label="Done" />
              </motion.span>
            )}
            {state === "idle" && children}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

/** Banner for whole-form errors, with a shake each time `shakeKey` changes. */
export function FormAlert({ message, shakeKey }: { message?: string; shakeKey: number }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key={shakeKey}
          role="alert"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: [0, -10, 9, -6, 4, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-foreground"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.div variants={formItem}>
      <button
        type="button"
        onClick={onClick}
        className="group flex h-12 w-full items-center justify-center gap-3 rounded-lg border bg-card/60 text-[15px] font-medium transition-[border-color,background-color,transform] duration-200 hover:border-muted-foreground/50 hover:bg-card active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <FcGoogle className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" aria-hidden="true" />
        {label}
      </button>
    </motion.div>
  )
}

export function OrDivider() {
  return (
    <motion.div variants={formItem} className="flex items-center gap-4 text-xs tracking-wide text-muted-foreground uppercase">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </motion.div>
  )
}
