"use client"

import { useState, useEffect } from "react"
import { 
  Plus, Search, Pencil, Trash2, Loader2, 
  UserCheck, Users, Car, UserMinus, Info, Link as LinkIcon,
  UserCircle, CreditCard, Settings, AlertCircle, AlertTriangle // ✅ เพิ่มไอคอนแจ้งเตือน
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
  DialogTrigger,
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
import Swal from 'sweetalert2'

// แผนผังสถานะแบบมีจุดสี (Status Dots)
const statusMap = {
  available: { 
    label: "ว่าง / พร้อมทำงาน", 
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500"
  },
  busy: { 
    label: "กำลังปฏิบัติงาน", 
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500"
  },
  inactive: { 
    label: "หยุดงาน", 
    className: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500"
  }
}

// ฟังก์ชันช่วยแปลงวันที่เป็นแบบไทย (พ.ศ.)
const formatThaiDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

// ✅ ฟังก์ชันเช็คสถานะวันหมดอายุใบขับขี่
const checkExpiryStatus = (dateString) => {
  if (!dateString) return { status: 'none', label: '-', color: 'text-slate-500' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(dateString);
  
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', label: 'หมดอายุแล้ว', color: 'text-rose-600', bg: 'bg-rose-100', icon: <AlertCircle className="size-3 mr-1" /> };
  } else if (diffDays <= 30) {
    return { status: 'expiring_soon', label: `เหลือ ${diffDays} วัน`, color: 'text-amber-600', bg: 'bg-amber-100', icon: <AlertTriangle className="size-3 mr-1" /> };
  } else {
    return { status: 'valid', label: '', color: 'text-slate-500', bg: '', icon: null };
  }
};

function DriverForm({ driver, users, onClose, onSave }) {
  const [form, setForm] = useState({
    name: driver?.name || "",
    phone: driver?.phone || "",
    license_number: driver?.license_number || "",
    license_type: driver?.license_type || "", 
    license_expiry: driver?.license_expiry || "", 
    status: driver?.status || "available",
    user_id: driver?.user_id || "none" 
  })
  const [isSaving, setIsSaving] = useState(false)

  return (
    <div className="space-y-6 py-2 font-sarabun text-black h-full max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
      
      {/* --- ส่วนที่ 1: ข้อมูลบุคคล --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 mb-2">
          <UserCircle className="size-5" />
          <h3 className="font-bold text-base">ข้อมูลบุคคล</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-600">ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="นายขับ ดีมาก"
              className="rounded-xl h-11 text-black"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-slate-600">เบอร์โทรศัพท์</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="081-234-5678"
              className="rounded-xl h-11 text-black"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-dashed border-slate-200" />

      {/* --- ส่วนที่ 2: ข้อมูลใบขับขี่ --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 mb-2">
          <CreditCard className="size-5" />
          <h3 className="font-bold text-base">ข้อมูลใบขับขี่</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-600">เลขที่ใบขับขี่</Label>
            <Input
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              placeholder="1-1234-56789-01-2"
              className="rounded-xl h-11 text-black"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-slate-600">ประเภทใบขับขี่</Label>
            <Input
              value={form.license_type}
              onChange={(e) => setForm({ ...form, license_type: e.target.value })}
              placeholder="รถยนต์ส่วนบุคคล"
              className="rounded-xl h-11 text-black"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-600">วันหมดอายุ</Label>
            <Input
              type="date"
              value={form.license_expiry}
              onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
              className="rounded-xl h-11 text-black"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-dashed border-slate-200" />

      {/* --- ส่วนที่ 3: การใช้งานระบบ --- */}
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-2 text-emerald-600 mb-2">
          <Settings className="size-5" />
          <h3 className="font-bold text-base">การใช้งานระบบ</h3>
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-slate-600">สถานะการทำงาน</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="rounded-xl h-11 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-sarabun bg-white text-black border-slate-200">
              <SelectItem value="available">ว่าง / พร้อมทำงาน</SelectItem>
              <SelectItem value="busy">กำลังปฏิบัติงาน (กำลังขับ)</SelectItem>
              <SelectItem value="inactive">หยุดงาน / ลางาน</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
          <Label className="font-bold flex items-center gap-2 text-blue-800">
            <LinkIcon className="size-4" /> ผูกกับบัญชีผู้ใช้งาน (User Account)
          </Label>
          <p className="text-[11px] text-blue-600/80 mb-2">เพื่อให้ระบบรู้ว่าคนขับคนนี้คือใครตอนล็อกอินเข้าแอป</p>
          <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
            <SelectTrigger className="rounded-xl h-11 text-black bg-white border-blue-200">
              <SelectValue placeholder="-- ไม่ผูกบัญชี --" />
            </SelectTrigger>
            <SelectContent className="font-sarabun bg-white text-black border-slate-200">
              <SelectItem value="none">-- ไม่ผูกบัญชี --</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.name || 'ไม่ระบุชื่อ'} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl text-slate-500 font-bold">ยกเลิก</Button>
        <Button 
          onClick={async () => {
            if(!form.name) {
              Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อ', text: 'ชื่อ-นามสกุล คนขับเป็นข้อมูลบังคับ', confirmButtonColor: '#0f172a' });
              return;
            }
            setIsSaving(true)
            const payload = { 
              ...form, 
              user_id: form.user_id === "none" ? null : form.user_id 
            }
            await onSave(payload)
            setIsSaving(false)
          }} 
          disabled={isSaving}
          className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold px-8 rounded-xl shadow-lg"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          บันทึกข้อมูล
        </Button>
      </div>
    </div>
  )
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState([])
  const [users, setUsers] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDriver, setEditDriver] = useState(null)

  useEffect(() => { 
    fetchDrivers()
    fetchUsers() 
  }, [])

  async function fetchDrivers() {
    setLoading(true)
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order('created_at', { ascending: false })
    
    if (!error) setDrivers(data || [])
    setLoading(false)
  }

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("profiles") 
      .select("id, full_name, email") 
    
    if (!error) setUsers(data || [])
  }

  async function saveDriver(data) {
    if (editDriver) {
      await supabase.from("drivers").update(data).eq("id", editDriver.id)
    } else {
      await supabase.from("drivers").insert([data])
    }
    fetchDrivers()
    setDialogOpen(false)
    setEditDriver(null)
    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false })
  }

  async function handleDelete(id) {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "ต้องการลบข้อมูลคนขับรายนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    })

    if (result.isConfirmed) {
      const { error } = await supabase.from("drivers").delete().eq("id", id)
      if (!error) fetchDrivers()
    }
  }

  const filtered = drivers.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: drivers.length,
    available: drivers.filter(d => d.status === "available").length,
    busy: drivers.filter(d => d.status === "busy").length,
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sarabun text-black">
      <PageHeader title="จัดการคนขับรถ" />

      <div className="p-4 md:p-8 space-y-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title="คนขับทั้งหมด" value={stats.total} icon={<Users className="size-6 text-blue-600" />} color="blue" />
          <StatCard title="คนขับที่ว่าง" value={stats.available} icon={<UserCheck className="size-6 text-emerald-600" />} color="emerald" />
          <StatCard title="กำลังปฏิบัติงาน" value={stats.busy} icon={<Car className="size-6 text-amber-600" />} color="amber" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">จัดการคนขับรถ</h1>
            <p className="text-muted-foreground mt-1 font-medium">รายชื่อและสถานะความพร้อมของพนักงานขับรถ</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditDriver(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#0f172a] hover:bg-slate-800 shadow-md h-12 px-6 text-white font-bold rounded-2xl transition-transform hover:scale-[1.02]">
                <Plus className="mr-2 size-5" />เพิ่มคนขับใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-[2rem] border-none shadow-2xl bg-white text-black p-0 overflow-hidden">
              <DialogHeader className="p-6 bg-[#0f172a] text-white">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {editDriver ? <Pencil className="size-5" /> : <Plus className="size-5" />}
                  {editDriver ? "แก้ไขข้อมูลคนขับ" : "ลงทะเบียนคนขับใหม่"}
                </DialogTitle>
                <DialogDescription className="hidden">
                  แบบฟอร์มเพิ่มหรือแก้ไขข้อมูลคนขับรถในระบบ
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6 pt-2 bg-slate-50/30">
                <DriverForm driver={editDriver} users={users} onClose={() => setDialogOpen(false)} onSave={saveDriver} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
          <CardHeader className="bg-white border-b py-5 px-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="ค้นหาชื่อคนขับ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 text-black"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest pl-8 py-5">ชื่อ-นามสกุล</TableHead>
                  <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest py-5 text-center">เบอร์โทรศัพท์</TableHead>
                  <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest py-5 text-center">เลขใบขับขี่</TableHead>
                  <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest py-5 text-center">วันหมดอายุ</TableHead>
                  <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-widest py-5 text-center">สถานะ</TableHead>
                  <TableHead className="w-[150px] pr-8 text-right font-bold text-slate-500 text-[11px] uppercase tracking-widest py-5">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2 text-blue-600" />กำลังโหลดข้อมูล...</TableCell></TableRow>
                ) : filtered.length > 0 ? filtered.map(driver => {
                  const status = statusMap[driver.status] || statusMap.inactive
                  const expiryInfo = checkExpiryStatus(driver.license_expiry) // ✅ ดึงข้อมูลสถานะวันหมดอายุ

                  return (
                    <TableRow key={driver.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 text-black">
                      <TableCell className="pl-8 py-4">
                        <p className="font-bold text-slate-900 text-[15px]">{driver.name}</p>
                        {driver.user_id && (
                          <p className="text-[11px] text-blue-600 font-bold flex items-center mt-1 bg-blue-50 w-fit px-2 py-0.5 rounded-full">
                            <LinkIcon className="size-3 mr-1" /> ผูกบัญชีแล้ว
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-600">{driver.phone || "-"}</TableCell>
                      
                      <TableCell className="text-center">
                        <p className="font-mono font-bold text-slate-600 text-xs">{driver.license_number || "-"}</p>
                        {driver.license_type && (
                          <p className="text-[10px] text-slate-400 mt-1">{driver.license_type}</p>
                        )}
                      </TableCell>

                      {/* ✅ แสดงวันหมดอายุพร้อมแจ้งเตือน */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`font-bold text-xs ${expiryInfo.color}`}>
                            {formatThaiDate(driver.license_expiry)}
                          </span>
                          {/* ถ้าหมดอายุหรือใกล้หมดอายุ ให้แสดง Badge แจ้งเตือนข้างใต้ */}
                          {expiryInfo.status !== 'valid' && expiryInfo.status !== 'none' && (
                            <span className={`text-[9px] font-bold ${expiryInfo.color} ${expiryInfo.bg} px-1.5 py-0.5 rounded mt-1 flex items-center`}>
                              {expiryInfo.icon} {expiryInfo.label}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className={`h-7 px-3 rounded-full border ${status.className} font-bold text-[11px] shadow-sm`}>
                          <span className={`size-1.5 rounded-full mr-2 ${status.dot}`} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => { setEditDriver(driver); setDialogOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleDelete(driver.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                      <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-3">
                        <Info className="size-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-400">ไม่พบรายชื่อคนขับรถในระบบ</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const styles = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  }
  return (
    <Card className={`border ${styles[color].border} shadow-sm bg-white rounded-[2rem] text-black overflow-hidden hover:shadow-md transition-shadow`}>
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