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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-[960px] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        {/* Left - branding panel */}
        <div className="hidden w-[420px] shrink-0 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary-foreground/15">
              <Shield className="size-7" />
            </div>
            <h1 className="mt-8 text-2xl font-bold leading-tight text-balance">
              ระบบบริหารจัดการยานพาหนะราชการ
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/75">
              Vehicle Management System สำหรับบันทึกการใช้รถยนต์ราชการแบบดิจิทัล
              พร้อมระบบจอง อนุมัติ และรายงานครบวงจร
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <p className="text-xs font-medium text-primary-foreground/60">ระบบรองรับ</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["การจองรถ", "การอนุมัติ", "บันทึกเดินทาง", "ซ่อมบำรุง", "รายงาน"].map((f) => (
                  <span
                    key={f}
                    className="rounded-md bg-primary-foreground/15 px-2.5 py-1 text-xs text-primary-foreground/90"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-primary-foreground/40">
              version 1.0.0
            </p>
          </div>
        </div>

        {/* Right - login form */}
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">ระบบยานพาหนะราชการ</p>
              <p className="text-xs text-muted-foreground">Vehicle Management System</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">เข้าสู่ระบบ</h2>
            <p className="mt-1 text-sm text-muted-foreground">กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">อีเมล / ชื่อผู้ใช้</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@gov.go.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  จดจำการเข้าสู่ระบบ
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 border-t border-border pt-6">
            <p className="mb-3 text-xs font-medium text-muted-foreground">บัญชีทดสอบ (Demo Accounts)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account)}
                  className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-accent"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {account.role[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{getRoleLabel(account.role)}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{account.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ForgotPasswordView({ onBack }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (email.trim()) setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="size-6 text-primary" />
        </div>

        {sent ? (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-foreground">ส่งอีเมลสำเร็จ</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง <span className="font-medium text-foreground">{email}</span> แล้ว
              กรุณาตรวจสอบอีเมลของท่าน
            </p>
            <Button onClick={onBack} className="mt-6 w-full">
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </div>
        ) : (
          <>
            <h2 className="mt-6 text-lg font-bold text-foreground">ลืมรหัสผ่าน</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">อีเมล</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="email@gov.go.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={!email.trim()}>
                ส่งลิงก์รีเซ็ตรหัสผ่าน
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
