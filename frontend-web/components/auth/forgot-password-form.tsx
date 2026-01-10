// components/auth/forgot-password-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Mail, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import axios from "axios"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const forgotPasswordSchema = z.object({
  email: z.string().regex(emailRegex, "Invalid email address"),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true)
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, data)
      setEmailSent(true)
      toast.success("Password reset link sent to your email!")
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to send reset email"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-purple-900 via-purple-800 to-pink-800">
        <Card className="w-full max-w-md p-8 bg-white">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="text-gray-600">
              We've sent a password reset link to your email address. Please check your inbox and follow the
              instructions.
            </p>
            <Link href="/login">
              <Button className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Back to Login
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
            <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
            <p className="text-gray-600 mt-2">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="pl-10"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link href="/login" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}