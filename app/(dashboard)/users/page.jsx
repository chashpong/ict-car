"use client"

import { useState, useEffect } from "react"
import { 
  Users, ShieldCheck, UserCog, Search, 
  Pencil, Loader2, Mail, Building2, UserCheck, 
  Info, Filter
} from "lucide-react"
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
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editUser, setEditUser] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { 
    fetchUsers() 
  }, [])

  // ดึงข้อมูลสมาชิกทั้งหมดจากตาราง profiles
  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order('full_name', { ascending: true })
    
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  // ฟังก์ชันอัปเดต Role
  async function handleUpdateRole(newRole) {
    if (!editUser) return
    setIsSaving(true)

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", editUser.id)

    if (!error) {
      setUsers(users.map(u => u.id === editUser.id ? { ...u, role: newRole } : u))
      setEditUser(null)
      Swal.fire({ 
        icon: 'success', 
        title: 'อัปเดตสิทธิ์สำเร็จ', 
        text: `เปลี่ยนสิทธิ์ของคุณ ${editUser.full_name} เป็น ${getRoleLabel(newRole)} แล้ว`,
        timer: 2000, 
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
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8 font-sarabun text-black">
      
      {/* 1. Summary Cards ล้อตามหน้า Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="สมาชิกทั้งหมด" value={stats.total} icon={<Users className="text-blue-600" />} color="blue" />
        <StatCard title="ผู้ดูแลระบบ" value={stats.admins} icon={<ShieldCheck className="text-red-600" />} color="red" />
        <StatCard title="ผู้อนุมัติ" value={stats.approvers} icon={<UserCog className="text-purple-600" />} color="purple" />
        <StatCard title="พนักงานขับรถ" value={stats.drivers} icon={<UserCheck className="text-emerald-600" />} color="emerald" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">จัดการสมาชิกและสิทธิ์</h1>
        <p className="text-muted-foreground text-sm">ตรวจสอบรายชื่อและกำหนดบทบาทหน้าที่ของบุคลากรในระบบ</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardHeader className="bg-white border-b py-5 px-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="ค้นหาด้วยชื่อ หรือ อีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50 text-black focus:ring-blue-500"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b">
              <TableRow>
                <TableHead className="pl-8 py-4 font-bold text-slate-600 uppercase text-[12px]">ชื่อ-นามสกุล</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[12px]">อีเมล</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-[12px]">แผนก/ฝ่าย</TableHead>
                <TableHead className="text-center font-bold text-slate-600 uppercase text-[12px]">สิทธิ์ปัจจุบัน</TableHead>
                <TableHead className="pr-8 text-right font-bold text-slate-600 uppercase text-[12px]">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-slate-400">กำลังโหลดข้อมูลสมาชิก...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? (
                filtered.map(user => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                    <TableCell className="pl-8 font-bold text-slate-800">{user.full_name}</TableCell>
                    <TableCell className="text-slate-500 text-sm italic">{user.email}</TableCell>
                    <TableCell className="text-slate-500">{user.department || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`h-7 px-3 rounded-full border ${getRoleBadgeColor(user.role)} font-bold text-[10px]`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" 
                        onClick={() => setEditUser(user)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    <Info className="mx-auto size-6 mb-2 opacity-20" />
                    ไม่พบข้อมูลสมาชิกที่ค้นหา
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 2. Dialog แก้ไขสิทธิ์ (แก้ไข Syntax error ที่เจอ) */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if(!o) setEditUser(null); }}>
        <DialogContent className="sm:max-w-[420px] rounded-[2rem] border-none bg-white text-black shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-slate-900 text-white">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
               <UserCog className="size-6 text-blue-400" /> แก้ไขสิทธิ์ผู้ใช้งาน
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 space-y-6 font-sarabun">
            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {editUser?.full_name?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-slate-900 truncate">{editUser?.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{editUser?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-slate-700 ml-1">เลือกบทบาทหน้าที่ (Role)</Label>
              <Select 
                defaultValue={editUser?.role} 
                onValueChange={(v) => handleUpdateRole(v)}
                disabled={isSaving}
              >
                <SelectTrigger className="rounded-2xl h-14 border-slate-200 focus:ring-blue-500">
                  <SelectValue placeholder="เลือกสิทธิ์การใช้งาน" />
                </SelectTrigger>
                <SelectContent className="font-sarabun bg-white text-black border-slate-200">
                  <SelectItem value="admin" className="focus:bg-red-50 focus:text-red-600 font-bold">ผู้ดูแลระบบ (Admin)</SelectItem>
                  <SelectItem value="approver" className="focus:bg-purple-50 focus:text-purple-600 font-bold">ผู้อนุมัติ (Approver)</SelectItem>
                  <SelectItem value="driver" className="focus:bg-amber-50 focus:text-amber-600 font-bold">พนักงานขับรถ (Driver)</SelectItem>
                  <SelectItem value="user" className="focus:bg-blue-50 focus:text-blue-600 font-bold">ผู้ใช้งานทั่วไป (User)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-start gap-2 px-2 opacity-60">
                 <Info className="size-3 mt-1 shrink-0" />
                 <p className="text-[11px] leading-relaxed italic text-slate-500">
                   * การเปลี่ยนสิทธิ์จะมีผลทันทีต่อการเข้าถึงเมนูต่างๆ ในระบบหลังการล็อกอินครั้งถัดไป
                 </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full rounded-2xl h-12 border-slate-200 hover:bg-slate-50 font-bold text-slate-600" 
              onClick={() => setEditUser(null)}
            >
              ยกเลิกและปิดหน้าต่าง
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "border-l-blue-500",
    red: "border-l-red-500",
    purple: "border-l-purple-500",
    emerald: "border-l-emerald-500",
  }
  return (
    <Card className={`border-none border-l-4 ${colors[color]} shadow-sm bg-white rounded-2xl text-black hover:shadow-md transition-shadow`}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-slate-50">{icon}</div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}