"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image" // ✅ 1. นำเข้า Next Image เพื่อความเร็ว
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
    if (!isLoading && isAuthenticated) {
      router.replace("/")
    }
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
      options: {
        data: { full_name: formData.fullName }
      }
    })

    if (authError) {
      Swal.fire({ icon: 'error', title: 'สมัครไม่สำเร็จ', text: authError.message, confirmButtonColor: '#3b82f6' })
    } else {
      Swal.fire({ 
        icon: 'success', 
        title: 'ส่งรหัส OTP แล้ว!', 
        text: 'กรุณาตรวจสอบรหัส 8 หลักในอีเมลของคุณ',
        timer: 2500, 
        showConfirmButton: false 
      })
      setStep(2) 
    }
    setIsSubmitting(false)
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otp,
      type: 'signup' 
    })

    if (error) {
      Swal.fire({ icon: 'error', title: 'รหัสไม่ถูกต้อง', text: 'กรุณาตรวจสอบรหัส OTP อีกครั้ง', confirmButtonColor: '#3b82f6' })
    } else {
      Swal.fire({ 
        icon: 'success', 
        title: 'ยืนยันตัวตนสำเร็จ!', 
        text: 'เข้าสู่ระบบเรียบร้อยแล้ว',
        timer: 2000, 
        showConfirmButton: false 
      })
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
    // ✅ 2. ปรับโครงสร้างเพื่อรองรับ Image Component
    <div className="min-h-screen relative flex items-center justify-center font-sarabun overflow-hidden bg-slate-900 text-white">
      
      {/* 🚀 โหลดภาพพื้นหลังแบบด่วน */}
      <Image 
        src={ASSETS.bgImage} 
        alt="Background" 
        fill 
        priority 
        className="object-cover z-0" 
      />
      
      {/* 🔴 ชั้นที่ 1: แผ่นสีไล่ระดับความโปร่งใส */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f]/85 to-transparent z-0" />

      {/* 🔴 ชั้นที่ 2: กล่อง Content ตรงกลาง */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* 🔵 ฝั่งซ้าย: โลโก้และข้อความ */}
        <div className="flex flex-col justify-center space-y-8 pr-0 md:pr-12">
          
          <div className="w-36 h-36 md:w-40 md:h-40 flex items-center justify-center p-2 relative">
             <Image 
               src={ASSETS.logoImage} 
               alt="Logo" 
               fill 
               priority 
               className="object-contain drop-shadow-xl" 
             />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight drop-shadow-md">
              ระบบบริหารจัดการ<br />ยานพาหนะราชการ
            </h1>
            <h2 className="text-xl md:text-2xl text-slate-200 font-medium drop-shadow-sm">
              Government Vehicle Management System
            </h2>
          </div>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-lg font-light drop-shadow-sm">
            ระบบบริหารจัดการยานพาหนะราชการ การอนุมัติจัดตารางยานพาหนะรายสัปดาห์ 
            บันทึกค่าใช้จ่ายและควบคุมการเบิกจ่ายงบประมาณของส่วนราชการ
          </p>
          
          <div className="flex flex-wrap gap-2 pt-4">
            {["การจองรถ", "การอนุมัติ", "บันทึกเดินทาง", "ซ่อมบำรุง", "รายงาน"].map((feature) => (
              <Badge key={feature} variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full font-medium backdrop-blur-sm">
                {feature}
              </Badge>
            ))}
          </div>

          <p className="text-slate-400 text-xs font-medium tracking-wider pt-8">
            เวอร์ชัน 1.0.0
          </p>
        </div>

        {/* ⚪ ฝั่งขวา: กล่องฟอร์มโปร่งแสง (Glassmorphism) แบบเดียวกับหน้า Login */}
        <div className="flex justify-center md:justify-end">
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-10 rounded-[2.5rem] shadow-2xl transition-all duration-500">
            
            {step === 1 ? (
              // ================= STEP 1: ฟอร์มสมัครสมาชิก =================
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-6 text-center md:text-left">
                  <h2 className="text-3xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2 tracking-tight">
                    <UserPlus className="size-7" /> สมัครสมาชิก
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 font-medium">กรุณากรอกข้อมูลเพื่อขอเข้าใช้งานระบบ</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-bold text-white text-base">ชื่อ-นามสกุล</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-white transition-colors" />
                      {/* ✅ 3. เปลี่ยนสีช่องกรอกให้ใสและตัดกับพื้นหลัง */}
                      <Input 
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl h-12 focus:bg-white/20 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="กรุณากรอกชื่อ-นามสกุล"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-white text-base">อีเมล</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-white transition-colors" />
                      <Input 
                        type="email"
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl h-12 focus:bg-white/20 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="your-email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-white text-sm">รหัสผ่าน</Label>
                      <Input 
                        type="password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl h-12 focus:bg-white/20 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-white text-sm">ยืนยันรหัสผ่าน</Label>
                      <Input 
                        type="password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-xl h-12 focus:bg-white/20 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-4">
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 h-12 text-base font-bold rounded-xl transition-all hover:scale-[1.02]">
                      {isSubmitting ? <Loader2 className="animate-spin mr-2 size-5" /> : <UserPlus className="mr-2 size-5" />}
                      ลงทะเบียน
                    </Button>

                    <div className="text-center pt-2 border-t border-white/10 mt-4">
                      {/* ✅ 4. ลิงก์ย้อนกลับสีฟ้าสว่างเหมือนหน้า Login */}
                      <button 
                        type="button"
                        onClick={() => router.push("/login")}
                        className="text-sm font-bold text-sky-300 hover:text-sky-200 transition-colors flex items-center justify-center gap-2 w-full mt-4"
                        disabled={isSubmitting}
                      >
                        <ArrowLeft className="size-4" /> มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              // ================= STEP 2: ฟอร์มกรอก OTP =================
              <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-6 flex flex-col items-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 mb-4 shadow-inner border border-white/20">
                    <Mail className="size-7 text-sky-300" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">ยืนยันอีเมลของคุณ</h2>
                  <p className="text-sm text-slate-300 font-medium">
                    เราได้ส่งรหัส OTP 8 หลักไปที่<br />
                    <span className="font-bold text-sky-300 bg-sky-900/40 px-2 py-0.5 rounded-md leading-loose">{formData.email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <Input 
                    type="text"
                    maxLength={8}
                    className="bg-white/10 border-white/30 text-white text-center text-3xl tracking-[0.5em] font-mono rounded-2xl h-16 focus:bg-white/20 focus:border-blue-400 focus:ring-blue-400 transition-all placeholder:text-slate-500"
                    placeholder="--------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                    required
                    disabled={isSubmitting}
                  />

                  <Button type="submit" disabled={isSubmitting || otp.length < 8} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 h-12 text-base font-bold rounded-xl transition-all hover:scale-[1.02]">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 size-5" /> : <CheckCircle2 className="mr-2 size-5" />}
                    ยืนยันรหัส OTP
                  </Button>

                  <div className="text-center pt-4">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm font-bold text-slate-300 hover:text-white transition-colors"
                      disabled={isSubmitting}
                    >
                      กรอกอีเมลผิด? กลับไปแก้ไข
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* 🔴 ชั้นที่ 3: Footer ลิขสิทธิ์ด้านล่างสุด */}
      <div className="absolute bottom-0 w-full py-4 bg-slate-900/60 backdrop-blur-md text-center border-t border-white/10 z-10">
        <p className="text-slate-300 text-[10px] md:text-xs font-medium px-4">
          © 2026 ศูนย์เทคโนโลยีสารสนเทศและการสื่อสารเขต 4 (นครราชสีมา) สงวนลิขสิทธิ์ | ศูนย์เทคโนโลยีสารสนเทศและการสื่อสารเขต 4 (นครราชสีมา) ถนนกำแหงสงคราม ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000
        </p>
      </div>

    </div>
  )
}