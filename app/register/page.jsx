"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Swal from 'sweetalert2'

const ASSETS = {
  bgImage: "/images/image.png",
  logoImage: "/images/Thailand.png",
}

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/")
  }, [isAuthenticated, isLoading, router])

  const handleRegister = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'รหัสผ่านไม่ตรงกัน', confirmButtonColor: '#3b82f6' })
      return
    }
    setIsSubmitting(true)
    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.fullName } }
    })
    if (authError) {
      Swal.fire({ icon: 'error', title: 'สมัครไม่สำเร็จ', text: authError.message, confirmButtonColor: '#3b82f6' })
    } else {
      Swal.fire({ icon: 'success', title: 'ส่งรหัส OTP แล้ว!', text: 'กรุณาตรวจสอบรหัส 8 หลักในอีเมลของคุณ', timer: 2500, showConfirmButton: false })
      setStep(2)
    }
    setIsSubmitting(false)
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { data, error } = await supabase.auth.verifyOtp({ email: formData.email, token: otp, type: 'signup' })
    if (error) {
      Swal.fire({ icon: 'error', title: 'รหัสไม่ถูกต้อง', text: 'กรุณาตรวจสอบรหัส OTP อีกครั้ง', confirmButtonColor: '#3b82f6' })
    } else {
      Swal.fire({ icon: 'success', title: 'ยืนยันตัวตนสำเร็จ!', text: 'เข้าสู่ระบบเรียบร้อยแล้ว', timer: 2000, showConfirmButton: false })
      router.push("/")
    }
    setIsSubmitting(false)
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 font-sarabun">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col font-sarabun overflow-hidden bg-slate-900 text-white">

      {/* Background */}
      <Image src={ASSETS.bgImage} alt="Background" fill priority className="object-cover z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1e3a5f]/90 via-[#1e3a5f]/80 to-slate-900/95 z-0 md:bg-gradient-to-r" />

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-5 py-10 md:px-8 md:py-0 gap-8 md:gap-12">

        {/* ── Left: Branding ── */}
        <div className="flex flex-col items-center md:items-start text-white text-center md:text-left w-full md:flex-1 md:pr-8 gap-5">
          <div className="relative size-24 md:size-36 shrink-0">
            <Image src={ASSETS.logoImage} alt="Logo" fill priority className="object-contain drop-shadow-xl" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight drop-shadow-md">
              ระบบบริหารจัดการ<br />ยานพาหนะราชการ
            </h1>
            <h2 className="text-base md:text-2xl text-slate-200 font-medium drop-shadow-sm">
              Government Vehicle Management System
            </h2>
          </div>

          <p className="hidden md:block text-sm text-slate-300 leading-relaxed max-w-lg font-light drop-shadow-sm">
            ระบบบริหารจัดการยานพาหนะราชการ การอนุมัติจัดตารางยานพาหนะรายสัปดาห์
            บันทึกค่าใช้จ่ายและควบคุมการเบิกจ่ายงบประมาณของส่วนราชการ
          </p>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {["การจองรถ", "การอนุมัติ", "บันทึกเดินทาง", "ซ่อมบำรุง", "รายงาน"].map((feature) => (
              <Badge key={feature} variant="outline" className="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                {feature}
              </Badge>
            ))}
          </div>

          <p className="hidden md:block text-slate-500 text-xs font-medium tracking-wider">เวอร์ชัน 1.0.0</p>
        </div>

        {/* ── Right: Form ── */}
        <div className="w-full md:w-auto md:min-w-[400px] md:max-w-md">
          <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 p-7 md:p-10 rounded-3xl shadow-2xl transition-all duration-500">

            {step === 1 ? (
              // ── Step 1: Register form ──
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-6 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2 tracking-tight">
                    <UserPlus className="size-6" /> สมัครสมาชิก
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-300 font-medium">กรุณากรอกข้อมูลเพื่อขอเข้าใช้งานระบบ</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-white text-sm">ชื่อ-นามสกุล</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-white transition-colors" />
                      <Input
                        className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl h-11 focus:bg-white/20 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="กรุณากรอกชื่อ-นามสกุล"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        required disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-bold text-white text-sm">อีเมล</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-white transition-colors" />
                      <Input
                        type="email"
                        className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl h-11 focus:bg-white/20 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="your-email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Password fields: stack on mobile, side-by-side on sm+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-white text-sm">รหัสผ่าน</Label>
                      <Input
                        type="password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl h-11 focus:bg-white/20 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-white text-sm">ยืนยันรหัสผ่าน</Label>
                      <Input
                        type="password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl h-11 focus:bg-white/20 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="pt-1 space-y-3">
                    <Button type="submit" disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg h-11 text-sm font-bold rounded-xl transition-all hover:scale-[1.01]">
                      {isSubmitting ? <Loader2 className="animate-spin mr-2 size-4" /> : <UserPlus className="mr-2 size-4" />}
                      ลงทะเบียน
                    </Button>

                    <div className="text-center pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="text-sm font-bold text-sky-300 hover:text-sky-200 transition-colors flex items-center justify-center gap-1.5 w-full mt-3"
                        disabled={isSubmitting}
                      >
                        <ArrowLeft className="size-4" /> มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              // ── Step 2: OTP verify ──
              <div className="text-center space-y-5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner border border-white/20">
                    <Mail className="size-7 text-sky-300" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">ยืนยันอีเมลของคุณ</h2>
                  <p className="text-sm text-slate-300 font-medium">
                    เราได้ส่งรหัส OTP 8 หลักไปที่<br />
                    <span className="font-bold text-sky-300 bg-sky-900/40 px-2 py-0.5 rounded-md">{formData.email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <Input
                    type="text"
                    maxLength={8}
                    className="bg-white/10 border-white/30 text-white text-center text-3xl tracking-[0.5em] font-mono rounded-2xl h-16 focus:bg-white/20 focus:border-blue-400 focus:ring-blue-400 transition-all placeholder:text-slate-500"
                    placeholder="--------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    required disabled={isSubmitting}
                  />

                  <Button type="submit" disabled={isSubmitting || otp.length < 8}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 text-sm font-bold rounded-xl transition-all hover:scale-[1.01]">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 size-4" /> : <CheckCircle2 className="mr-2 size-4" />}
                    ยืนยันรหัส OTP
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-bold text-slate-300 hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    กรอกอีเมลผิด? กลับไปแก้ไข
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 w-full py-3 bg-slate-900/70 backdrop-blur-md text-center border-t border-white/10 px-4">
        <p className="text-slate-400 text-[10px] md:text-xs font-medium leading-relaxed">
          © 2026 ศูนย์เทคโนโลยีสารสนเทศและการสื่อสารเขต 4 (นครราชสีมา) สงวนลิขสิทธิ์
          <span className="hidden md:inline"> | ถนนกำแหงสงคราม ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000</span>
        </p>
      </div>

    </div>
  )
}