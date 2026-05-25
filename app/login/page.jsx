"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { Badge } from "@/components/ui/badge"

const ASSETS = {
  bgImage: "/images/image.png",
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
      <div className="flex min-h-screen items-center justify-center bg-slate-900 font-sarabun">
        <div className="size-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col font-sarabun overflow-hidden bg-slate-900">

      {/* Background */}
      <Image src={ASSETS.bgImage} alt="Background" fill priority className="object-cover z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1e3a5f]/90 via-[#1e3a5f]/80 to-slate-900/95 z-0 md:bg-gradient-to-r" />

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-5 py-10 md:px-8 md:py-0 gap-8 md:gap-12">

        {/* ── Left: Branding ── */}
        <div className="flex flex-col items-center md:items-start text-white text-center md:text-left w-full md:flex-1 md:pr-8 gap-5">

          {/* Logo */}
          <div className="relative size-24 md:size-36 shrink-0">
            <Image
              src={ASSETS.logoImage}
              alt="Logo"
              fill
              priority
              className="object-contain drop-shadow-xl"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight drop-shadow-md">
              ระบบบริหารจัดการ<br />ยานพาหนะราชการ
            </h1>
            <h2 className="text-base md:text-2xl text-slate-200 font-medium drop-shadow-sm">
              Government Vehicle Management System
            </h2>
          </div>

          {/* Description — hidden on mobile to save space */}
          <p className="hidden md:block text-sm text-slate-300 leading-relaxed max-w-lg font-light drop-shadow-sm">
            ระบบบริหารจัดการยานพาหนะราชการ การอนุมัติจัดตารางยานพาหนะรายสัปดาห์
            บันทึกค่าใช้จ่ายและควบคุมการเบิกจ่ายงบประมาณของส่วนราชการ
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {["การจองรถ", "การอนุมัติ", "บันทึกเดินทาง", "ซ่อมบำรุง", "รายงาน"].map((feature) => (
              <Badge
                key={feature}
                variant="outline"
                className="border-white/30 text-white bg-white/10 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
              >
                {feature}
              </Badge>
            ))}
          </div>

          <p className="hidden md:block text-slate-500 text-xs font-medium tracking-wider">เวอร์ชัน 1.0.0</p>
        </div>

        {/* ── Right: Login form ── */}
        <div className="w-full md:w-auto md:min-w-[400px] md:max-w-md">
          <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 p-7 md:p-10 rounded-3xl shadow-2xl">
            <LoginForm />
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