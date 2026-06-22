"use client"

import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { Eye, EyeOff, LogIn, Shield, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import Swal from 'sweetalert2'

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
      setError("กรุณากรอกอีเมล หรือ ชื่อผู้ใช้งาน")
      return
    }
    if (!password) {
      setError("กรุณากรอกรหัสผ่าน")
      return
    }

    setIsSubmitting(true)

    // บล็อคหน้าจอด้วย SweetAlert กันผู้ใช้กดปุ่มซ้ำ
    Swal.fire({
      title: 'กำลังเข้าสู่ระบบ...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      showConfirmButton: false, 
      didOpen: () => {
        Swal.showLoading()
      }
    });

    const result = await login(email, password)

    if (!result.success) {
      Swal.close() 
      setError(result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      setIsSubmitting(false) 
    } else {
      // ✅ 1. ปิดหน้าจอโหลด
      Swal.close() 
      
      // ✅ 2. ดึงตำแหน่ง (Role) ของคนที่เพิ่งล็อกอินเข้ามา
      const userRole = result.user?.role || "user"
      
      // ✅ 3. เช็กสิทธิ์แล้วพาวาร์ปไปหน้าที่ถูกต้อง (ทำ Hard Navigate แก้ปัญหาค้าง)
      if (userRole === "admin") {
        window.location.href = "/" 
      } else if (userRole === "approver") {
        window.location.href = "/approvals"
      } else if (userRole === "reviewer") {
        window.location.href = "/reviewer"
      } else if (userRole === "driver") {
        window.location.href = "/logbook"
      } else {
        window.location.href = "/bookings" // สำหรับ user ทั่วไป
      }
    }
  }

  if (showForgot) {
    return <ForgotPasswordView onBack={() => setShowForgot(false)} />
  }

  return (
    // ✅ เปลี่ยนข้อความหลักเป็นสีขาว (text-white)
    <div className="flex w-full flex-col font-sarabun text-white animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center md:text-left mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight">เข้าสู่ระบบ</h2>
        <p className="mt-2 text-sm font-medium text-slate-300">กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-rose-400 bg-rose-500/20 px-4 py-3 text-sm font-bold text-rose-100 backdrop-blur-sm animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold text-white text-base">อีเมล / ชื่อผู้ใช้</Label>
          <Input
            id="email"
            type="text" // เปลี่ยนเป็น text เผื่อผู้ใช้กรอกเป็นชื่อ
            placeholder="your-email@example.com หรือ Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // ✅ ปรับกล่อง Input ให้เป็นกระจกฝ้า ขอบขาวโปร่งแสง
            className="bg-white/10 focus:bg-white/20 transition-all h-12 rounded-xl text-white placeholder:text-slate-400 border-white/20 focus:ring-blue-400 focus:border-blue-400"
            disabled={isSubmitting} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold text-white text-base">รหัสผ่าน</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="กรอกรหัสผ่านของคุณ"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 bg-white/10 focus:bg-white/20 transition-all h-12 rounded-xl text-white placeholder:text-slate-400 border-white/20 focus:ring-blue-400 focus:border-blue-400"
              disabled={isSubmitting} 
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
              disabled={isSubmitting}
              className="border-slate-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label htmlFor="remember" className="text-sm font-bold text-slate-200 cursor-pointer">
              จดจำการเข้าสู่ระบบ
            </Label>
          </div>
          {/* ✅ ลิงก์ลืมรหัสผ่านเป็นสีฟ้าสว่าง */}
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-sm font-bold text-sky-300 hover:text-sky-200 transition-colors"
            disabled={isSubmitting}
          >
            ลืมรหัสผ่าน?
          </button>
        </div>

        <div className="space-y-5 pt-4">
          {/* ✅ ปุ่มล็อกอินสีน้ำเงินเด่นๆ */}
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 h-12 text-base font-bold rounded-xl transition-all hover:scale-[1.02]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 size-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 size-5" />
            )}
            {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>

          <div className="text-center pt-2 border-t border-white/10 mt-4">
            <p className="text-sm font-medium text-slate-300 mt-4">
              ยังไม่มีบัญชีผู้ใช้?{" "}
              {/* ✅ ลิงก์สมัครสมาชิกสีฟ้าสว่าง */}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="font-bold text-sky-300 hover:text-sky-200 underline underline-offset-4 transition-colors"
                disabled={isSubmitting}
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
    <div className="flex w-full flex-col font-sarabun text-white animate-in fade-in zoom-in-95 duration-500">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 mb-4 shadow-inner border border-white/20">
        <Shield className="size-7 text-sky-300" />
      </div>

      {sent ? (
        <div className="mt-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">ส่งอีเมลสำเร็จ</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200 font-medium">
            ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง <span className="font-bold text-sky-300 bg-sky-900/40 px-2 py-0.5 rounded-md">{email}</span> แล้ว
            <br />กรุณาตรวจสอบกล่องจดหมายของท่าน
          </p>
          <Button onClick={onBack} className="mt-8 w-full h-12 font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition-all hover:scale-[1.02]">
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      ) : (
        <>
          <h2 className="mt-2 text-2xl font-extrabold text-white tracking-tight">ลืมรหัสผ่าน</h2>
          <p className="mt-2 text-sm font-medium text-slate-300">
            กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้ท่าน
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-400 bg-rose-500/20 px-4 py-3 text-sm font-bold text-rose-100 backdrop-blur-sm animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="font-bold text-white text-base">อีเมล</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 focus:bg-white/20 transition-all h-12 rounded-xl text-white placeholder:text-slate-400 border-white/20 focus:ring-blue-400 focus:border-blue-400"
                required
                disabled={isPending}
              />
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]" 
                disabled={isPending || !email.trim()}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    กำลังส่งอีเมล...
                  </>
                ) : (
                  "ส่งลิงก์รีเซ็ตรหัสผ่าน"
                )}
              </Button>

              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-slate-300 font-bold hover:text-white hover:bg-white/10 rounded-xl h-12 transition-colors" 
                onClick={onBack}
                disabled={isPending}
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}