"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { UserCircle, Briefcase, Loader2, Save, Mail, ShieldCheck } from "lucide-react"
import Swal from 'sweetalert2'

export function UserProfileDialog({ open, onOpenChange }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({ full_name: "", department: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // โหลดข้อมูลโปรไฟล์ล่าสุดเมื่อเปิดหน้าต่าง
  useEffect(() => {
    if (open && user?.id) {
      loadProfile()
    }
  }, [open, user])

  async function loadProfile() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, department')
        .eq('id', user.id)
        .single()
        
      if (error) throw error
      if (data) {
        setFormData({
          full_name: data.full_name || "",
          department: data.department || ""
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    if (!formData.full_name.trim()) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาระบุชื่อ-นามสกุล' })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.full_name, 
          department: formData.department 
        })
        .eq('id', user.id)

      if (error) throw error

      // อัปเดตข้อมูลในระบบ Audit Logs เพื่อเก็บประวัติการแก้ไข
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        user_name: formData.full_name,
        action: 'UPDATE_PROFILE',
        entity_type: 'profiles',
        entity_id: String(user.id)
      }])

      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        onOpenChange(false);
        // ✅ เปลี่ยนจากการรีเฟรชหน้าเว็บ เป็นการเรียก router.refresh() 
        // หรือถ้าอยากให้ชื่อ Sidebar อัปเดตทันทีแบบนุ่มนวลที่สุด 
        // ให้ลองแค่ปิด Dialog เฉยๆ (Sidebar ควรจะดึงค่าจาก AuthContext ที่คุณเขียนไว้อยู่แล้ว)
        // หรือถ้าอยากบังคับให้มันเปลี่ยนจริงๆ ให้เพิ่ม router เข้าไปในไฟล์นี้แล้วใช้ router.refresh()
      })
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl sm:rounded-[2rem] border-none bg-white text-black shadow-2xl p-0 overflow-hidden font-sarabun">
        <DialogHeader className="p-6 bg-[#0f172a] text-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserCircle className="size-6 text-blue-400" /> ข้อมูลโปรไฟล์ส่วนตัว
          </DialogTitle>
          <DialogDescription className="hidden">ตั้งค่าและแก้ไขข้อมูลส่วนตัวของคุณ</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="size-8 animate-spin text-blue-500 mb-2" />
              <p className="text-slate-500 font-bold">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              {/* ข้อมูลบัญชี (อ่านอย่างเดียว) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">อีเมลบัญชี</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="size-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">สิทธิ์การใช้งาน</span>
                  </div>
                  <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 font-bold px-3">
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                     user?.role === 'reviewer' ? 'ผู้ตรวจสอบ' : 
                     user?.role === 'approver' ? 'ผู้อนุมัติ' : 
                     user?.role === 'driver' ? 'พนักงานขับรถ' : 'ผู้ใช้งานทั่วไป'}
                  </Badge>
                </div>
              </div>

              {/* ฟอร์มแก้ไขข้อมูล */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <UserCircle className="size-3.5" /> ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="rounded-xl h-12 bg-white border-slate-200 focus-visible:ring-blue-500 font-bold text-slate-800"
                    placeholder="ระบุชื่อ-นามสกุลของคุณ"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="size-3.5" /> แผนก / ฝ่ายสังกัด
                  </Label>
                  <Input 
                    value={formData.department} 
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="rounded-xl h-12 bg-white border-slate-200 focus-visible:ring-blue-500 font-bold text-slate-800"
                    placeholder="เช่น กองคลัง, สำนักปลัด, IT"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl h-11 px-6 font-bold text-slate-500 hover:bg-slate-100">
                  ยกเลิก
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="rounded-xl h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-transform hover:scale-[1.02]">
                  {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  <Save className="mr-2 size-4" /> บันทึกโปรไฟล์
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}