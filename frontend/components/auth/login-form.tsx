// components/auth/login-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "framer-motion"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, data)
      
      // Store in localStorage (for client-side access)
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      
      // Store in cookies (for middleware)
      document.cookie = `token=${response.data.token}; path=/; max-age=2592000; SameSite=Strict`
      
      // Success message with username
      const username = response.data.user?.username || response.data.user?.email?.split('@')[0] || 'User'
      toast.success(`Welcome back, ${username}!`)
      
      const user = response.data.user
      const isAdmin = user?.role === 'admin' || user?.is_admin === true
      const isModerator = user?.role === 'moderator'

      setTimeout(() => {
        if (isAdmin || isModerator) {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }, 500)
      
    } catch (error: any) {        
      // Extract error message from various possible fields
      let message = "Login failed"
      
      if (error.response?.data) {
        // Backend might send: { error: "..." } or { message: "..." }
        message = error.response.data.error || 
                  error.response.data.message || 
                  message
      } else if (error.message) {
        // Network error
        message = "Network error - please check your connection"
      }
      
      // Show specific error messages
      if (message.toLowerCase().includes('invalid') || 
          message.toLowerCase().includes('incorrect') ||
          message.toLowerCase().includes('wrong')) {
        toast.error("Invalid email or password")
      } else if (message.toLowerCase().includes('not found')) {
        toast.error("Account not found - please sign up")
      } else if (message.toLowerCase().includes('network')) {
        toast.error("Connection failed - please try again")
      } else {
        toast.error(message)
      }
    
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-purple-900 via-fuchsia-900 to-purple-900 relative">
      {/* Back to Home Button */}
      <Link href="/">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors z-50 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Home</span>
        </motion.button>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-5xl"
      >
        <Card className="overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Login Form */}
            <motion.div
              initial={{ x: -100, opacity: 0, filter: "blur(10px)" }}
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="p-12 bg-white order-2 md:order-1"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-center"
                >
                  <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
                  <p className="text-gray-600 mt-2">or use your email account</p>
                </motion.div>

                {/* Google OAuth Button */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={handleGoogleLogin}
                    className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-purple-700 hover:shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <FcGoogle size={28} />
                  </button>
                </motion.div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        className="pl-10 text-gray-900"
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        className="pl-10 pr-10 text-gray-900"
                        placeholder="Enter your password"
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
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-right"
                  >
                    <Link
                      href="/forgot-password"
                      className="text-sm text-purple-700 hover:text-purple-800 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-linear-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "SIGN IN"
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </motion.div>

            {/* Right Side - Welcome */}
            <motion.div
              initial={{ x: 100, opacity: 0, filter: "blur(10px)" }}
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="bg-linear-to-br from-purple-700 to-fuchsia-600 p-12 flex flex-col justify-center items-center text-white order-1 md:order-2 relative"
              style={{
                clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)",
              }}
            >
              <div className="space-y-6 text-center relative z-10">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-4xl font-bold"
                >
                  Hello, Friend!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-purple-100 text-lg"
                >
                  Enter your personal details and start your journey with us
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Link href="/signup">
                    <Button
                      variant="outline"
                      className="border-2 border-white text-white hover:bg-white hover:text-purple-700 px-8 bg-transparent"
                    >
                      SIGN UP
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}