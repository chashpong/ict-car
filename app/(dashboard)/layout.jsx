"use client"

import { useEffect, useState } from "react" // ✅ 1. เพิ่ม useState
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/lib/auth-context"

export default function DashboardLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false) // ✅ 2. สร้าง State isMounted

  // ✅ 3. ให้ useEffect สั่งให้ isMounted เป็น true เมื่อระบบเรนเดอร์ฝั่ง Client เสร็จแล้ว
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // เช็คเรื่องการเปลี่ยนหน้าเฉพาะตอนที่หน้าเว็บประกอบร่างเสร็จแล้ว (isMounted = true)
    if (isMounted && !isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router, isMounted])

  // ✅ 4. ดัก if (!isMounted) เพื่อให้ฝั่ง Server และ Client วาดหน้าจอ Loading ออกมาตรงกันเป๊ะในจังหวะแรก
  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-sarabun">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">กำลังเข้าสู่ระบบ...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}