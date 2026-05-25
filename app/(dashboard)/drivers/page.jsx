"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { 
  Plus, Search, Pencil, Trash2, Loader2, 
  UserCheck, Users, Car, UserMinus, Info, Link as LinkIcon,
  UserCircle, CreditCard, Settings, AlertCircle, AlertTriangle, RefreshCw
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription 
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context" 
import { cn } from "@/lib/utils"
import Swal from 'sweetalert2'

const statusMap = {
  available: { label: "ว่าง / พร้อมทำงาน", className: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  busy:      { label: "กำลังปฏิบัติงาน",   className: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500"   },
  inactive:  { label: "หยุดงาน",           className: "bg-slate-50 text-slate-700 border-slate-200",    dot: "bg-slate-400"   },
}

const formatThaiDate = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
};

const checkExpiryStatus = (dateString) => {
  if (!dateString) return { status: 'none', label: '-', color: 'text-slate-500' };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((new Date(dateString) - today) / 86400000);
  if (diffDays < 0)  return { status: 'expired',       label: 'หมดอายุแล้ว',     color: 'text-rose-600',  bg: 'bg-rose-50',  border: 'border-rose-200',  icon: <AlertCircle className="size-3 mr-1" /> };
  if (diffDays <= 30) return { status: 'expiring_soon', label: `เหลือ ${diffDays} วัน`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle className="size-3 mr-1" /> };
  return { status: 'valid', label: '', color: 'text-slate-500', bg: '', icon: null };
};

// ── StatCard: compact 2-col on mobile ──
function StatCard({ title, value, icon, color }) {
  const styles = {
    blue:    { bg: "bg-blue-50",    border: "border-blue-100"    },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-100" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-100"   },
  }
  return (
    <Card className={`border ${styles[color].border} shadow-sm bg-white/95 backdrop-blur-sm rounded-2xl text-black`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-3 rounded-xl ${styles[color].bg} shrink-0`}>{icon}</div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-0.5 leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Driver form ──
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
    <div className="space-y-5 py-2 font-sarabun text-black overflow-y-auto max-h-[70vh] px-1">

      {/* Personal info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <UserCircle className="size-4" />
          <h3 className="font-bold text-sm">ข้อมูลบุคคล</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="นายขับ ดีมาก" className="rounded-xl h-11 text-black" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">เบอร์โทรศัพท์</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="081-234-5678" className="rounded-xl h-11 text-black" />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* License info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <CreditCard className="size-4" />
          <h3 className="font-bold text-sm">ข้อมูลใบขับขี่</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">เลขที่ใบขับขี่</Label>
            <Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              placeholder="1-1234-56789-01-2" className="rounded-xl h-11 text-black" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">ประเภทใบขับขี่</Label>
            <Input value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })}
              placeholder="รถยนต์ส่วนบุคคล" className="rounded-xl h-11 text-black" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">วันหมดอายุ</Label>
            <Input type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
              className="rounded-xl h-11 text-black" />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* System settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Settings className="size-4" />
          <h3 className="font-bold text-sm">การใช้งานระบบ</h3>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500">สถานะการทำงาน</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="rounded-xl h-11 text-black"><SelectValue /></SelectTrigger>
            <SelectContent className="font-sarabun bg-white text-black border-slate-200">
              <SelectItem value="available">ว่าง / พร้อมทำงาน</SelectItem>
              <SelectItem value="busy">กำลังปฏิบัติงาน</SelectItem>
              <SelectItem value="inactive">หยุดงาน / ลางาน</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
          <Label className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
            <LinkIcon className="size-3.5" /> ผูกกับบัญชีผู้ใช้งาน
          </Label>
          <p className="text-[11px] text-blue-500">เพื่อให้ระบบรู้ว่าคนขับคนนี้คือใครตอนล็อกอิน</p>
          <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
            <SelectTrigger className="rounded-xl h-11 text-black bg-white border-blue-200"><SelectValue placeholder="-- ไม่ผูกบัญชี --" /></SelectTrigger>
            <SelectContent className="font-sarabun bg-white text-black border-slate-200">
              <SelectItem value="none">-- ไม่ผูกบัญชี --</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.full_name || 'ไม่ระบุชื่อ'} ({u.email})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl text-slate-500 font-bold">ยกเลิก</Button>
        <Button
          onClick={async () => {
            if (!form.name) { Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อ', confirmButtonColor: '#0f172a' }); return; }
            setIsSaving(true)
            await onSave({ ...form, user_id: form.user_id === "none" ? null : form.user_id })
            setIsSaving(false)
          }}
          disabled={isSaving}
          className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold px-7 rounded-xl shadow-md"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกข้อมูล
        </Button>
      </div>
    </div>
  )
}

// ── Mobile driver card ──
function DriverCard({ driver, onEdit, onDelete }) {
  const status = statusMap[driver.status] || statusMap.inactive
  const expiry = checkExpiryStatus(driver.license_expiry)
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3">
      {/* Avatar */}
      <div className="shrink-0 size-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mt-0.5">
        <UserCircle className="size-6" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-slate-900 text-sm">{driver.name}</p>
          {driver.user_id && (
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-0.5">
              <LinkIcon className="size-2.5" /> ผูกบัญชีแล้ว
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">{driver.phone || "ไม่ระบุเบอร์"}</p>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className={`h-5 px-2 rounded-full border text-[10px] font-bold ${status.className}`}>
            <span className={`size-1.5 rounded-full mr-1 ${status.dot}`} /> {status.label}
          </Badge>
          {/* License expiry warning */}
          {expiry.status !== 'valid' && expiry.status !== 'none' && (
            <span className={`text-[10px] font-bold ${expiry.color} ${expiry.bg} ${expiry.border} border px-1.5 py-0.5 rounded-full flex items-center`}>
              {expiry.icon} {expiry.label}
            </span>
          )}
        </div>

        {driver.license_expiry && (
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            ใบขับขี่หมด: {formatThaiDate(driver.license_expiry)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          onClick={() => onEdit(driver)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(driver.id)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default function DriversPage() {
  const { user } = useAuth() 
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDriver, setEditDriver] = useState(null)

  useEffect(() => { if(user) loadAllData() }, [user])

  async function loadAllData() {
    setLoading(true);
    try {
      const promises = [
        supabase.from("drivers").select("*").order('created_at', { ascending: false }),
        supabase.from("profiles").select("id, full_name, email")
      ];
      if (user?.id && !currentUserProfile) {
        promises.push(supabase.from('profiles').select('*').eq('id', user.id).single());
      }
      const results = await Promise.all(promises);
      if (results[0].data) setDrivers(results[0].data);
      if (results[1].data) setUsers(results[1].data);
      if (results[2]?.data) setCurrentUserProfile(results[2].data);
    } catch (error) { console.error("Error loading data:", error); }
    finally { setLoading(false); }
  }

  async function saveDriver(data) {
    if (editDriver) {
      const oldData = drivers.find(d => d.id === editDriver.id)
      const { error } = await supabase.from("drivers").update(data).eq("id", editDriver.id)
      if (!error && user) await supabase.from('audit_logs').insert([{ user_id: user.id, user_name: currentUserProfile?.full_name || user.email, action: 'UPDATE', entity_type: 'drivers', entity_id: String(editDriver.id), old_data: oldData, new_data: data }]);
    } else {
      const { data: newDriver, error } = await supabase.from("drivers").insert([data]).select().single()
      if (!error && user && newDriver) await supabase.from('audit_logs').insert([{ user_id: user.id, user_name: currentUserProfile?.full_name || user.email, action: 'CREATE', entity_type: 'drivers', entity_id: String(newDriver.id), new_data: newDriver }]);
    }
    loadAllData(); setDialogOpen(false); setEditDriver(null)
    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false })
  }

  async function handleDelete(id) {
    const result = await Swal.fire({ title: 'ยืนยันการลบ?', text: "ต้องการลบข้อมูลคนขับรายนี้?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก' })
    if (result.isConfirmed) {
      const oldData = drivers.find(d => d.id === id)
      const { error } = await supabase.from("drivers").delete().eq("id", id)
      if (!error) {
        if (user && oldData) await supabase.from('audit_logs').insert([{ user_id: user.id, user_name: currentUserProfile?.full_name || user.email, action: 'DELETE', entity_type: 'drivers', entity_id: String(id), old_data: oldData }]);
        loadAllData()
        Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false })
      }
    }
  }

  const filtered = drivers.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))
  const stats = { total: drivers.length, available: drivers.filter(d => d.status === "available").length, busy: drivers.filter(d => d.status === "busy").length }

  return (
    <div className="min-h-screen font-sarabun text-black relative bg-slate-900">
      <Image src="/images/image.png" alt="Background" fill priority className="object-cover z-0 opacity-40" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="จัดการคนขับรถ" />
      </div>

      <div className="p-4 md:p-8 space-y-6 relative z-10">

        {/* ── Stats: 2-col on mobile ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {/* full-width on mobile when odd: span 2 for total */}
          <div className="col-span-2 lg:col-span-1">
            <StatCard title="คนขับทั้งหมด" value={stats.total} icon={<Users className="size-5 text-blue-600" />} color="blue" />
          </div>
          <StatCard title="คนขับที่ว่าง" value={stats.available} icon={<UserCheck className="size-5 text-emerald-600" />} color="emerald" />
          <StatCard title="กำลังปฏิบัติงาน" value={stats.busy} icon={<Car className="size-5 text-amber-600" />} color="amber" />
        </div>

        {/* ── Page title row ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">จัดการคนขับรถ</h1>
              <Button variant="outline" size="icon" onClick={loadAllData} disabled={loading}
                className="h-8 w-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all">
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
            </div>
            <p className="text-white/70 text-sm font-medium mt-0.5">รายชื่อและสถานะความพร้อมของพนักงานขับรถ</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditDriver(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#0f172a] hover:bg-slate-800 shadow-md h-11 px-5 text-white font-bold rounded-2xl shrink-0">
                <Plus className="mr-1.5 size-4" />
                <span className="hidden sm:inline">เพิ่มคนขับใหม่</span>
                <span className="sm:hidden">เพิ่ม</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-2xl sm:rounded-3xl border-none shadow-2xl bg-white text-black p-0 overflow-hidden">
              <DialogHeader className="p-5 bg-[#0f172a] text-white">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  {editDriver ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                  {editDriver ? "แก้ไขข้อมูลคนขับ" : "ลงทะเบียนคนขับใหม่"}
                </DialogTitle>
                <DialogDescription className="hidden">แบบฟอร์มเพิ่มหรือแก้ไขข้อมูลคนขับรถ</DialogDescription>
              </DialogHeader>
              <div className="px-5 pb-5 pt-3 bg-white">
                <DriverForm driver={editDriver} users={users} onClose={() => setDialogOpen(false)} onSave={saveDriver} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Main card ── */}
        <Card className="border-none shadow-sm overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl">
          {/* Search */}
          <div className="bg-white border-b border-slate-100 p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="ค้นหาชื่อคนขับ..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50 text-black focus-visible:ring-blue-500" />
            </div>
          </div>

          {/* ── Mobile: card list ── */}
          <div className="md:hidden p-3 space-y-2.5">
            {loading ? (
              <div className="py-16 flex flex-col items-center text-slate-400">
                <Loader2 className="animate-spin mb-2 text-blue-500 size-6" />
                <p className="text-sm font-semibold">กำลังโหลดข้อมูล...</p>
              </div>
            ) : filtered.length > 0 ? filtered.map(driver => (
              <DriverCard key={driver.id} driver={driver}
                onEdit={(d) => { setEditDriver(d); setDialogOpen(true); }}
                onDelete={handleDelete}
              />
            )) : (
              <div className="py-16 flex flex-col items-center text-slate-400">
                <Info className="size-8 mb-2 text-slate-300" />
                <p className="text-sm font-semibold">ไม่พบรายชื่อคนขับรถในระบบ</p>
              </div>
            )}
          </div>

          {/* ── Desktop: table ── */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200/50">
                  <TableHead className="pl-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-widest">ชื่อ-นามสกุล</TableHead>
                  <TableHead className="py-4 text-center font-bold text-slate-500 text-[11px] uppercase tracking-widest">เบอร์โทร</TableHead>
                  <TableHead className="py-4 text-center font-bold text-slate-500 text-[11px] uppercase tracking-widest">เลขใบขับขี่</TableHead>
                  <TableHead className="py-4 text-center font-bold text-slate-500 text-[11px] uppercase tracking-widest">วันหมดอายุ</TableHead>
                  <TableHead className="py-4 text-center font-bold text-slate-500 text-[11px] uppercase tracking-widest">สถานะ</TableHead>
                  <TableHead className="py-4 pr-6 text-right font-bold text-slate-500 text-[11px] uppercase tracking-widest">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2 text-blue-600 size-6" />
                    <p className="text-slate-500 font-bold mt-2">กำลังโหลดข้อมูล...</p>
                  </TableCell></TableRow>
                ) : filtered.length > 0 ? filtered.map(driver => {
                  const status = statusMap[driver.status] || statusMap.inactive
                  const expiry = checkExpiryStatus(driver.license_expiry)
                  return (
                    <TableRow key={driver.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100/50 text-black">
                      <TableCell className="pl-6 py-4">
                        <p className="font-bold text-slate-900">{driver.name}</p>
                        {driver.user_id && (
                          <p className="text-[11px] text-blue-600 font-bold flex items-center mt-1 bg-blue-50 w-fit px-2 py-0.5 rounded-full border border-blue-100">
                            <LinkIcon className="size-3 mr-1" /> ผูกบัญชีแล้ว
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-600 text-sm">{driver.phone || "-"}</TableCell>
                      <TableCell className="text-center">
                        <p className="font-mono font-bold text-slate-600 text-xs">{driver.license_number || "-"}</p>
                        {driver.license_type && <p className="text-[10px] text-slate-400 mt-0.5">{driver.license_type}</p>}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold text-xs ${expiry.color}`}>{formatThaiDate(driver.license_expiry)}</span>
                        {expiry.status !== 'valid' && expiry.status !== 'none' && (
                          <div className={`text-[9px] font-bold ${expiry.color} ${expiry.bg} px-1.5 py-0.5 rounded mt-1 flex items-center justify-center border ${expiry.border}`}>
                            {expiry.icon} {expiry.label}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`h-6 px-2.5 rounded-full border ${status.className} font-bold text-[11px]`}>
                          <span className={`size-1.5 rounded-full mr-1.5 ${status.dot}`} /> {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-100"
                            onClick={() => { setEditDriver(driver); setDialogOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-100"
                            onClick={() => handleDelete(driver.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-400">
                    <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-3"><Info className="size-8 text-slate-300" /></div>
                    <p className="font-bold text-slate-500">ไม่พบรายชื่อคนขับรถในระบบ</p>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}