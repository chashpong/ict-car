"use client"

import { useState } from "react"
import { Eye, EyeOff, LogIn, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth, getRoleLabel } from "@/lib/auth-context"

const DEMO_ACCOUNTS = [
  { email: "admin@gov.go.th", password: "admin1234", role: "admin" },
  { email: "approver@gov.go.th", password: "approve1234", role: "approver" },
  { email: "driver@gov.go.th", password: "driver1234", role: "driver" },
  { email: "user@gov.go.th", password: "user1234", role: "user" },
]

export function LoginForm() {
  const { login } = useAuth()
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

  function handleQuickLogin(account) {
    setEmail(account.email)
    setPassword(account.password)
    setError("")
  }

  if (showForgot) {
    return <ForgotPasswordView onBack={() => setShowForgot(false)} />
  }

  // ✅ ถอดกล่อง min-h-screen และกล่องสีน้ำเงินออกทั้งหมด เหลือแค่เนื้อหาฟอร์ม
  return (
    <div className="flex w-full flex-col">
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
            placeholder="email@gov.go.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            className="bg-white/60 focus:bg-white transition-colors"
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
              autoComplete="current-password"
              className="pr-10 bg-white/60 focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
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
            className="text-sm font-bold text-blue-600 transition-colors hover:text-blue-800"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>

        <Button type="submit" className="w-full bg-[#1e3a5f] hover:bg-[#152a45] text-white shadow-md" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 size-4" />
          )}
          {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>
      </form>

      {/* Demo accounts */}
      <div className="mt-8 border-t border-slate-200/60 pt-6">
        <p className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">บัญชีทดสอบ (Demo Accounts)</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => handleQuickLogin(account)}
              className="group flex items-center gap-3 rounded-xl border border-white/40 bg-white/40 px-3 py-2.5 text-left transition-all hover:border-blue-300 hover:bg-white/80 shadow-sm"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-[#1e3a5f] transition-colors group-hover:bg-[#1e3a5f] group-hover:text-white">
                {account.role[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-700">{getRoleLabel(account.role)}</p>
                <p className="truncate text-[10px] text-slate-500">{account.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ✅ ถอดกรอบหน้าลืมรหัสผ่านออกเช่นกัน เพื่อให้อยู่ในกรอบโปร่งแสงได้สวยๆ
function ForgotPasswordView({ onBack }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (email.trim()) setSent(true)
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 mb-2">
        <Shield className="size-6 text-[#1e3a5f]" />
      </div>

      {sent ? (
        <div className="mt-4">
          <h2 className="text-xl font-bold text-slate-900">ส่งอีเมลสำเร็จ</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง <span className="font-bold text-slate-900">{email}</span> แล้ว
            กรุณาตรวจสอบอีเมลของท่าน
          </p>
          <Button onClick={onBack} className="mt-6 w-full bg-[#1e3a5f] hover:bg-[#152a45] text-white">
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
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="font-bold text-slate-700">อีเมล</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="email@gov.go.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="bg-white/60 focus:bg-white transition-colors"
              />
            </div>
            <Button type="submit" className="w-full bg-[#1e3a5f] hover:bg-[#152a45] text-white" disabled={!email.trim()}>
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </Button>
            <Button type="button" variant="ghost" className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-100/50" onClick={onBack}>
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </form>
        </>
      )}
    </div>
  )
}