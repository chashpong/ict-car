"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
// ✅ นำเข้าคอมโพเนนต์ฟอร์ม Login เดิมของคุณ
import { LoginForm } from "@/components/auth/login-form"
import { Badge } from "@/components/ui/badge"

// 🎨 ✨ ส่วนที่แก้ไขได้ง่าย: เปลี่ยนรูปภาพและโลโก้ตรงนี้
const ASSETS = {
  // ภาพพื้นหลังเต็มจอ (ดึงจากโฟลเดอร์ public/images/)
  bgImage: "/images/hello.jpg", 
  // ภาพโลโก้ตรากระทรวง
  logoImage: "/images/Thailand.png",
}

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 font-sarabun">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    // Container หลัก: แสดงภาพพื้นหลังเต็มหน้าจอ
    <div 
      className="min-h-screen relative flex items-center justify-center font-sarabun bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url('${ASSETS.bgImage}')` }}
    >
      
      {/* 🔴 ชั้นที่ 1: แผ่นสีไล่ระดับความโปร่งใส (Gradient Fade) */}
      {/* ฝั่งซ้ายจะมืด (สีน้ำเงินเข้ม) แล้วค่อยๆ จางหายไปทางขวา */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f]/80 to-transparent" />

      {/* 🔴 ชั้นที่ 2: กล่อง Content ตรงกลาง */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* 🔵 ฝั่งซ้าย: โลโก้และข้อความ */}
        <div className="flex flex-col justify-center text-white space-y-8 pr-0 md:pr-12">
          
          {/* โลโก้ในกรอบสี่เหลี่ยมขอบมน */}
          <div className="w-36 h-36 md:w-40 md:h-40 flex items-center justify-center p-2">
  <img 
    src={ASSETS.logoImage} 
    alt="MOI Logo" 
    className="w-full h-full object-contain"
  />
</div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight drop-shadow-md">
              ระบบบริหารจัดการ<br />ยานพาหนะราชการ
            </h1>
            <h2 className="text-xl md:text-2xl text-slate-200 font-medium">
              Government Vehicle Management System
            </h2>
          </div>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-lg font-light">
            ระบบบริหารจัดการยานพาหนะราชการ การอนุมัติจัดตารางยานพาหนะรายสัปดาห์ 
            บันทึกค่าใช้จ่ายและควบคุมการเบิกจ่ายงบประมาณของส่วนราชการ
          </p>
          
          {/* Badge แสดงฟีเจอร์ */}
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

        {/* ⚪ ฝั่งขวา: กล่องฟอร์มล็อกอินโปร่งแสง */}
        <div className="flex justify-center md:justify-end">
          {/* กรอบโปร่งแสง (Glassmorphism) เฉพาะรอบๆ ฟอร์ม */}
          <div className="w-full max-w-md bg-white/20 backdrop-blur-xl border border-white/30 p-8 md:p-10 rounded-3xl shadow-2xl">
            <LoginForm />
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