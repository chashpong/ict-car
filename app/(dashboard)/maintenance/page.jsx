"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Wrench, CalendarClock, Camera, Loader2, CheckCircle2, Pencil } from "lucide-react"
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
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context" 
import Swal from "sweetalert2"

const repairTypeOptions = [
  "เปลี่ยนถ่ายน้ำมันเครื่อง",
  "ซ่อมระบบเบรก",
  "เปลี่ยนยาง",
  "ตรวจเช็คระยะ",
  "ซ่อมแอร์",
  "แจ้งรถเสีย", 
  "อื่นๆ",
]

function AddMaintenanceForm({ record, onClose, onSave, vehicles, isSaving }) {
  const [formData, setFormData] = useState({
    id: null,
    vehicle_id: "",
    vehicle_plate: "",
    type: "",
    customType: "",
    date: "",
    cost: "",
    next_due: "",
    description: "",
    receiptFile: null,
  })

  useEffect(() => {
    if (record) {
      const isOther = record.type && !repairTypeOptions.includes(record.type);
      setFormData({
        id: record.id,
        vehicle_id: record.vehicle_id ? String(record.vehicle_id) : "",
        vehicle_plate: record.vehicle_plate || "",
        type: isOther ? "other" : (record.type || ""),
        customType: isOther ? record.type : "",
        date: record.date || "",
        cost: record.cost !== null && record.cost !== undefined ? String(record.cost) : "",
        next_due: record.next_due || "",
        description: record.description || "",
        receiptFile: null,
      })
    } else {
      setFormData({
        id: null, vehicle_id: "", vehicle_plate: "", type: "", customType: "",
        date: "", cost: "", next_due: "", description: "", receiptFile: null,
      })
    }
  }, [record])

  const handleSubmit = () => {
    const finalType = formData.type === "other" ? formData.customType.trim() : formData.type

    if (!formData.vehicle_id) return alert("กรุณาเลือกรถ")
    if (!finalType) return alert("กรุณาระบุประเภทการซ่อม")
    if (!formData.date) return alert("กรุณาเลือกวันที่")

    onSave({
      id: formData.id,
      vehicle_id: formData.vehicle_id,
      vehicle_plate: formData.vehicle_plate,
      type: finalType,
      date: formData.date,
      cost: Number(formData.cost || 0),
      next_due: formData.next_due || null,
      description: formData.description,
      receiptFile: formData.receiptFile,
    })
  }

  return (
    <div className="flex flex-col gap-4 font-sarabun mt-2 text-black">
      <div className="flex flex-col gap-2">
        <Label className="font-bold">เลือกรถ</Label>
        <Select
          value={formData.vehicle_id} 
          onValueChange={(value) => {
            const selectedVehicle = vehicles.find((v) => String(v.id) === String(value))
            setFormData({
              ...formData,
              vehicle_id: value,
              vehicle_plate: selectedVehicle?.license_plate || selectedVehicle?.licensePlate || "",
            })
          }}
          disabled={!!record} 
        >
          <SelectTrigger className="rounded-xl h-11 bg-white text-black">
            <SelectValue placeholder={vehicles.length === 0 ? "กำลังโหลดรถ..." : "เลือกรถ"} />
          </SelectTrigger>
          <SelectContent className="font-sarabun max-h-[200px] bg-white text-black">
            {vehicles.length === 0 ? (
               <SelectItem value="empty" disabled>ไม่พบข้อมูลรถ</SelectItem>
            ) : (
              vehicles.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {(v.license_plate || v.licensePlate)} - {v.brand} {v.model}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="font-bold">ประเภทการซ่อม</Label>
          <Select
            value={formData.type} 
            onValueChange={(value) =>
              setFormData({
                ...formData,
                type: value,
                customType: value === "other" ? formData.customType : "",
              })
            }
          >
            <SelectTrigger className="rounded-xl h-11 bg-white text-black">
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>
            <SelectContent className="font-sarabun bg-white text-black">
              {repairTypeOptions.map((type, idx) => (
                <SelectItem key={idx} value={type === "อื่นๆ" ? "other" : type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {formData.type === "other" && (
            <Input
              className="mt-2 rounded-xl h-11 bg-white"
              placeholder="ระบุประเภทการซ่อม"
              value={formData.customType}
              onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label className="font-bold">วันที่</Label>
          <Input
            type="date"
            className="rounded-xl h-11 bg-white text-black"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="font-bold text-amber-600">ค่าใช้จ่าย (บาท)</Label>
          <Input
            type="number"
            placeholder="0"
            className="rounded-xl h-11 font-mono font-bold bg-white text-amber-600 focus-visible:ring-amber-500"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="font-bold text-slate-500">กำหนดครั้งถัดไป</Label>
          <Input
            type="date"
            className="rounded-xl h-11 bg-white text-slate-500"
            value={formData.next_due}
            onChange={(e) => setFormData({ ...formData, next_due: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-bold">รายละเอียด / อาการ</Label>
        <Textarea
          placeholder="รายละเอียดการซ่อมบำรุง หรือ อาการที่พบ"
          className="rounded-xl bg-white text-black"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl font-bold text-slate-500">
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving} className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
          {isSaving ? <><Loader2 className="mr-2 size-4 animate-spin" /> กำลังบันทึก...</> : "บันทึกข้อมูล"}
        </Button>
      </div>
    </div>
  )
}

export default function MaintenancePage() {
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editRecord, setEditRecord] = useState(null) 
  const [userProfile, setUserProfile] = useState(null) // ✅ เก็บข้อมูล Profile

  const { user } = useAuth()

  useEffect(() => {
    // ✅ ดึงชื่อของแอดมิน เพื่อเอาไปลง Log
    async function fetchUserProfile() {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setUserProfile(data)
    }
    fetchUserProfile()
    fetchData()
  }, [user])

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center font-sarabun">
        <div className="rounded-full bg-red-100 p-6 mb-4">
          <Wrench className="size-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-slate-500 mt-2">หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น</p>
      </div>
    )
  }

  async function fetchData() {
    try {
      setLoading(true)
      const [{ data: maintenanceData, error: maintenanceError }, { data: vehiclesData, error: vehiclesError }] =
        await Promise.all([
          supabase.from("maintenance").select("*").order("date", { ascending: false }),
          supabase.from("vehicles").select("*").order("license_plate", { ascending: true }),
        ])

      if (maintenanceError) console.error(maintenanceError)
      if (vehiclesError) console.error(vehiclesError)

      setMaintenanceRecords(maintenanceData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveMaintenance(payload) {
    setIsSaving(true);
    try {
      const dataToSave = {
        vehicle_id: payload.vehicle_id,
        vehicle_plate: payload.vehicle_plate,
        type: payload.type,
        date: payload.date,
        cost: payload.cost,
        next_due: payload.next_due || null,
        description: payload.description || null,
      };

      if (payload.id) {
        // 📝 กรณีอัปเดตรายการซ่อมเดิม
        const oldData = maintenanceRecords.find(m => m.id === payload.id);
        const { data, error: updateError } = await supabase
          .from('maintenance')
          .update(dataToSave)
          .eq('id', payload.id)
          .select(); 
        
        if (updateError) throw updateError;
        if (!data || data.length === 0) {
          throw new Error("อัปเดตไม่ได้! ตาราง maintenance ใน Supabase ปิดกั้นสิทธิ์ UPDATE (RLS Policy)");
        }

        // บันทึก Log การอัปเดต
        if (user) {
          await supabase.from('audit_logs').insert([{
            user_id: user.id,
            user_name: userProfile?.full_name || user.email,
            action: 'UPDATE',
            entity_type: 'maintenance',
            entity_id: String(payload.id),
            old_data: oldData,
            new_data: dataToSave
          }]);
        }

        Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ', timer: 1500, showConfirmButton: false });
      
      } else {
        // 📝 กรณีเพิ่มรายการซ่อมใหม่
        const { data: insertedData, error: insertError } = await supabase.from('maintenance').insert([dataToSave]).select().single();
        if (insertError) throw insertError;

        // อัปเดตสถานะรถเป็น ซ่อมบำรุง
        await supabase.from('vehicles')
          .update({ status: 'maintenance' })
          .eq('id', payload.vehicle_id);

        // บันทึก Log การสร้าง
        if (user && insertedData) {
          await supabase.from('audit_logs').insert([{
            user_id: user.id,
            user_name: userProfile?.full_name || user.email,
            action: 'CREATE',
            entity_type: 'maintenance',
            entity_id: String(insertedData.id),
            new_data: insertedData
          }]);
        }

        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'เพิ่มประวัติและเปลี่ยนสถานะรถเป็น "ซ่อมบำรุง" แล้ว', timer: 2000, showConfirmButton: false });
      }

      setDialogOpen(false); 
      setEditRecord(null); 
      fetchData(); 

    } catch (error) {
      console.error("Error saving maintenance:", error);
      Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFinishRepair(vehicleId, plate) {
    Swal.fire({
      title: `นำรถ ${plate} กลับมาใช้งาน?`,
      text: "ระบบจะเปลี่ยนสถานะรถคันนี้กลับเป็น 'ว่าง/พร้อมใช้งาน'",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ซ่อมเสร็จแล้ว',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('vehicles')
            .update({ status: 'available' })
            .eq('id', vehicleId);
            
          if (error) throw error;
          
          // 📝 บันทึก Log ว่ารถซ่อมเสร็จแล้ว (อัปเดตสถานะรถ)
          if (user) {
            await supabase.from('audit_logs').insert([{
              user_id: user.id,
              user_name: userProfile?.full_name || user.email,
              action: 'UPDATE',
              entity_type: 'vehicles',
              entity_id: String(vehicleId),
              old_data: { status: 'maintenance' },
              new_data: { status: 'available' }
            }]);
          }

          Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: `เปลี่ยนสถานะรถ ${plate} เป็นว่างพร้อมใช้แล้ว`, timer: 2000, showConfirmButton: false });
          fetchData(); 
        } catch (error) {
          Swal.fire('ข้อผิดพลาด', error.message, 'error');
        }
      }
    });
  }

  const filtered = useMemo(() => {
    return maintenanceRecords.filter((m) => {
      const plate = m.vehicle_plate || ""
      const type = m.type || ""
      const description = m.description || ""

      return (
        plate.toLowerCase().includes(search.toLowerCase()) ||
        type.toLowerCase().includes(search.toLowerCase()) ||
        description.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [maintenanceRecords, search])

  const totalCost = useMemo(() => {
    return maintenanceRecords.reduce((sum, m) => sum + Number(m.cost || 0), 0)
  }, [maintenanceRecords])

  const maintenanceVehicleCount = useMemo(() => {
    return vehicles.filter((v) => v.status === "maintenance").length
  }, [vehicles])

  return (
    // ✅ อัปเดตพื้นหลังของหน้าซ่อมบำรุง ให้เป็น Theme เดียวกัน
    <div className="min-h-screen font-sarabun text-black bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/images/image.png')" }}>
      
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="ซ่อมบำรุง" />
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">ระบบซ่อมบำรุง</h1>
            <p className="text-sm font-medium text-white/80 mt-1">บันทึกประวัติ อัปเดตค่าใช้จ่าย และจัดการรถเสีย</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if(!open) setEditRecord(null); }}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-2xl px-6 font-bold shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-[1.02]">
                <Plus className="mr-2 size-4" />
                เพิ่มรายการซ่อม
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[560px] border-none rounded-[2rem] shadow-2xl p-0 overflow-hidden bg-white text-black">
              <DialogHeader className="bg-slate-900 text-white p-6 pb-5">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {editRecord ? <Pencil className="size-5" /> : <Wrench className="size-5" />}
                  {editRecord ? "แก้ไขข้อมูลซ่อมบำรุง" : "บันทึกการซ่อมบำรุงใหม่"}
                </DialogTitle>
                <DialogDescription className="hidden">
                  ฟอร์มบันทึกรายละเอียดการซ่อมรถ
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6 pt-2 bg-slate-50/50">
                <AddMaintenanceForm
                  record={editRecord} 
                  vehicles={vehicles}
                  onClose={() => { setDialogOpen(false); setEditRecord(null); }}
                  onSave={handleSaveMaintenance} 
                  isSaving={isSaving}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-none shadow-sm rounded-3xl bg-white border-l-4 border-l-blue-500 overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Wrench className="size-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">รายการซ่อมทั้งหมด</p>
                <p className="text-3xl font-extrabold text-slate-900 leading-none mt-1">
                  {maintenanceRecords.length} <span className="text-sm font-medium text-slate-500">รายการ</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white border-l-4 border-l-rose-500 overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <CalendarClock className="size-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">รถรอซ่อม</p>
                <p className="text-3xl font-extrabold text-slate-900 leading-none mt-1">
                  {maintenanceVehicleCount} <span className="text-sm font-medium text-slate-500">คัน</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white border-l-4 border-l-amber-500 overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <span className="text-xl font-extrabold">฿</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ค่าใช้จ่ายรวม</p>
                <p className="text-3xl font-extrabold text-slate-900 leading-none mt-1">
                  {totalCost.toLocaleString()} <span className="text-sm font-medium text-slate-500">บาท</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="bg-white border-b py-5 px-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="ค้นหาทะเบียนรถ, อาการ, ประเภทการซ่อม..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-slate-50 border-none shadow-sm text-black focus-visible:ring-blue-500"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="pl-6 font-bold uppercase text-[11px] text-slate-500 tracking-wider py-5">รถ</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] text-slate-500 tracking-wider py-5">ประเภทซ่อม/ปัญหา</TableHead>
                  <TableHead className="hidden sm:table-cell font-bold uppercase text-[11px] text-slate-500 tracking-wider py-5">วันที่</TableHead>
                  <TableHead className="hidden md:table-cell font-bold uppercase text-[11px] text-slate-500 tracking-wider py-5">ครั้งถัดไป</TableHead>
                  <TableHead className="font-bold uppercase text-[11px] text-slate-500 tracking-wider py-5">ค่าใช้จ่าย</TableHead>
                  <TableHead className="hidden lg:table-cell font-bold uppercase text-[11px] text-slate-500 tracking-wider py-5">รายละเอียด</TableHead>
                  <TableHead className="text-right pr-6 font-bold uppercase text-[11px] text-slate-500 tracking-wider py-5">จัดการ / สถานะ</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-16">
                      <Loader2 className="animate-spin mx-auto mb-3 text-blue-600 size-6" />
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-16">
                      ไม่พบประวัติซ่อมบำรุง
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((record) => {
                    const currentVehicle = vehicles.find(v => v.id === record.vehicle_id);
                    const isStillRepairing = currentVehicle?.status === "maintenance";

                    return (
                      <TableRow key={record.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                        <TableCell className="pl-6 font-bold text-slate-800 py-4">
                          {record.vehicle_plate || "-"}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={`font-bold ${record.type === 'แจ้งรถเสีย' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'} rounded-lg px-2 py-0.5`}>
                            {record.type || "-"}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell font-medium text-slate-600">
                          {record.date || "-"}
                        </TableCell>

                        <TableCell className="hidden md:table-cell font-bold text-blue-600">
                          {record.next_due || "-"}
                        </TableCell>

                        <TableCell className={`font-extrabold font-mono ${Number(record.cost) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {Number(record.cost || 0).toLocaleString()} <span className="text-[10px]">฿</span>
                        </TableCell>

                        <TableCell className="hidden max-w-[250px] truncate text-slate-500 text-sm lg:table-cell">
                          {record.description || "-"}
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-3">
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="แก้ไขรายการ / ใส่ค่าใช้จ่าย"
                              className="size-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setEditRecord(record);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>

                            {isStillRepairing ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 rounded-lg border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold bg-white"
                                onClick={() => handleFinishRepair(record.vehicle_id, record.vehicle_plate)}
                              >
                                <CheckCircle2 className="size-3.5 mr-1.5" />
                                คืนสถานะว่าง
                              </Button>
                            ) : (
                              <Badge variant="outline" className="h-8 px-3 rounded-lg border-slate-200 bg-slate-50 text-slate-400 font-bold">
                                คืนรถแล้ว
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}