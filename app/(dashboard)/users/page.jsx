"use client"

import { useState, useEffect } from "react"
import Image from "next/image" 
import { useAuth } from "@/lib/auth-context" 
import { cn } from "@/lib/utils" 
import { 
  Users, ShieldCheck, UserCog, Search, 
  Pencil, Loader2, Mail, Building2, UserCheck, 
  Info, CheckCircle2, UserCircle, Briefcase, RefreshCw 
} from "lucide-react"
import { PageHeader } from "@/components/page-header" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { getRoleLabel, getRoleBadgeColor } from "@/lib/auth-context"
import Swal from 'sweetalert2'

// ── StatCard: compact, 2x2 on mobile ──
function StatCard({ title, value, icon, color }) {
  const styles = {
    blue:    { bg: "bg-blue-50",    border: "border-blue-100"    },
    red:     { bg: "bg-red-50",     border: "border-red-100"     },
    purple:  { bg: "bg-purple-50",  border: "border-purple-100"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-100" },
  }
  return (
    <Card className={`border ${styles[color].border} shadow-sm bg-white/95 backdrop-blur-sm rounded-2xl text-black`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-3 rounded-xl ${styles[color].bg} shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-0.5 leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Mobile user card ──
function UserCard({ user: u, onEdit }) {
  const isInactive = u.status === 'inactive'
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
      {/* Avatar */}
      <div className="shrink-0 size-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        <UserCircle className="size-6" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm truncate">{u.full_name}</p>
        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge variant="outline" className={`h-5 px-2 rounded-full border text-[10px] font-bold ${getRoleBadgeColor(u.role)}`}>
            {getRoleLabel(u.role)}
          </Badge>
          {isInactive ? (
            <Badge variant="outline" className="h-5 px-2 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-[10px] font-bold">
              ระงับ
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 px-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px] font-bold">
              ปกติ
            </Badge>
          )}
          {u.department && (
            <span className="text-[10px] text-slate-400 font-medium">{u.department}</span>
          )}
        </div>
      </div>

      {/* Edit */}
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 shrink-0"
        onClick={() => onEdit({ ...u, status: u.status || 'active', role: u.role || 'user', department: u.department || '' })}>
        <Pencil className="size-4" />
      </Button>
    </div>
  )
}

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
    const { error } = await supabase.from("profiles").update({ 
      role: formData.role, department: formData.department, status: formData.status 
    }).eq("id", formData.id)
    if (!error) {
      if (user) {
        await supabase.from('audit_logs').insert([{
          user_id: user.id, user_name: currentUserProfile?.full_name || user.email,
          action: 'UPDATE', entity_type: 'profiles', entity_id: String(formData.id),
          old_data: { role: oldData?.role, department: oldData?.department, status: oldData?.status },
          new_data: { role: formData.role, department: formData.department, status: formData.status }
        }]);
      }
      loadAllData()
      setEditUser(null)
      Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลสำเร็จ', text: `แก้ไขข้อมูลของคุณ ${formData.full_name} เรียบร้อยแล้ว`, timer: 1500, showConfirmButton: false })
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
      <Image src="/images/image.png" alt="Background" fill priority className="object-cover z-0 opacity-40" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="จัดการสมาชิกและสิทธิ์" />
      </div>

      <div className="p-4 md:p-8 space-y-6 relative z-10">

        {/* ── Stats: 2x2 on mobile, 4 cols on desktop ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          <StatCard title="สมาชิกทั้งหมด"  value={stats.total}     icon={<Users className="size-5 text-blue-600" />}      color="blue"    />
          <StatCard title="ผู้ดูแลระบบ"     value={stats.admins}    icon={<ShieldCheck className="size-5 text-red-600" />}  color="red"     />
          <StatCard title="ผู้อนุมัติ"      value={stats.approvers} icon={<UserCog className="size-5 text-purple-600" />}   color="purple"  />
          <StatCard title="พนักงานขับรถ"    value={stats.drivers}   icon={<UserCheck className="size-5 text-emerald-600" />} color="emerald" />
        </div>

        {/* ── Page title ── */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">จัดการสมาชิกและสิทธิ์</h1>
            <Button variant="outline" size="icon" onClick={loadAllData} disabled={loading}
              className="h-8 w-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
          <p className="text-white/70 text-sm font-medium mt-0.5">ตรวจสอบรายชื่อและกำหนดบทบาทหน้าที่ของบุคลากรในระบบ</p>
        </div>

        {/* ── Main card ── */}
        <Card className="border-none shadow-sm overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl">
          {/* Search */}
          <div className="bg-white border-b border-slate-100 p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="ค้นหาด้วยชื่อ หรืออีเมล..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50 text-black focus-visible:ring-blue-500"
              />
            </div>
          </div>

          {/* ── Mobile: card list ── */}
          <div className="md:hidden p-3 space-y-2.5">
            {loading ? (
              <div className="py-16 flex flex-col items-center text-slate-400">
                <Loader2 className="animate-spin mb-2 text-blue-500 size-6" />
                <p className="text-sm font-semibold">กำลังโหลดข้อมูลสมาชิก...</p>
              </div>
            ) : filtered.length > 0 ? filtered.map(u => (
              <UserCard key={u.id} user={u} onEdit={setEditUser} />
            )) : (
              <div className="py-16 flex flex-col items-center text-slate-400">
                <Info className="size-8 mb-2 text-slate-300" />
                <p className="text-sm font-semibold">ไม่พบข้อมูลสมาชิกที่ค้นหา</p>
              </div>
            )}
          </div>

          {/* ── Desktop: table ── */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200/50">
                  <TableHead className="pl-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-widest">ชื่อ-นามสกุล</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[11px] tracking-widest">อีเมล</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[11px] tracking-widest">แผนก/ฝ่าย</TableHead>
                  <TableHead className="py-4 text-center font-bold text-slate-500 uppercase text-[11px] tracking-widest">สถานะ</TableHead>
                  <TableHead className="py-4 text-center font-bold text-slate-500 uppercase text-[11px] tracking-widest">สิทธิ์</TableHead>
                  <TableHead className="py-4 pr-6 text-right font-bold text-slate-500 uppercase text-[11px] tracking-widest">จัดการ</TableHead>
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
                ) : filtered.length > 0 ? filtered.map(u => (
                  <TableRow key={u.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                    <TableCell className="pl-6 py-4 font-bold text-slate-800">{u.full_name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{u.email}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{u.department || "-"}</TableCell>
                    <TableCell className="text-center">
                      {u.status === 'inactive' ? (
                        <Badge variant="outline" className="h-6 px-2.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 font-bold text-[10px]">
                          ระงับการใช้งาน
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="h-6 px-2.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                          <CheckCircle2 className="size-3 mr-1" /> ใช้งานปกติ
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`h-6 px-2.5 rounded-full border ${getRoleBadgeColor(u.role)} font-bold text-[10px]`}>
                        {getRoleLabel(u.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-100"
                        onClick={() => setEditUser({ ...u, status: u.status || 'active', role: u.role || 'user', department: u.department || '' })}>
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                      <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-3">
                        <Info className="size-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-500">ไม่พบข้อมูลสมาชิกที่ค้นหา</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if(!o) setEditUser(null); }}>
        <DialogContent className="sm:max-w-xl rounded-2xl sm:rounded-3xl border-none bg-white text-black shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-5 bg-[#0f172a] text-white">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserCog className="size-5 text-blue-400" /> แก้ไขข้อมูลสมาชิก
            </DialogTitle>
            <DialogDescription className="hidden">เปลี่ยนสิทธิ์การใช้งานและแก้ไขข้อมูลส่วนตัว</DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-5 font-sarabun bg-white">
            {/* Name + Email (readonly) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <UserCircle className="size-4" />
                <h3 className="font-bold text-sm">ข้อมูลบุคคลและบัญชี</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">ชื่อ-นามสกุล</Label>
                  <Input value={editUser?.full_name || ""} disabled className="rounded-xl h-11 bg-slate-100 text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">อีเมล (ล็อกอิน)</Label>
                  <Input value={editUser?.email || ""} disabled className="rounded-xl h-11 bg-slate-100 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Editable fields */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Briefcase className="size-4" />
                <h3 className="font-bold text-sm">สิทธิ์และการจัดการ</h3>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">แผนก / ฝ่ายสังกัด</Label>
                <Input
                  value={editUser?.department || ""}
                  onChange={(e) => setEditUser({...editUser, department: e.target.value})}
                  placeholder="เช่น กองคลัง, ช่าง, การเงิน"
                  className="rounded-xl h-11 border-slate-200 bg-white text-black focus-visible:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">บทบาทหน้าที่ (Role)</Label>
                  <Select value={editUser?.role || "user"} onValueChange={(v) => setEditUser({...editUser, role: v})}>
                    <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white text-black">
                      <SelectValue placeholder="เลือกสิทธิ์" />
                    </SelectTrigger>
                    <SelectContent className="font-sarabun bg-white text-black border-slate-200">
                      <SelectItem value="admin"    className="font-bold text-red-600    focus:bg-red-50">ผู้ดูแลระบบ (Admin)</SelectItem>
                      <SelectItem value="approver" className="font-bold text-purple-600 focus:bg-purple-50">ผู้อนุมัติ (Approver)</SelectItem>
                      <SelectItem value="driver"   className="font-bold text-emerald-600 focus:bg-emerald-50">พนักงานขับรถ (Driver)</SelectItem>
                      <SelectItem value="user"     className="font-bold text-blue-600   focus:bg-blue-50">ผู้ใช้งานทั่วไป (User)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">สถานะบัญชี</Label>
                  <Select value={editUser?.status || 'active'} onValueChange={(v) => setEditUser({...editUser, status: v})}>
                    <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white text-black">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent className="font-sarabun bg-white text-black border-slate-200">
                      <SelectItem value="active"   className="font-bold text-emerald-600 focus:bg-emerald-50">ใช้งานปกติ (Active)</SelectItem>
                      <SelectItem value="inactive" className="font-bold text-rose-600    focus:bg-rose-50">ระงับการใช้งาน (Inactive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                <Info className="size-3.5 mt-0.5 shrink-0 text-blue-500" />
                <p className="text-[11px] leading-relaxed text-slate-500">
                  การแก้ไขแผนกหรือสิทธิ์การใช้งาน จะมีผลทันทีหลังจากกดบันทึกข้อมูล
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="ghost" className="rounded-xl h-11 font-bold text-slate-500 hover:bg-slate-100"
                onClick={() => setEditUser(null)} disabled={isSaving}>
                ยกเลิก
              </Button>
              <Button className="rounded-xl h-11 px-7 bg-[#0f172a] hover:bg-slate-800 text-white font-bold shadow-md"
                onClick={() => handleUpdateProfile(editUser)} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}