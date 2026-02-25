// components/auth/reset-password-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getPasswordStrength } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import axios from "axios"

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(passwordRegex, "Password must contain uppercase, lowercase, number and special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch("password", "")
  const passwordStrength = password ? getPasswordStrength(password) : null

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Invalid or missing reset token")
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        newPassword: data.password,
      })

      toast.success("Password reset successful! Please login with your new password.")
      router.push("/login")
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to reset password"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const getStrengthColor = () => {
    if (!passwordStrength) return "bg-gray-200"
    switch (passwordStrength.strength) {
      case "weak":
        return "bg-red-500"
      case "fair":
        return "bg-orange-500"
      case "good":
        return "bg-yellow-500"
      case "strong":
        return "bg-green-500"
      default:
        return "bg-gray-200"
    }
  }

  const getStrengthWidth = () => {
    if (!passwordStrength) return "0%"
    return `${(passwordStrength.score / 6) * 100}%`
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-purple-900 via-purple-800 to-pink-800">
        <Card className="w-full max-w-md p-8 bg-white">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
            <p className="text-gray-600">This password reset link is invalid or has expired.</p>
            <Link href="/forgot-password">
              <Button className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Request New Link
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-purple-900 via-purple-800 to-pink-800">
      <Card className="w-full max-w-md p-8 bg-white">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-600 mt-2">Enter your new password</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="pl-10 text-gray-950"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: getStrengthWidth() }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 capitalize">Strength: {passwordStrength?.strength}</p>
                </div>
              )}

              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="pl-10 text-gray-950"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}