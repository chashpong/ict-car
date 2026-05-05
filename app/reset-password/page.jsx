"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Shield, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Swal from 'sweetalert2'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      Swal.fire({ icon: 'error', title: 'รหัสผ่านไม่ตรงกัน' })
      return
    }

    setLoading(true)
    // 🔥 อัปเดตรหัสผ่านใหม่ผ่าน Supabase
    const { error } = await supabase.auth.updateUser({ password: password })
    setLoading(false)

    if (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message })
    } else {
      Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ', text: 'ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที' })
      router.push("/login")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sarabun p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 mb-6 mx-auto">
          <Lock className="size-7 text-[#1e3a5f]" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-900">กำหนดรหัสผ่านใหม่</h2>
        <p className="text-sm text-slate-500 text-center mt-2 mb-8">กรุณากรอกรหัสผ่านใหม่ที่ท่านต้องการใช้งาน</p>

        <form onSubmit={handleReset} className="space-y-5">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">รหัสผ่านใหม่</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 h-12 rounded-xl"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400">
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-700">ยืนยันรหัสผ่านใหม่</Label>
            <Input
              type="password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-[#1e3a5f] h-12 rounded-xl font-bold text-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            ยืนยันการเปลี่ยนรหัสผ่าน
          </Button>
        </form>
      </div>
    </div>
  )
}