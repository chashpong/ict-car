"use client"

import { useState, useEffect } from "react"
import { 
  Plus, Search, Pencil, Trash2, Loader2, 
  Car, Truck, Bus, Wrench, CheckCircle2, AlertCircle,
  Calendar as CalendarIcon, Info
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
import { useAuth } from "@/lib/auth-context" // ✅ นำเข้า useAuth
import Swal from 'sweetalert2' // ✅ นำเข้า Swal

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
    case "ตู้": return <Bus className="size-4" />; 
    default: return <Car className="size-4" />;
  }
}

function VehicleForm({ vehicle, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    license_plate: vehicle?.license_plate || "",
    brand: vehicle?.brand || "",
    model: vehicle?.model || "",
    year: vehicle?.year || "",
    type: vehicle?.type || "เก๋ง",
    status: vehicle?.status || "available",
    last_mileage: vehicle?.last_mileage || 0 
  })

  useEffect(() => {
    setFormData({
      license_plate: vehicle?.license_plate || "",
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      year: vehicle?.year || "",
      type: vehicle?.type || "เก๋ง",
      status: vehicle?.status || "available",
      last_mileage: vehicle?.last_mileage || 0 
    })
  }, [vehicle])

  return (
    <div className="space-y-6 pt-2 font-sarabun text-black">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-600">ทะเบียนรถ</Label>
          <Input 
            placeholder="เช่น พพ-9999"
            value={formData.license_plate}
            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
            className="rounded-xl h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-600">ยี่ห้อ</Label>
          <Input 
            placeholder="เช่น Toyota"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="rounded-xl h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-600">รุ่น</Label>
          <Input 
            placeholder="เช่น Corolla Cross"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="rounded-xl h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-600">ปีจดทะเบียน</Label>
          <Input 
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            className="rounded-xl h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-600">ประเภทรถ</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue /></SelectTrigger>
            <SelectContent className="font-sarabun bg-white text-black">
              <SelectItem value="เก๋ง">รถเก๋ง</SelectItem>
              <SelectItem value="กระบะ">รถกระบะ</SelectItem>
              <SelectItem value="อเนกประสงค์">รถอเนกประสงค์ (SUV)</SelectItem>
              <SelectItem value="ตู้">รถตู้</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-600">เลขไมล์เริ่มต้น (กม.)</Label>
          <Input 
            type="number"
            placeholder="เช่น 12500"
            value={formData.last_mileage}
            onChange={(e) => setFormData({ ...formData, last_mileage: e.target.value })}
            className="rounded-xl h-11 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-600">สถานะปัจจุบัน</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue /></SelectTrigger>
            <SelectContent className="font-sarabun bg-white text-black">
              <SelectItem value="available">ว่าง / พร้อมใช้งาน</SelectItem>
              <SelectItem value="in-use">กำลังใช้งาน</SelectItem>
              <SelectItem value="maintenance">อยู่ระหว่างซ่อมบำรุง</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl font-bold text-slate-500">ยกเลิก</Button>
        <Button 
          className="min-w-[120px] rounded-xl px-8 bg-[#0f172a] hover:bg-slate-800 text-white font-bold shadow-lg" 
          onClick={async () => {
            if (!formData.license_plate) {
              Swal.fire({ icon: 'warning', title: 'กรุณากรอกทะเบียนรถ', confirmButtonColor: '#0f172a' });
              return;
            }
            setIsSaving(true);
            await onSave(formData);
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
  const { user } = useAuth() // ✅ ดึงข้อมูลคนล็อกอิน
  const [currentUserProfile, setCurrentUserProfile] = useState(null)

  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState(undefined)
  const [loading, setLoading] = useState(true)

  // ✅ ดึงโปรไฟล์แอดมิน เพื่อเก็บชื่อลง Log
  useEffect(() => {
    async function fetchCurrentUserProfile() {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setCurrentUserProfile(data)
    }
    fetchCurrentUserProfile()
  }, [user])

  useEffect(() => { fetchVehicles() }, [])

  async function fetchVehicles() {
    setLoading(true)
    const { data, error } = await supabase.from("vehicles").select("*").order('created_at', { ascending: false })
    if (!error) setVehicles(data || [])
    setLoading(false)
  }

  // ✅ ฟังก์ชันเซฟรถพร้อมบันทึก Log
  async function saveVehicle(data) {
    const payload = { ...data }
    
    if (editVehicle) {
      // 📝 กรณีอัปเดตรถที่มีอยู่เดิม (UPDATE)
      const oldData = vehicles.find(v => v.id === editVehicle.id)
      const { error } = await supabase.from("vehicles").update(payload).eq("id", editVehicle.id)
      
      if (!error && user) {
        await supabase.from('audit_logs').insert([{
          user_id: user.id,
          user_name: currentUserProfile?.full_name || user.email,
          action: 'UPDATE',
          entity_type: 'vehicles',
          entity_id: String(editVehicle.id),
          old_data: oldData,
          new_data: payload
        }]);
      }
    } else {
      // 📝 กรณีเพิ่มรถใหม่ (CREATE)
      const { data: newVehicle, error } = await supabase.from("vehicles").insert([payload]).select().single()
      
      if (!error && user && newVehicle) {
        await supabase.from('audit_logs').insert([{
          user_id: user.id,
          user_name: currentUserProfile?.full_name || user.email,
          action: 'CREATE',
          entity_type: 'vehicles',
          entity_id: String(newVehicle.id),
          new_data: newVehicle
        }]);
      }
    }
    
    fetchVehicles(); 
    setDialogOpen(false);
    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'บันทึกข้อมูลรถเรียบร้อย', timer: 1500, showConfirmButton: false });
  }

  // ✅ ฟังก์ชันลบรถพร้อมบันทึก Log
  async function deleteVehicle(id) {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "ต้องการลบรถคันนี้ออกจากระบบใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    })

    if (result.isConfirmed) {
      // ดึงข้อมูลเก่าก่อนลบ
      const oldData = vehicles.find(v => v.id === id)
      
      const { error } = await supabase.from("vehicles").delete().eq("id", id)
      
      if (!error) {
        // 📝 บันทึก Log ว่าใครลบรถคันไหนออก
        if (user && oldData) {
          await supabase.from('audit_logs').insert([{
            user_id: user.id,
            user_name: currentUserProfile?.full_name || user.email,
            action: 'DELETE',
            entity_type: 'vehicles',
            entity_id: String(id),
            old_data: oldData
          }]);
        }
        fetchVehicles()
        Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false })
      }
    }
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
    // ✅ อัปเดตพื้นหลังให้เข้ากับธีม
    <div className="min-h-screen font-sarabun text-black bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/images/image.png')" }}>
      
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="จัดการยานพาหนะ" />
      </div>

      <div className="p-4 md:p-8 space-y-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="รถทั้งหมด" value={stats.total} icon={<Car className="size-6 text-blue-600" />} color="blue" />
          <StatCard title="ว่างพร้อมใช้" value={stats.available} icon={<CheckCircle2 className="size-6 text-emerald-600" />} color="emerald" />
          <StatCard title="กำลังใช้งาน" value={stats.inUse} icon={<CalendarIcon className="size-6 text-amber-600" />} color="amber" />
          <StatCard title="ซ่อมบำรุง" value={stats.maintenance} icon={<Wrench className="size-6 text-rose-600" />} color="rose" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">จัดการยานพาหนะ</h1>
            <p className="text-white/80 mt-1 font-medium">บริหารจัดการและติดตามสถานะรถยนต์ในระบบ</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditVehicle(undefined); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#0f172a] hover:bg-slate-800 shadow-md h-12 px-6 text-white font-bold rounded-2xl transition-transform hover:scale-[1.02]">
                <Plus className="mr-2 size-5" /> เพิ่มรถใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none bg-white text-black shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-6 bg-[#0f172a] text-white">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {editVehicle ? <Pencil className="size-5" /> : <Plus className="size-5" />}
                  {editVehicle ? "แก้ไขข้อมูลรถ" : "ลงทะเบียนรถใหม่"}
                </DialogTitle>
                <DialogDescription className="hidden">
                  แบบฟอร์มบันทึกหรือแก้ไขข้อมูลยานพาหนะ
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6 pt-2 bg-slate-50/30">
                <VehicleForm vehicle={editVehicle} onClose={() => setDialogOpen(false)} onSave={saveVehicle} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
          <CardHeader className="bg-white border-b py-5 px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่นรถ..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-11 h-12 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 text-black" 
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-2xl border-none shadow-sm bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="กรองตามสถานะ" />
                </SelectTrigger>
                <SelectContent className="font-sarabun bg-white text-black border-slate-200">
                  <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                  <SelectItem value="available">ว่าง / พร้อมใช้งาน</SelectItem>
                  <SelectItem value="in-use">กำลังใช้งาน</SelectItem>
                  <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="pl-6 py-5 font-bold uppercase text-[11px] tracking-wider text-slate-500">รายละเอียดรถ</TableHead>
                  <TableHead className="hidden md:table-cell py-5 font-bold uppercase text-[11px] tracking-wider text-center text-slate-500">ประเภท</TableHead>
                  <TableHead className="py-5 font-bold uppercase text-[11px] tracking-wider text-slate-500 text-center">สถานะ</TableHead>
                  <TableHead className="hidden lg:table-cell py-5 font-bold uppercase text-[11px] tracking-wider text-center text-slate-500">เลขไมล์ล่าสุด</TableHead>
                  <TableHead className="text-right pr-6 py-5 font-bold uppercase text-[11px] tracking-wider text-slate-500">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <Loader2 className="animate-spin mx-auto mb-2 text-blue-600 size-6" />
                      <p className="text-slate-400 font-medium">กำลังโหลดข้อมูลยานพาหนะ...</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? filtered.map((vehicle) => {
                  const status = statusMap[vehicle.status] || statusMap.available
                  return (
                    <TableRow key={vehicle.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-base">{vehicle.license_plate}</span>
                          <span className="text-xs text-slate-500 font-medium">{vehicle.brand} {vehicle.model} ({vehicle.year})</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                         <div className="flex flex-col items-center gap-1">
                            <div className="p-2 rounded-full bg-slate-100 text-slate-600">{getTypeIcon(vehicle.type)}</div>
                            <span className="text-[10px] text-slate-500 font-bold">{vehicle.type}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`h-7 px-3 rounded-full border ${status.className} font-bold text-[11px] shadow-sm`}>
                          <span className={`size-1.5 rounded-full mr-2 ${status.dot}`} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                         <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-slate-700 font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                              {(vehicle.last_mileage || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">กม.</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50" 
                            onClick={() => { setEditVehicle(vehicle); setDialogOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50" 
                            onClick={() => deleteVehicle(vehicle.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-slate-400">
                      <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-3">
                        <Info className="size-8 text-slate-300" />
                      </div>
                      <p className="font-bold">ไม่พบข้อมูลรถที่ค้นหา</p>
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
    blue: { bg: "bg-blue-50", border: "border-blue-200" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200" },
    amber: { bg: "bg-amber-50", border: "border-amber-200" },
    rose: { bg: "bg-rose-50", border: "border-rose-200" },
  }
  return (
    <Card className={`border ${styles[color].border} shadow-sm bg-white rounded-[2rem] text-black hover:shadow-md transition-shadow`}>
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