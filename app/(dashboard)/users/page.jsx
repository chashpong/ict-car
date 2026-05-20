"use client"

import { useState, useEffect } from "react"
import Image from "next/image" 
import { useAuth } from "@/lib/auth-context" 
import { cn } from "@/lib/utils" 
import { 
  Users, ShieldCheck, UserCog, Search, 
  Pencil, Loader2, Mail, Building2, UserCheck, 
  Info, Filter, CheckCircle2, UserCircle, Briefcase, RefreshCw 
} from "lucide-react"
import { PageHeader } from "@/components/page-header" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { getRoleLabel, getRoleBadgeColor } from "@/lib/auth-context"
import Swal from 'sweetalert2'

export default function UsersManagementPage() {
  const { user } = useAuth() 
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editUser, setEditUser] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { 
    if(user) loadAllData() 
  }, [user])

  async function loadAllData() {
    setLoading(true);
    try {
      const promises = [
        supabase.from("profiles").select("*").order('full_name', { ascending: true })
      ];
      
      if (user?.id && !currentUserProfile) {
        promises.push(supabase.from('profiles').select('*').eq('id', user.id).single());
      }

      const results = await Promise.all(promises);
      
      if (results[0].data) setUsers(results[0].data);
      if (results[1]?.data) setCurrentUserProfile(results[1].data);

    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(formData) {
    setIsSaving(true)

    const oldData = users.find(u => u.id === formData.id)

    const { error } = await supabase
      .from("profiles")
      .update({ 
        role: formData.role,
        department: formData.department,
        status: formData.status 
      })
      .eq("id", formData.id)

    if (!error) {
      if (user) {
        await supabase.from('audit_logs').insert([{
          user_id: user.id,
          user_name: currentUserProfile?.full_name || user.email,
          action: 'UPDATE',
          entity_type: 'profiles',
          entity_id: String(formData.id),
          old_data: { 
            role: oldData?.role, 
            department: oldData?.department, 
            status: oldData?.status 
          },
          new_data: { 
            role: formData.role, 
            department: formData.department, 
            status: formData.status 
          }
        }]);
      }

      loadAllData() // ดึงข้อมูลใหม่หลังแก้เสร็จ
      setEditUser(null)
      Swal.fire({ 
        icon: 'success', 
        title: 'อัปเดตข้อมูลสำเร็จ', 
        text: `แก้ไขข้อมูลของคุณ ${formData.full_name} เรียบร้อยแล้ว`,
        timer: 1500, 
        showConfirmButton: false 
      })
    } else {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message })
    }
    setIsSaving(false)
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    approvers: users.filter(u => u.role === "approver").length,
    drivers: users.filter(u => u.role === "driver").length,
  }

  return (
    <div className="min-h-screen font-sarabun text-black relative bg-slate-900">
      
      <Image 
        src="/images/image.png" 
        alt="Background" 
        fill 
        priority 
        className="object-cover z-0 opacity-40" 
      />
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="จัดการสมาชิกและสิทธิ์" />
      </div>

      <div className="p-4 md:p-8 space-y-8 relative z-10">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="สมาชิกทั้งหมด" value={stats.total} icon={<Users className="size-6 text-blue-600" />} color="blue" />
          <StatCard title="ผู้ดูแลระบบ" value={stats.admins} icon={<ShieldCheck className="size-6 text-red-600" />} color="red" />
          <StatCard title="ผู้อนุมัติ" value={stats.approvers} icon={<UserCog className="size-6 text-purple-600" />} color="purple" />
          <StatCard title="พนักงานขับรถ" value={stats.drivers} icon={<UserCheck className="size-6 text-emerald-600" />} color="emerald" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">จัดการสมาชิกและสิทธิ์</h1>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={loadAllData} 
                disabled={loading}
                className="h-8 w-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm"
                title="รีเฟรชข้อมูลสมาชิก"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
            </div>
            <p className="text-white/90 text-sm mt-1 font-medium drop-shadow-sm">ตรวจสอบรายชื่อและกำหนดบทบาทหน้าที่ของบุคลากรในระบบ</p>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white/95 backdrop-blur-sm rounded-[2rem]">
          <CardHeader className="bg-white/80 border-b py-5 px-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="ค้นหาด้วยชื่อ หรือ อีเมล..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-none shadow-sm bg-slate-50 text-black focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200/50">
                  <TableHead className="pl-8 py-5 font-bold text-slate-500 uppercase text-[11px] tracking-widest">ชื่อ-นามสกุล</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">อีเมล</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">แผนก/ฝ่าย</TableHead>
                  <TableHead className="text-center font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">สถานะบัญชี</TableHead>
                  <TableHead className="text-center font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">สิทธิ์ปัจจุบัน</TableHead>
                  <TableHead className="pr-8 text-right font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <Loader2 className="animate-spin mx-auto mb-2 text-blue-600 size-6" />
                      <p className="text-slate-500 font-bold mt-2">กำลังโหลดข้อมูลสมาชิก...</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? (
                  filtered.map(user => (
                    <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                      <TableCell className="pl-8 py-4 font-bold text-slate-800">{user.full_name}</TableCell>
                      <TableCell className="text-slate-500 text-sm italic">{user.email}</TableCell>
                      <TableCell className="text-slate-600 font-medium">{user.department || "-"}</TableCell>
                      <TableCell className="text-center">
                        {user.status === 'inactive' ? (
                           <Badge variant="outline" className="h-7 px-3 rounded-full border border-rose-200 bg-rose-50 text-rose-600 font-bold text-[10px] shadow-sm">
                             ระงับการใช้งาน
                           </Badge>
                        ) : (
                           <Badge variant="outline" className="h-7 px-3 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 font-bold text-[10px] shadow-sm">
                             <CheckCircle2 className="size-3 mr-1" /> ใช้งานปกติ
                           </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`h-7 px-3 rounded-full border ${getRoleBadgeColor(user.role)} font-bold text-[10px] shadow-sm`}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all" 
                          // ✅ แก้ไขตรงนี้: ดักค่าว่าง ป้องกันการเปลี่ยนจาก Uncontrolled เป็น Controlled
                          onClick={() => setEditUser({
                            ...user, 
                            status: user.status || 'active',
                            role: user.role || 'user',
                            department: user.department || ''
                          })} 
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                      <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-3">
                        <Info className="size-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-500 text-base">ไม่พบข้อมูลสมาชิกที่ค้นหา</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!editUser} onOpenChange={(o) => { if(!o) setEditUser(null); }}>
          <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none bg-white text-black shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-[#0f172a] text-white">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                 <UserCog className="size-6 text-blue-400" /> แก้ไขข้อมูลสมาชิก
              </DialogTitle>
              <DialogDescription className="hidden">
                เปลี่ยนสิทธิ์การใช้งานและแก้ไขข้อมูลส่วนตัวสำหรับสมาชิกในระบบ
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6 font-sarabun bg-slate-50/30">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <UserCircle className="size-5" />
                  <h3 className="font-bold text-base">ข้อมูลบุคคลและบัญชี</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-600">ชื่อ-นามสกุล</Label>
                    <Input value={editUser?.full_name || ""} disabled className="rounded-xl h-11 bg-slate-100 text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-600">อีเมล (ล็อกอิน)</Label>
                    <Input value={editUser?.email || ""} disabled className="rounded-xl h-11 bg-slate-100 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-200" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Briefcase className="size-5" />
                  <h3 className="font-bold text-base">สิทธิ์และการจัดการ</h3>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-slate-600">แผนก / ฝ่ายสังกัด</Label>
                  <Input 
                    value={editUser?.department || ""} 
                    onChange={(e) => setEditUser({...editUser, department: e.target.value})}
                    placeholder="เช่น กองคลัง, ช่าง, การเงิน" 
                    className="rounded-xl h-11 border-slate-200 focus:ring-blue-500 bg-white text-black" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-600">บทบาทหน้าที่ (Role)</Label>
                    <Select 
                      value={editUser?.role || "user"} // ✅ ดักค่าว่างซ้ำอีกชั้นใน Select
                      onValueChange={(v) => setEditUser({...editUser, role: v})}
                    >
                      <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white text-black">
                        <SelectValue placeholder="เลือกสิทธิ์การใช้งาน" />
                      </SelectTrigger>
                      <SelectContent className="font-sarabun bg-white text-black border-slate-200">
                        <SelectItem value="admin" className="font-bold text-red-600 focus:bg-red-50 focus:text-red-700">ผู้ดูแลระบบ (Admin)</SelectItem>
                        <SelectItem value="approver" className="font-bold text-purple-600 focus:bg-purple-50 focus:text-purple-700">ผู้อนุมัติ (Approver)</SelectItem>
                        <SelectItem value="driver" className="font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">พนักงานขับรถ (Driver)</SelectItem>
                        <SelectItem value="user" className="font-bold text-blue-600 focus:bg-blue-50 focus:text-blue-700">ผู้ใช้งานทั่วไป (User)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-600">สถานะบัญชี</Label>
                    <Select 
                      value={editUser?.status || 'active'} 
                      onValueChange={(v) => setEditUser({...editUser, status: v})}
                    >
                      <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white text-black">
                        <SelectValue placeholder="เลือกสถานะบัญชี" />
                      </SelectTrigger>
                      <SelectContent className="font-sarabun bg-white text-black border-slate-200">
                        <SelectItem value="active" className="font-bold text-emerald-600">ใช้งานปกติ (Active)</SelectItem>
                        <SelectItem value="inactive" className="font-bold text-rose-600">ระงับการใช้งาน (Inactive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 opacity-70 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                   <Info className="size-4 mt-0.5 shrink-0 text-blue-500" />
                   <p className="text-[11px] leading-relaxed font-medium text-slate-600">
                     การแก้ไขแผนกหรือสิทธิ์การใช้งาน จะมีผลทันทีหลังจากกดบันทึกข้อมูล
                   </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  variant="ghost" 
                  className="rounded-xl h-11 font-bold text-slate-500 hover:bg-slate-100" 
                  onClick={() => setEditUser(null)}
                  disabled={isSaving}
                >
                  ยกเลิก
                </Button>
                <Button 
                  className="rounded-xl h-11 px-8 bg-[#0f172a] hover:bg-slate-800 text-white font-bold shadow-lg"
                  onClick={() => handleUpdateProfile(editUser)}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  บันทึกข้อมูล
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const styles = {
    blue: { bg: "bg-blue-50", border: "border-blue-200" },
    red: { bg: "bg-red-50", border: "border-red-200" },
    purple: { bg: "bg-purple-50", border: "border-purple-200" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200" },
  }
  return (
    <Card className={`border ${styles[color].border} shadow-sm bg-white/95 backdrop-blur-sm rounded-[2rem] text-black hover:shadow-md transition-shadow`}>
      <CardContent className="p-6 flex items-center gap-5">
        <div className={`p-4 rounded-[1rem] ${styles[color].bg}`}>
          {icon}
        </div>
        <div>
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-extrabold text-slate-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}