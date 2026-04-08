"use client"

import { useState, useEffect } from "react"
import { 
  Plus, Search, Pencil, Trash2, Loader2, 
  UserCheck, Users, Car, UserMinus, Info 
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

// แผนผังสถานะแบบมีจุดสี (Status Dots) เลียนแบบหน้าจัดการรถ
const statusMap = {
  available: { 
    label: "ว่าง", 
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500"
  },
  busy: { 
    label: "กำลังขับ", 
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500"
  },
  inactive: { 
    label: "หยุดงาน", 
    className: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500"
  }
}

function DriverForm({ driver, onClose, onSave }) {
  const [form, setForm] = useState({
    name: driver?.name || "",
    phone: driver?.phone || "",
    license_number: driver?.license_number || "",
    status: driver?.status || "available"
  })
  const [isSaving, setIsSaving] = useState(false)

  return (
    <div className="space-y-5 py-2 font-sarabun text-black">
      <div className="space-y-2">
        <Label className="font-bold">ชื่อ-นามสกุล คนขับ</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="เช่น นายชัชพงศ์ ใจดี"
          className="rounded-xl h-11 text-black"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-bold">เบอร์โทรศัพท์</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="08X-XXXXXXX"
            className="rounded-xl h-11 text-black"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-bold">เลขใบอนุญาตขับขี่</Label>
          <Input
            value={form.license_number}
            onChange={(e) => setForm({ ...form, license_number: e.target.value })}
            placeholder="ระบุเลขใบขับขี่"
            className="rounded-xl h-11 text-black"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-bold">สถานะการทำงาน</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger className="rounded-xl h-11 text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="font-sarabun bg-white text-black">
            <SelectItem value="available">ว่าง / พร้อมทำงาน</SelectItem>
            <SelectItem value="busy">กำลังปฏิบัติงาน (กำลังขับ)</SelectItem>
            <SelectItem value="inactive">หยุดงาน / ลางาน</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl">ยกเลิก</Button>
        <Button 
          onClick={async () => {
            setIsSaving(true)
            await onSave(form)
            setIsSaving(false)
          }} 
          disabled={isSaving}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 rounded-xl shadow-lg"
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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDriver, setEditDriver] = useState(null)

  useEffect(() => { fetchDrivers() }, [])

  async function fetchDrivers() {
    setLoading(true)
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order('created_at', { ascending: false })
    
    if (!error) setDrivers(data || [])
    setLoading(false)
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
    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false, background: '#fff', color: '#000' })
  }

  async function handleDelete(id) {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "ต้องการลบข้อมูลคนขับรายนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      background: '#fff',
      color: '#000'
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
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8 font-sarabun text-black">
      {/* 1. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="คนขับทั้งหมด" value={stats.total} icon={<Users className="text-blue-600" />} color="blue" />
        <StatCard title="คนขับที่ว่าง" value={stats.available} icon={<UserCheck className="text-emerald-600" />} color="emerald" />
        <StatCard title="กำลังปฏิบัติงาน" value={stats.busy} icon={<Car className="text-amber-600" />} color="amber" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">จัดการคนขับรถ</h1>
          <p className="text-muted-foreground">รายชื่อและสถานะความพร้อมของพนักงานขับรถ</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditDriver(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800 shadow-md h-11 px-6 text-white font-bold rounded-xl">
              <Plus className="mr-2 size-4" />เพิ่มคนขับใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl bg-white text-black">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold">
                {editDriver ? "แก้ไขข้อมูลคนขับ" : "ลงทะเบียนคนขับใหม่"}
              </DialogTitle>
            </DialogHeader>
            <DriverForm driver={editDriver} onClose={() => setDialogOpen(false)} onSave={saveDriver} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardHeader className="bg-white border-b py-5 px-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="ค้นหาชื่อคนขับ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50 text-black"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider pl-8 py-4">ชื่อ-นามสกุล</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4 text-center">เบอร์โทรศัพท์</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4 text-center">เลขใบขับขี่</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4 text-center">สถานะ</TableHead>
                <TableHead className="w-[150px] pr-8 text-right font-bold text-slate-500 text-xs uppercase tracking-wider py-4">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" />กำลังโหลดข้อมูล...</TableCell></TableRow>
              ) : filtered.length > 0 ? filtered.map(driver => {
                const status = statusMap[driver.status] || statusMap.inactive
                return (
                  <TableRow key={driver.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 text-black">
                    <TableCell className="pl-8 font-bold text-slate-800">{driver.name}</TableCell>
                    <TableCell className="text-center font-medium text-slate-600">{driver.phone || "-"}</TableCell>
                    <TableCell className="text-center font-mono text-slate-500">{driver.license_number || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`h-7 px-3 rounded-full border ${status.className} font-bold text-[11px]`}>
                        <span className={`size-1.5 rounded-full mr-2 ${status.dot}`} />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => { setEditDriver(driver); setDialogOpen(true); }}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(driver.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    <Info className="mx-auto size-8 mb-2 opacity-20" />
                    <p>ไม่พบรายชื่อคนขับรถในระบบ</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "border-l-blue-500",
    emerald: "border-l-emerald-500",
    amber: "border-l-amber-500",
  }
  return (
    <Card className={`border-none border-l-4 ${colors[color]} shadow-sm bg-white rounded-2xl text-black`}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-slate-50">{icon}</div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}