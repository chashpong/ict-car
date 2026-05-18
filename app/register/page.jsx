"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Swal from 'sweetalert2'

// 🎨 ✨ ส่วนที่แก้ไขได้ง่าย: เปลี่ยนรูปภาพและโลโก้ตรงนี้ (ใช้ชุดเดียวกับ Login)
const ASSETS = {
  bgImage: "/images/image.png", 
  logoImage: "/images/Thailand.png",
}

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  // ✅ 1. เพิ่ม State สำหรับจัดการ Step (1 = สมัคร, 2 = กรอก OTP)
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  // ป้องกันการเข้าหน้านี้ถ้าล็อกอินอยู่แล้ว
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, router])

  // ✅ 2. ปรับปรุง handleRegister ให้สลับไปหน้า OTP แทนการ Redirect
  const handleRegister = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'รหัสผ่านไม่ตรงกัน' })
      return
    }

    setIsSubmitting(true)
    
    // สมัครสมาชิกในระบบ Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.fullName }
      }
    })

    if (authError) {
      Swal.fire({ icon: 'error', title: 'สมัครไม่สำเร็จ', text: authError.message })
    } else {
      // 🎉 เปลี่ยนจากการ Redirect เป็นการสลับหน้าไปกรอก OTP
      Swal.fire({ 
        icon: 'success', 
        title: 'ส่งรหัส OTP แล้ว!', 
        text: 'กรุณาตรวจสอบรหัส 6 หลักในอีเมลของคุณ',
        timer: 2500, 
        showConfirmButton: false 
      })
      setStep(2) // สลับไปฟอร์มกรอก OTP
    }
    setIsSubmitting(false)
  }

  // ✅ 3. เพิ่มฟังก์ชันสำหรับยืนยันรหัส OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.verifyOtp({
      email: formData.email,
      token: otp,
      type: 'signup' // ระบุว่าเป็นการยืนยันอีเมลสมัครใหม่
    })

    if (error) {
      Swal.fire({ icon: 'error', title: 'รหัสไม่ถูกต้อง', text: 'กรุณาตรวจสอบรหัส OTP อีกครั้ง' })
    } else {
      Swal.fire({ 
        icon: 'success', 
        title: 'ยืนยันตัวตนสำเร็จ!', 
        text: 'เข้าสู่ระบบเรียบร้อยแล้ว',
        timer: 2000, 
        showConfirmButton: false 
      })
      // สำเร็จแล้วพาเข้าหน้าหลัก (หรือ Dashboard)
      router.push("/dashboard") // หรือ "/" แล้วแต่คุณตั้งไว้
    }
    setIsSubmitting(false)
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 font-sarabun">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center font-sarabun bg-cover bg-center overflow-hidden text-white"
      style={{ backgroundImage: `url('${ASSETS.bgImage}')` }}
    >
      
      {/* 🔴 ชั้นที่ 1: แผ่นสีไล่ระดับความโปร่งใส (Gradient Fade) เหมือนหน้า Login */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f]/85 to-transparent" />

      {/* 🔴 ชั้นที่ 2: กล่อง Content ตรงกลาง จัดสัดส่วน 2 ฝั่ง */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* 🔵 ฝั่งซ้าย: โลโก้และข้อความ */}
        <div className="flex flex-col justify-center space-y-8 pr-0 md:pr-12">
          
          <div className="w-36 h-36 md:w-40 md:h-40 flex items-center justify-center p-2">
            <img src={ASSETS.logoImage} alt="Logo" className="w-full h-full object-contain" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight drop-shadow-md">
              ระบบบริหารจัดการ<br />ยานพาหนะราชการ
            </h1>
            <h2 className="text-xl md:text-2xl text-slate-200 font-medium opacity-90">
              Government Vehicle Management System
            </h2>
          </div>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-lg font-light opacity-80">
            ระบบบริหารจัดการยานพาหนะราชการ การอนุมัติจัดตารางยานพาหนะรายสัปดาห์ 
            บันทึกค่าใช้จ่ายและควบคุมการเบิกจ่ายงบประมาณของส่วนราชการ
          </p>
          
          <div className="flex flex-wrap gap-2 pt-4">
            {["การจองรถ", "การอนุมัติ", "บันทึกเดินทาง", "ซ่อมบำรุง", "รายงาน"].map((feature) => (
              <Badge key={feature} variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10 px-4 py-1.5 rounded-full font-medium">
                {feature}
              </Badge>
            ))}
          </div>

          <p className="text-slate-400 text-xs font-medium tracking-wider pt-8">
            เวอร์ชัน 1.0.0
          </p>
        </div>

        {/* ⚪ ฝั่งขวา: กล่องฟอร์มโปร่งแสง (Glassmorphism) */}
        <div className="flex justify-center md:justify-end">
          <div className="w-full max-w-md bg-white/20 backdrop-blur-xl border border-white/30 p-8 md:p-10 rounded-3xl shadow-2xl transition-all duration-500">
            
            {/* ✅ 4. ใช้ Ternary Operator สลับ UI ระหว่าง Step 1 กับ Step 2 */}
            {step === 1 ? (
              // ================= STEP 1: ฟอร์มสมัครสมาชิก (หน้าเดิมของคุณ) =================
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <UserPlus className="size-6" /> สมัครสมาชิก
                  </h2>
                  <p className="mt-1 text-sm text-slate-200 opacity-80">กรุณากรอกข้อมูลเพื่อขอเข้าใช้งานระบบ</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-100 ml-1">ชื่อ-นามสกุล</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 size-4 text-white/50 group-focus-within:text-white transition-colors" />
                      <Input 
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-11 focus:bg-white/20"
                        placeholder="กรุณากรอกชื่อ-นามสกุล"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-100 ml-1">อีเมล</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 size-4 text-white/50 group-focus-within:text-white transition-colors" />
                      <Input 
                        type="email"
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-11 focus:bg-white/20"
                        placeholder="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-100 ml-1 text-xs">รหัสผ่าน</Label>
                      <Input 
                        type="password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-11"
                        placeholder="••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-100 ml-1 text-xs">ยืนยันรหัสผ่าน</Label>
                      <Input 
                        type="password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-11"
                        placeholder="••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-[#1e3a5f] hover:bg-[#152a45] text-white shadow-lg h-12 text-lg font-bold rounded-xl mt-4">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2 size-5" />}
                    ลงทะเบียน
                  </Button>

                  <div className="text-center pt-2">
                    <button 
                      type="button"
                      onClick={() => router.push("/login")}
                      className="text-sm text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-2 w-full"
                    >
                      <ArrowLeft className="size-4" /> มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // ================= STEP 2: ฟอร์มกรอก OTP =================
              <div className="text-center space-y-6">
                <div className="mb-6 flex flex-col items-center">
                  <div className="p-4 bg-emerald-500/20 rounded-full mb-4">
                    <Mail className="size-10 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">ยืนยันอีเมลของคุณ</h2>
                  <p className="text-sm text-slate-300">
                  เราได้ส่งรหัส OTP 8 หลักไปที่<br />
                  <span className="font-bold text-emerald-300">{formData.email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <Input 
                    type="text"
                    maxLength={8}
                    className="bg-white/10 border-white/30 text-white text-center text-3xl tracking-[0.5em] font-mono rounded-2xl h-16 focus:bg-white/20"
                    placeholder="--------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // บังคับกรอกแค่ตัวเลข
                    required
                  />

                  <Button type="submit" disabled={isSubmitting || otp.length < 8} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg h-12 text-lg font-bold rounded-xl mt-2">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 size-5" />}
                    ยืนยันรหัส OTP
                  </Button>

                  <div className="text-center pt-4">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-slate-300 hover:text-white transition-colors"
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
      <div className="absolute bottom-0 w-full py-4 bg-slate-900/40 backdrop-blur-sm text-center border-t border-white/10">
        <p className="text-slate-300 text-[10px] md:text-xs">
          © 2024 กระทรวงมหาดไทย สงวนลิขสิทธิ์ | กระทรวงมหาดไทย ถนนอัษฎางค์ แขวงราชบพิธ เขตพระนคร กรุงเทพฯ 10200
        </p>
      </div>

    </div>
  )
}