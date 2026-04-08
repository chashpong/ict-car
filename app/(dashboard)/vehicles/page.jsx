"use client"

import { useState, useEffect } from "react"
import { 
  Plus, Search, Pencil, Trash2, Loader2, 
  Car, Truck, Wrench, CheckCircle2, AlertCircle, 
  Fuel, Calendar as CalendarIcon, Info
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const statusMap = {
  available: { 
    label: "ว่าง / พร้อมใช้งาน", 
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500"
  },
  "in-use": { 
    label: "กำลังใช้งาน", 
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500"
  },
  maintenance: { 
    label: "อยู่ระหว่างซ่อมบำรุง", 
    className: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500"
  },
}

const getTypeIcon = (type) => {
  switch (type) {
    case "กระบะ": return <Truck className="size-4" />;
    case "ตู้": return <Fuel className="size-4" />;
    default: return <Car className="size-4" />;
  }
}

function VehicleForm({ vehicle, onClose, onSave }) {
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(vehicle?.image_url || null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    license_plate: vehicle?.license_plate || "",
    brand: vehicle?.brand || "",
    model: vehicle?.model || "",
    year: vehicle?.year || "",
    type: vehicle?.type || "เก๋ง",
    status: vehicle?.status || "available",
    last_mileage: vehicle?.last_mileage || 0 // 🔥 เพิ่มเลขไมล์เริ่มต้น
  })

  useEffect(() => {
    setFormData({
      license_plate: vehicle?.license_plate || "",
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      year: vehicle?.year || "",
      type: vehicle?.type || "เก๋ง",
      status: vehicle?.status || "available",
      last_mileage: vehicle?.last_mileage || 0 // 🔥 อัปเดตเมื่อเลือกแก้ไข
    })
    setPreview(vehicle?.image_url || null)
    setImageFile(null)
  }, [vehicle])

  return (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">ทะเบียนรถ</Label>
          <Input 
            placeholder="เช่น พพ-9999"
            value={formData.license_plate}
            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">ยี่ห้อ</Label>
          <Input 
            placeholder="เช่น Toyota"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">รุ่น</Label>
          <Input 
            placeholder="เช่น Corolla Cross"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">ปีจดทะเบียน</Label>
          <Input 
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">ประเภทรถ</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="เก๋ง">รถเก๋ง</SelectItem>
              <SelectItem value="กระบะ">รถกระบะ</SelectItem>
              <SelectItem value="อเนกประสงค์">รถอเนกประสงค์ (SUV)</SelectItem>
              <SelectItem value="ตู้">รถตู้</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* 🔥 เพิ่มช่องกรอกเลขไมล์ล่าสุดที่นี่ */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">เลขไมล์เริ่มต้น (กม.)</Label>
          <Input 
            type="number"
            placeholder="เช่น 12500"
            value={formData.last_mileage}
            onChange={(e) => setFormData({ ...formData, last_mileage: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">สถานะปัจจุบัน</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">ว่าง</SelectItem>
              <SelectItem value="in-use">กำลังใช้งาน</SelectItem>
              <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">รูปภาพรถ</Label>
        <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/50 transition cursor-pointer relative">
          <Input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setImageFile(file); setPreview(URL.createObjectURL(file))
              }
            }}
          />
          {preview ? (
            <img src={preview} alt="Preview" className="h-32 mx-auto rounded-lg object-cover" />
          ) : (
            <div className="py-4">
              <Plus className="mx-auto size-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">คลิกเพื่ออัปโหลดรูปภาพรถ</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>ยกเลิก</Button>
        <Button 
          className="min-w-[120px]" 
          onClick={async () => {
            setIsSaving(true);
            await onSave(formData, imageFile);
            setIsSaving(false);
          }} 
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {vehicle ? "อัปเดตข้อมูล" : "ลงทะเบียนรถ"}
        </Button>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState(undefined)

  useEffect(() => { fetchVehicles() }, [])

  async function fetchVehicles() {
    const { data, error } = await supabase.from("vehicles").select("*").order('created_at', { ascending: false })
    if (!error) setVehicles(data)
  }

  async function saveVehicle(data, imageFile) {
    let imageUrl = editVehicle?.image_url || null
    if (imageFile) {
      const fileName = `vehicle-${Date.now()}.${imageFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from("vehicles").upload(fileName, imageFile)
      if (uploadError) return alert("อัปโหลดรูปไม่สำเร็จ")
      imageUrl = supabase.storage.from("vehicles").getPublicUrl(fileName).data.publicUrl
    }
    const payload = { ...data, image_url: imageUrl }
    if (editVehicle) {
      await supabase.from("vehicles").update(payload).eq("id", editVehicle.id)
    } else {
      await supabase.from("vehicles").insert([payload])
    }
    fetchVehicles(); setDialogOpen(false)
  }

  async function deleteVehicle(id) {
    if (!confirm("ต้องการลบรถคันนี้ใช่ไหม?")) return
    await supabase.from("vehicles").delete().eq("id", id)
    fetchVehicles()
  }

  const filtered = vehicles.filter((v) => {
    const matchesSearch = v.license_plate?.toLowerCase().includes(search.toLowerCase()) ||
                          v.brand?.toLowerCase().includes(search.toLowerCase()) ||
                          v.model?.toLowerCase().includes(search.toLowerCase())
    return (statusFilter === "all" || v.status === statusFilter) && matchesSearch
  })

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === "available").length,
    inUse: vehicles.filter(v => v.status === "in-use").length,
    maintenance: vehicles.filter(v => v.status === "maintenance").length,
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="รถทั้งหมด" value={stats.total} icon={<Car className="text-blue-600" />} color="blue" />
        <StatCard title="ว่างพร้อมใช้" value={stats.available} icon={<CheckCircle2 className="text-emerald-600" />} color="emerald" />
        <StatCard title="กำลังใช้งาน" value={stats.inUse} icon={<CalendarIcon className="text-amber-600" />} color="amber" />
        <StatCard title="ซ่อมบำรุง" value={stats.maintenance} icon={<Wrench className="text-rose-600" />} color="rose" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">จัดการยานพาหนะ</h1>
          <p className="text-muted-foreground">บริหารจัดการและติดตามสถานะรถยนต์ในระบบ</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditVehicle(undefined); }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20"><Plus className="mr-2 size-4" /> เพิ่มรถใหม่</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editVehicle ? "แก้ไขข้อมูลรถ" : "ลงทะเบียนรถใหม่"}</DialogTitle>
            </DialogHeader>
            <VehicleForm vehicle={editVehicle} onClose={() => setDialogOpen(false)} onSave={saveVehicle} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่นรถ..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50" 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-slate-50 border-none">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="available">ว่าง</SelectItem>
                <SelectItem value="in-use">กำลังใช้งาน</SelectItem>
                <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[100px] pl-6 font-bold uppercase text-[11px] tracking-wider">รูปรถ</TableHead>
                <TableHead className="font-bold uppercase text-[11px] tracking-wider">รายละเอียดรถ</TableHead>
                <TableHead className="hidden md:table-cell font-bold uppercase text-[11px] tracking-wider text-center">ประเภท</TableHead>
                <TableHead className="font-bold uppercase text-[11px] tracking-wider">สถานะ</TableHead>
                <TableHead className="hidden lg:table-cell font-bold uppercase text-[11px] tracking-wider">เลขไมล์ล่าสุด</TableHead>
                <TableHead className="text-right pr-6 font-bold uppercase text-[11px] tracking-wider">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map((vehicle) => {
                const status = statusMap[vehicle.status] || statusMap.available
                return (
                  <TableRow key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="pl-6 py-4">
                      {vehicle.image_url ? (
                        <div className="size-14 rounded-lg overflow-hidden border bg-white shadow-sm">
                          <img src={vehicle.image_url} className="size-full object-cover" alt="car" />
                        </div>
                      ) : (
                        <div className="size-14 rounded-lg bg-slate-100 flex items-center justify-center border border-dashed">
                          <Car className="size-6 text-slate-300" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{vehicle.license_plate}</span>
                        <span className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model} ({vehicle.year})</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                       <div className="flex flex-col items-center gap-1">
                          <div className="p-1.5 rounded-full bg-slate-100 text-slate-500">{getTypeIcon(vehicle.type)}</div>
                          <span className="text-[10px] text-slate-500 font-medium">{vehicle.type}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`h-7 px-3 rounded-full border ${status.className} font-medium`}>
                        <span className={`size-1.5 rounded-full mr-2 ${status.dot}`} />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                       <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 font-semibold">{(vehicle.last_mileage || 0).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">กม.</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" 
                          onClick={() => { setEditVehicle(vehicle); setDialogOpen(true); }}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" 
                          onClick={() => deleteVehicle(vehicle.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    <Info className="mx-auto size-8 mb-2 opacity-20" />
                    <p>ไม่พบข้อมูลรถที่ต้องการ</p>
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
    rose: "border-l-rose-500",
  }
  return (
    <Card className={`border-none border-l-4 ${colors[color]} shadow-sm`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-slate-100">{icon}</div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}