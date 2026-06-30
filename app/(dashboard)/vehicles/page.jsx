"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { 
  Plus, Search, Pencil, Trash2, Loader2, 
  Car, Truck, Bus, Wrench, CheckCircle2, AlertCircle,
  Calendar as CalendarIcon, Info, RefreshCw
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  available: { 
    label: "ว่าง / พร้อมใช้", 
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500"
  },
  "in-use": { 
    label: "กำลังใช้งาน", 
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500"
  },
  maintenance: { 
    label: "ซ่อมบำรุง", 
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

// ── StatCard: compact 2x2 on mobile ──
function StatCard({ title, value, icon, color }) {
  const styles = {
    blue:    { bg: "bg-blue-50",    border: "border-blue-100"   },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-100" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-100"  },
    rose:    { bg: "bg-rose-50",    border: "border-rose-100"   },
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

// ── VehicleForm (unchanged logic) ──
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
    <div className="space-y-5 pt-2 font-sarabun text-black">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500">ทะเบียนรถ</Label>
          <Input placeholder="เช่น พพ-9999" value={formData.license_plate}
            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
            className="rounded-xl h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500">ยี่ห้อ</Label>
          <Input placeholder="เช่น Toyota" value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="rounded-xl h-11" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500">รุ่น</Label>
          <Input placeholder="เช่น Corolla Cross" value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="rounded-xl h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500">ปีจดทะเบียน</Label>
          <Input type="number" value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            className="rounded-xl h-11" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500">ประเภทรถ</Label>
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
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500">เลขไมล์เริ่มต้น (กม.)</Label>
          <Input type="number" placeholder="เช่น 12500" value={formData.last_mileage}
            onChange={(e) => setFormData({ ...formData, last_mileage: e.target.value })}
            className="rounded-xl h-11 font-mono" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500">สถานะปัจจุบัน</Label>
        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
          <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue /></SelectTrigger>
          <SelectContent className="font-sarabun bg-white text-black">
            <SelectItem value="available">ว่าง / พร้อมใช้งาน</SelectItem>
            <SelectItem value="in-use">กำลังใช้งาน</SelectItem>
            <SelectItem value="maintenance">อยู่ระหว่างซ่อมบำรุง</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl font-bold text-slate-500">ยกเลิก</Button>
        <Button 
          className="min-w-[120px] rounded-xl px-6 bg-[#0f172a] hover:bg-slate-800 text-white font-bold shadow-md"
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

// ── Mobile vehicle card ──
function VehicleCard({ vehicle, onEdit, onDelete }) {
  const status = statusMap[vehicle.status] || statusMap.available
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
      {/* Icon */}
      <div className="shrink-0 p-3 rounded-2xl bg-slate-100 text-slate-500">
        {getTypeIcon(vehicle.type)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-extrabold text-slate-900 text-base">{vehicle.license_plate}</p>
          <Badge variant="outline" className={`h-5 px-2 rounded-full border text-[10px] font-bold ${status.className}`}>
            <span className={`size-1.5 rounded-full mr-1 ${status.dot}`} />
            {status.label}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
          {vehicle.brand} {vehicle.model} · {vehicle.year}
        </p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          ไมล์: {(vehicle.last_mileage || 0).toLocaleString()} กม.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          onClick={() => onEdit(vehicle)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(vehicle.id)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const { user } = useAuth() 
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // ✅ 1. ห่อฟังก์ชันด้วย useCallback และป้องกัน Error หน้าจอแดง (Strict Mode)
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true)
    setFetchError(null) 
    try {
      const promises = [
        supabase.from("vehicles").select("*").order('created_at', { ascending: false })
      ];
      if (user?.id && !currentUserProfile) {
        promises.push(supabase.from('profiles').select('*').eq('id', user.id).single());
      }
      const results = await Promise.all(promises);

      if (results[0].error) throw results[0].error;
      
      if (results[0].data) setVehicles(results[0].data);
      if (results[1]?.data) setCurrentUserProfile(results[1].data);
    } catch (error) {
      // ✅ 2. ดักข้าม Error ที่เกิดจาก React Strict Mode แย่งกันดึงข้อมูล
      if (error.name === 'AbortError' || error.message?.includes('Lock') || error.message?.includes('steal')) {
        return; 
      }
      console.error("Error loading vehicles:", error);
      setFetchError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ โปรดตรวจสอบอินเทอร์เน็ตหรือปิดส่วนขยายเบราว์เซอร์");
    } finally {
      setLoading(false)
    }
  }, [user, currentUserProfile]);

  // ✅ 3. โหลดตอนเปิดหน้าเว็บ + รีเฟรชเมื่อสลับแท็บ + อัปเดต Real-time
  useEffect(() => { 
    if(!user) return;
    
    loadData();

    // -- ดักจับการสลับแท็บเบราว์เซอร์ (Visibility API) --
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // -- ดักจับการเพิ่ม/ลบ/แก้ไขรถยนต์จากเครื่องอื่นแบบ Real-time --
    const channel = supabase
      .channel('public:vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
         loadData();
      })
      .subscribe();

    // Cleanup ระบบเมื่อออกจากหน้านี้
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  // ฟังก์ชัน async function saveVehicle(data) { ... จะอยู่ต่อจากบรรทัดนี้ลงไป

  async function saveVehicle(data) {
    const payload = { ...data }
    if (editVehicle) {
      const oldData = vehicles.find(v => v.id === editVehicle.id)
      const { error } = await supabase.from("vehicles").update(payload).eq("id", editVehicle.id)
      if (!error && user) {
        await supabase.from('audit_logs').insert([{ user_id: user.id, user_name: currentUserProfile?.full_name || user.email, action: 'UPDATE', entity_type: 'vehicles', entity_id: String(editVehicle.id), old_data: oldData, new_data: payload }]);
      }
    } else {
      const { data: newVehicle, error } = await supabase.from("vehicles").insert([payload]).select().single()
      if (!error && user && newVehicle) {
        await supabase.from('audit_logs').insert([{ user_id: user.id, user_name: currentUserProfile?.full_name || user.email, action: 'CREATE', entity_type: 'vehicles', entity_id: String(newVehicle.id), new_data: newVehicle }]);
      }
    }
    loadData(); 
    setDialogOpen(false);
    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'บันทึกข้อมูลรถเรียบร้อย', timer: 1500, showConfirmButton: false });
  }

  async function deleteVehicle(id) {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?', text: "ต้องการลบรถคันนี้ออกจากระบบใช่หรือไม่?", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก',
    })
    if (result.isConfirmed) {
      const oldData = vehicles.find(v => v.id === id)
      const { error } = await supabase.from("vehicles").delete().eq("id", id)
      if (!error) {
        if (user && oldData) {
          await supabase.from('audit_logs').insert([{ user_id: user.id, user_name: currentUserProfile?.full_name || user.email, action: 'DELETE', entity_type: 'vehicles', entity_id: String(id), old_data: oldData }]);
        }
        loadData()
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
    <div className="min-h-screen font-sarabun text-black relative bg-slate-900">
      <Image src="/images/image.png" alt="Background" fill priority className="object-cover z-0 opacity-40" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="จัดการยานพาหนะ" />
      </div>

      <div className="p-4 md:p-8 space-y-6 relative z-10">

        {/* ── Stats: 2x2 on mobile, 4 cols on desktop ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          <StatCard title="รถทั้งหมด"   value={stats.total}       icon={<Car className="size-5 text-blue-600" />}      color="blue"    />
          <StatCard title="ว่างพร้อมใช้" value={stats.available}   icon={<CheckCircle2 className="size-5 text-emerald-600" />} color="emerald" />
          <StatCard title="กำลังใช้งาน" value={stats.inUse}       icon={<CalendarIcon className="size-5 text-amber-600" />}   color="amber"   />
          <StatCard title="ซ่อมบำรุง"   value={stats.maintenance} icon={<Wrench className="size-5 text-rose-600" />}      color="rose"    />
        </div>

        {/* ── Page header row ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">จัดการยานพาหนะ</h1>
              <Button variant="outline" size="icon" onClick={loadData} disabled={loading}
                className="h-8 w-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
            </div>
            <p className="text-white/70 text-sm font-medium mt-0.5">บริหารจัดการและติดตามสถานะรถยนต์ในระบบ</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditVehicle(undefined); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#0f172a] hover:bg-slate-800 shadow-md h-11 px-5 text-white font-bold rounded-2xl shrink-0">
                <Plus className="mr-1.5 size-4" />
                <span className="hidden sm:inline">เพิ่มรถใหม่</span>
                <span className="sm:hidden">เพิ่ม</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-2xl sm:rounded-3xl border-none bg-white text-black shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-5 bg-[#0f172a] text-white">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  {editVehicle ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                  {editVehicle ? "แก้ไขข้อมูลรถ" : "ลงทะเบียนรถใหม่"}
                </DialogTitle>
                <DialogDescription className="hidden">แบบฟอร์มบันทึกหรือแก้ไขข้อมูลยานพาหนะ</DialogDescription>
              </DialogHeader>
              <div className="px-5 pb-5 pt-2 bg-white">
                <VehicleForm vehicle={editVehicle} onClose={() => setDialogOpen(false)} onSave={saveVehicle} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Table / List Card ── */}
        <Card className="border-none shadow-sm overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl">
          {/* Search + filter */}
          <div className="bg-white border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่นรถ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50 text-black focus-visible:ring-blue-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="กรองสถานะ" />
                </SelectTrigger>
                <SelectContent className="font-sarabun bg-white text-black border-slate-200">
                  <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                  <SelectItem value="available">ว่าง / พร้อมใช้งาน</SelectItem>
                  <SelectItem value="in-use">กำลังใช้งาน</SelectItem>
                  <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Mobile: card list ── */}
          <div className="md:hidden p-3 space-y-2.5">
            {loading ? (
              <div className="py-16 flex flex-col items-center text-slate-400">
                <Loader2 className="animate-spin mb-2 text-blue-500 size-6" />
                <p className="text-sm font-semibold">กำลังโหลดข้อมูลยานพาหนะ...</p>
              </div>
            ) : fetchError ? (
              // ✅ 4. แสดง UI แจ้งเตือน Error บนมือถือ
              <div className="py-16 flex flex-col items-center text-rose-500">
                <AlertCircle className="size-8 mb-2 text-rose-400" />
                <p className="text-sm font-semibold text-center">{fetchError}</p>
              </div>
            ) : filtered.length > 0 ? filtered.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={(v) => { setEditVehicle(v); setDialogOpen(true); }}
                onDelete={deleteVehicle}
              />
            )) : (
              <div className="py-16 flex flex-col items-center text-slate-400">
                <Info className="size-8 mb-2 text-slate-300" />
                <p className="text-sm font-semibold">ไม่พบข้อมูลรถที่ค้นหา</p>
              </div>
            )}
          </div>

          {/* ── Desktop: table ── */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200/50">
                  <TableHead className="pl-6 py-4 font-bold uppercase text-[11px] tracking-wider text-slate-500">รายละเอียดรถ</TableHead>
                  <TableHead className="py-4 font-bold uppercase text-[11px] tracking-wider text-center text-slate-500">ประเภท</TableHead>
                  <TableHead className="py-4 font-bold uppercase text-[11px] tracking-wider text-slate-500 text-center">สถานะ</TableHead>
                  <TableHead className="py-4 font-bold uppercase text-[11px] tracking-wider text-center text-slate-500">เลขไมล์ล่าสุด</TableHead>
                  <TableHead className="text-right pr-6 py-4 font-bold uppercase text-[11px] tracking-wider text-slate-500">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <Loader2 className="animate-spin mx-auto mb-2 text-blue-600 size-6" />
                      <p className="text-slate-500 font-bold mt-2">กำลังโหลดข้อมูลยานพาหนะ...</p>
                    </TableCell>
                  </TableRow>
                ) : fetchError ? (
                  // ✅ 5. แสดง UI แจ้งเตือน Error บนตารางเดสก์ท็อป
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-rose-500">
                      <AlertCircle className="size-8 mx-auto mb-2 text-rose-400 animate-bounce" />
                      <p className="font-bold text-base">{fetchError}</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? filtered.map((vehicle) => {
                  const status = statusMap[vehicle.status] || statusMap.available
                  return (
                    <TableRow key={vehicle.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-base">{vehicle.license_plate}</span>
                          <span className="text-xs text-slate-500 font-medium">{vehicle.brand} {vehicle.model} ({vehicle.year})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-slate-700 font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                            {(vehicle.last_mileage || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">กม.</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-100"
                            onClick={() => { setEditVehicle(vehicle); setDialogOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-100"
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
                      <p className="font-bold text-slate-500 text-base">ไม่พบข้อมูลรถที่ค้นหา</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}