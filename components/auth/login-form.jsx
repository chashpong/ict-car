"use client"

import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { Eye, EyeOff, LogIn, Shield, Loader2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("กรุณากรอกอีเมล")
      return
    }
    if (!password) {
      setError("กรุณากรอกรหัสผ่าน")
      return
    }

    setIsSubmitting(true)
    const result = await login(email, password, remember)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error || "เข้าสู่ระบบไม่สำเร็จ")
    }
  }

  if (showForgot) {
    return <ForgotPasswordView onBack={() => setShowForgot(false)} />
  }

  return (
    <div className="flex w-full flex-col font-sarabun">
      <div className="text-center md:text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบ</h2>
        <p className="mt-1 text-sm text-slate-500">กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold text-slate-700">อีเมล / ชื่อผู้ใช้</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@gov.go.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/60 focus:bg-white transition-colors h-11 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold text-slate-700">รหัสผ่าน</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 bg-white/60 focus:bg-white transition-colors h-11 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            <Label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">
              จดจำการเข้าสู่ระบบ
            </Label>
          </div>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>

        <div className="space-y-4">
          <Button type="submit" className="w-full bg-[#1e3a5f] hover:bg-[#152a45] text-white shadow-md h-11 text-lg font-bold rounded-xl" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 size-4" />
            )}
            {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              ยังไม่มีบัญชีผู้ใช้?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4"
              >
                สมัครสมาชิกใหม่
              </button>
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}

function ForgotPasswordView({ onBack }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return

    setIsPending(true)
    setError("")

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setIsPending(false)

    if (authError) {
      setError(authError.message) 
    } else {
      setSent(true)
    }
  }

  return (
    <div className="flex w-full flex-col font-sarabun">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 mb-2">
        <Shield className="size-6 text-[#1e3a5f]" />
      </div>

      {sent ? (
        <div className="mt-4">
          <h2 className="text-xl font-bold text-slate-900">ส่งอีเมลสำเร็จ</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง <span className="font-bold text-slate-900">{email}</span> แล้ว
            <br />กรุณาตรวจสอบอีเมลของท่าน
          </p>
          <Button onClick={onBack} className="mt-6 w-full bg-[#1e3a5f] hover:bg-[#152a45] text-white rounded-xl">
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      ) : (
        <>
          <h2 className="mt-2 text-xl font-bold text-slate-900">ลืมรหัสผ่าน</h2>
          <p className="mt-1 text-sm text-slate-500">
            กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="font-bold text-slate-700">อีเมล</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="example@gov.go.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/60 focus:bg-white transition-colors h-11 rounded-xl"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#1e3a5f] hover:bg-[#152a45] text-white h-11 font-bold rounded-xl" 
              disabled={isPending || !email.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  กำลังส่งอีเมล...
                </>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-xl" 
              onClick={onBack}
              disabled={isPending}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </form>
        </>
      )}
    </div>
  )
}