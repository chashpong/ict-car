"use client"

import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import Image from "next/image" 
import { 
  Search, FileImage, MapPin, Camera, Play, 
  Square, CheckCircle2, AlertCircle, Loader2,
  Calendar as CalendarIcon, Clock, Fuel, Save, ChevronRight, Navigation,
  Car, UserCheck, RefreshCw, Lock, Receipt, Eye, Plus
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils" 

import { supabase } from "@/lib/supabase"
import Swal from "sweetalert2" 

// ================= HELPERS =================
function formatThaiDate(dateStr) {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

function formatTime(time) {
  if (!time) return "--:--"
  return time.slice(0, 5)
}

// ================= SUB-COMPONENTS =================

function FileUploadButton({ label, onUpload, url, icon = <Camera className="size-4" />, loading = false }) {
  return (
    <div className="space-y-2">
      <Button
        variant={url ? "outline" : "secondary"}
        className={`w-full gap-2 h-11 rounded-xl border-dashed transition-all font-bold ${
          url
            ? "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200"
        }`}
        asChild
        disabled={loading}
      >
        <label className="cursor-pointer">
          {loading ? <Loader2 className="size-4 animate-spin" /> : (url ? <CheckCircle2 className="size-4" /> : icon)}
          <span className="text-sm">{url ? "อัปโหลดสำเร็จ (แตะเพื่อเปลี่ยน)" : label}</span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) onUpload(e.target.files[0])
            }}
          />
        </label>
      </Button>
      {url && (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-sm">
          <img src={url} className="w-full h-full object-cover" alt="Preview" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm cursor-pointer">
            <p className="text-white text-xs font-bold flex items-center gap-1">
              <Camera className="size-3"/> แตะเพื่อเปลี่ยนรูป
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ Popup ย่อยสำหรับกรอกน้ำมันแยกต่างหาก
function FuelPopupForm({ d, index, uploadingField, onUploadImage, onSaveFuel }) {
  const [isOpen, setIsOpen] = useState(false)
  const [fuelLiter, setFuelLiter] = useState("")
  const [fuelCost, setFuelCost] = useState("")
  const [receiptUrl, setReceiptUrl] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!fuelLiter || !fuelCost || !receiptUrl) {
      Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรุณากรอกลิตร, ราคา และอัปโหลดใบเสร็จให้ครบถ้วน' })
      return
    }
    setIsSaving(true)
    await onSaveFuel(index, fuelLiter, fuelCost, receiptUrl)
    setIsSaving(false)
    setIsOpen(false)
    setFuelLiter("")
    setFuelCost("")
    setReceiptUrl(null)
    Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'บันทึกข้อมูลการเติมน้ำมันลงระบบเรียบร้อย', timer: 1500, showConfirmButton: false })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 font-bold h-11 rounded-xl border-dashed">
          <Plus className="mr-1.5 size-4" /> แวะปั๊ม / บันทึกเติมน้ำมัน
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-none font-sarabun bg-white text-black">
        <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <Fuel className="size-5" /> บันทึกการเติมน้ำมัน
          </DialogTitle>
          <DialogDescription className="text-white/80 font-medium">
            อัปโหลดใบเสร็จระหว่างทางได้ทันที
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">ปริมาณ (ลิตร)</Label>
              <Input type="number" placeholder="กรอกข้อมูล" value={fuelLiter} onChange={e => setFuelLiter(e.target.value)} className="h-11 rounded-xl bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">ยอดชำระ (บาท)</Label>
              <Input type="number" placeholder="กรอกข้อมูลจำนวน" value={fuelCost} onChange={e => setFuelCost(e.target.value)} className="h-11 rounded-xl bg-slate-50 font-bold text-amber-600" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">ใบเสร็จน้ำมัน (บังคับ)</Label>
            <FileUploadButton
              label="ถ่ายรูปใบเสร็จ"
              icon={<Receipt className="size-4" />}
              loading={uploadingField === `receipt-${index}`}
              url={receiptUrl}
              onUpload={async (file) => {
                const url = await onUploadImage(file, `receipt-${index}`)
                if (url) setReceiptUrl(url)
              }}
            />
          </div>

          <Button 
            className="w-full h-11 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white mt-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="size-5 animate-spin mr-2" /> : <Save className="size-4 mr-2" />} 
            บันทึกส่งเข้าส่วนกลาง
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DriverTodayJobs({ bookings, startTrip, isLoading, onRefresh, fetchError }) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Section Header ── */}
      <div className="px-1 pt-1 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 drop-shadow-md">
            <CalendarIcon className="size-5 text-blue-400" /> งานวันนี้ของคุณ
          </h2>
          <p className="text-sm text-white/70 mt-0.5">รายการเดินทางที่ได้รับการอนุมัติและรอการดำเนินการ</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all"
          title="รีเฟรช"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* ── Loading / Error / Empty / List ── */}
      {isLoading ? (
        <Card className="border border-white/10 bg-white/10 backdrop-blur-sm rounded-2xl h-56 flex flex-col items-center justify-center text-white/70">
          <Loader2 className="size-7 animate-spin text-blue-400 mb-3" />
          <p className="font-semibold text-sm">กำลังโหลดงาน...</p>
        </Card>
      ) : fetchError ? (
        <Card className="border border-rose-400/30 bg-rose-500/20 backdrop-blur-sm rounded-2xl h-64 flex flex-col items-center justify-center text-white p-6 text-center">
          <AlertCircle className="size-10 text-rose-300 mb-3 animate-bounce" />
          <p className="font-bold text-lg mb-2">พบปัญหาการเชื่อมต่อ</p>
          <p className="text-sm text-white/70 max-w-sm mb-5">{fetchError}</p>
          <Button variant="outline" onClick={onRefresh} className="border-rose-400/50 text-rose-100 hover:bg-rose-500 hover:text-white bg-white/5 rounded-xl font-bold">
            <RefreshCw className="size-4 mr-2" /> ลองโหลดใหม่อีกครั้ง
          </Button>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="border border-white/10 bg-white/10 backdrop-blur-sm rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-white/10 rounded-2xl p-5 mb-4">
              <CheckCircle2 className="size-9 text-white/50" />
            </div>
            <p className="text-white font-bold">ไม่มีงานค้างในวันนี้</p>
            <p className="text-white/60 text-sm mt-1">คุณสามารถพักผ่อนได้เลย หรือรอรับงานใหม่</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="overflow-hidden border border-white/10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              {/* Card Head */}
              <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100 px-5 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold text-slate-800 leading-tight">{booking.user_name}</CardTitle>
                    <CardDescription className="font-semibold text-blue-600 text-xs bg-blue-50 w-fit px-2 py-0.5 rounded-md">{booking.department}</CardDescription>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold shadow-none rounded-lg px-2.5 py-0.5 text-xs shrink-0">
                    อนุมัติแล้ว
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 flex flex-col gap-4">
                {/* Destination */}
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <div className="bg-blue-100 p-2 rounded-xl shrink-0">
                    <Navigation className="size-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">จุดหมาย</p>
                    <p className="font-bold text-slate-800 text-sm">{booking.destination}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">เริ่มเดินทาง</p>
                    <p className="font-bold text-slate-800 text-sm">{formatThaiDate(booking.start_date)}</p>
                    <p className="flex items-center gap-1 text-xs font-semibold text-blue-600 mt-0.5">
                      <Clock className="size-3" /> {formatTime(booking.start_time)}
                    </p>
                  </div>
                  <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">สิ้นสุดงาน</p>
                    <p className="font-bold text-slate-800 text-sm">{formatThaiDate(booking.end_date)}</p>
                    <p className="flex items-center gap-1 text-xs font-semibold text-rose-500 mt-0.5">
                      <Clock className="size-3" /> {formatTime(booking.end_time)}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="text-xs font-medium text-slate-500 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Car className="size-3.5 text-slate-400"/>
                      <span className="font-bold text-slate-700">{booking.vehicles?.license_plate}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-slate-400"/> {booking.drivers?.name}
                    </p>
                  </div>
                  <Button
                    className="rounded-xl px-5 h-10 bg-slate-900 hover:bg-blue-600 text-white font-bold shadow-sm transition-all text-sm"
                    onClick={() => startTrip(booking)}
                  >
                    <Play className="mr-1.5 size-3.5 fill-current" />
                    {booking.status === 'started' ? "บันทึกต่อ" : "เริ่มงาน"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function TripRecordForm({ booking, user, userProfile }) { 
  const [isStarted, setIsStarted] = useState(false)
  const [days, setDays] = useState([])
  const [fuelRecords, setFuelRecords] = useState([]) // ✅ State ใหม่สำหรับเก็บรายการน้ำมันแบบ List
  const [loading, setLoading] = useState(false)
  const [uploadingField, setUploadingField] = useState(null)
  const [savingIndex, setSavingIndex] = useState(null) 

  useEffect(() => {
    async function loadLogs() {
      if (!booking) return
      try {
        // ✅ โหลดข้อมูลจาก 2 ตาราง (logbooks และ fuel_expenses) พร้อมกัน โดยไม่กระทบลอจิกเดิม
        const [logsRes, fuelRes] = await Promise.all([
          supabase.from("logbooks").select("*").eq("booking_id", booking.id).order("log_date", { ascending: true }),
          supabase.from("fuel_expenses").select("*").eq("booking_id", booking.id).order("created_at", { ascending: true })
        ])

        if (logsRes.error) throw logsRes.error;
        if (fuelRes.error) throw fuelRes.error;

        setFuelRecords(fuelRes.data || []) // เก็บ List น้ำมันลง State
        const savedLogs = logsRes.data

        const start = new Date(booking.start_date)
        const end = booking.end_date ? new Date(booking.end_date) : new Date(booking.start_date)
        let current = new Date(start)
        let temp = []
        let dayIndex = 0

        while (current <= end) {
          const dateStr = current.toISOString().slice(0, 10)
          const existing = savedLogs?.find(l => l.log_date === dateStr)
          temp.push(existing ? { ...existing, date: dateStr } : {
            booking_id: booking.id,
            vehicle_id: booking.vehicle_id,
            driver_id: booking.driver_id,
            date: dateStr, 
            start_mileage: dayIndex === 0 ? (booking.vehicles?.last_mileage || "") : "",
            end_mileage: "",
            fuel_liter: "", fuel_cost: "",
            note: "", status: "normal",
            mileage_start_image: null, mileage_end_image: null, receipt_image: null
          })
          current.setDate(current.getDate() + 1)
          dayIndex++
        }
        setDays(temp)
        setIsStarted(true)
      } catch (error) {
        console.error("Load Logs Error:", error)
        Swal.fire({ icon: 'error', title: 'ดึงข้อมูลไม่สำเร็จ', text: 'ไม่สามารถโหลดประวัติการใช้งานได้ โปรดลองอีกครั้ง' })
      }
    }
    loadLogs()
  }, [booking])

  async function uploadImage(file, fieldKey) {
    if (!file) return null
    setUploadingField(fieldKey)
    const fileName = `${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from("logbook-images").upload(fileName, file)
    if (error) {
      Swal.fire('ข้อผิดพลาด', 'อัปโหลดรูปภาพไม่สำเร็จ', 'error')
      setUploadingField(null)
      return null
    }
    const { data } = supabase.storage.from("logbook-images").getPublicUrl(fileName)
    setUploadingField(null)
    return data.publicUrl
  }

  // ✅ ฟังก์ชันแยกรักษาค่าน้ำมันโดยเฉพาะ (บันทึกลงตาราง fuel_expenses ทันที)
 
  async function saveFuelDataOnly(index, liter, cost, url) {
    const d = days[index]
    const payload = {
      booking_id: booking.id,
      driver_id: booking.driver_id, // ตรวจสอบว่า booking.driver_id คือ ID ของตาราง drivers
      log_date: d.date,
      fuel_liter: Number(liter), 
      fuel_cost: Number(cost), 
      receipt_image: url
    }
    
    // บันทึกลงตาราง fuel_expenses
    const { data, error } = await supabase.from("fuel_expenses").insert([payload]).select().single()
    if (error) throw error

    // อัปเดต List บนหน้าจอ
    setFuelRecords([...fuelRecords, data])
  }

  async function saveDay(index) {
    const d = days[index]
    if (d.status !== "breakdown") {
      const startM = Number(d.start_mileage) || 0
      const endM = Number(d.end_mileage) || 0
      if (endM < startM) {
        Swal.fire({ icon: 'warning', title: 'เลขไมล์ไม่ถูกต้อง', text: 'เลขไมล์จบต้องมากกว่าหรือเท่ากับเลขไมล์เริ่ม', confirmButtonColor: '#0f172a' })
        return
      }
    }
    setSavingIndex(index)
    const startM = Number(d.start_mileage) || 0
    const endM = Number(d.end_mileage) || 0
    const dist = endM - startM
    const payload = {
      booking_id: booking.id, vehicle_id: booking.vehicle_id, driver_id: booking.driver_id,
      log_date: d.date,
      start_mileage: d.status === "breakdown" ? 0 : startM,
      end_mileage: d.status === "breakdown" ? 0 : endM,
      distance: dist > 0 ? dist : 0,
      fuel_liter: Number(d.fuel_liter) || 0, fuel_cost: Number(d.fuel_cost) || 0,
      note: d.note || null, status: d.status,
      mileage_start_image: d.status === "breakdown" ? null : d.mileage_start_image,
      mileage_end_image: d.status === "breakdown" ? null : d.mileage_end_image,
      receipt_image: d.receipt_image
    }
    
    const { data: newLog, error } = await supabase.from("logbooks").upsert(payload, { onConflict: 'booking_id, log_date' }).select().single()
    if (error) { Swal.fire('ข้อผิดพลาด', error.message, 'error'); setSavingIndex(null); return }
    
    if (d.status === "breakdown") {
      await supabase.from("vehicles").update({ status: "maintenance" }).eq("id", booking.vehicle_id)
      await supabase.from("maintenance").insert([{ vehicle_id: booking.vehicle_id, vehicle_plate: booking.vehicles?.license_plate || "ไม่ทราบทะเบียน", type: "แจ้งรถเสีย", date: d.date, description: d.note || "แจ้งรถเสียระหว่างปฏิบัติงาน", cost: 0 }])
      Swal.fire({ icon: 'warning', title: 'แจ้งรถเสียสำเร็จ', text: 'ระบบส่งเรื่องไปยังฝ่ายซ่อมบำรุงเรียบร้อยแล้ว', confirmButtonColor: '#d33' })
    } else {
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: `บันทึกข้อมูลวันที่ ${formatThaiDate(d.date)} เรียบร้อยแล้ว`, timer: 2000, showConfirmButton: false })
    }
    if (booking.status !== 'started') await supabase.from("bookings").update({ status: "started" }).eq("id", booking.id)
    setSavingIndex(null)
  }

  function validate() {
    for (let d of days) {
      if (d.status !== "breakdown") {
        if (!d.start_mileage || !d.end_mileage) {
          Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: `กรุณากรอกเลขไมล์วันที่ ${formatThaiDate(d.date)}`, confirmButtonColor: '#0f172a' })
          return false
        }
        if (Number(d.end_mileage) < Number(d.start_mileage)) {
          Swal.fire({ icon: 'warning', title: 'เลขไมล์ไม่ถูกต้อง', text: `เลขไมล์จบวันที่ ${formatThaiDate(d.date)} ต้องมากกว่าหรือเท่ากับขาไป`, confirmButtonColor: '#0f172a' })
          return false
        }
        if (!d.mileage_start_image || !d.mileage_end_image) {
          Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: `กรุณาแนบรูปไมล์วันที่ ${formatThaiDate(d.date)}`, confirmButtonColor: '#0f172a' })
          return false
        }
      }
    }
    return true
  }

  async function finishTrip() {
    if (!validate()) return
    setLoading(true)
    const inserts = days.map(d => ({
      booking_id: booking.id, vehicle_id: booking.vehicle_id, driver_id: booking.driver_id,
      log_date: d.date,
      start_mileage: d.status === "breakdown" ? 0 : Number(d.start_mileage || 0),
      end_mileage: d.status === "breakdown" ? 0 : Number(d.end_mileage || 0),
      distance: d.status === "breakdown" ? 0 : (Number(d.end_mileage || 0) - Number(d.start_mileage || 0)),
      fuel_liter: Number(d.fuel_liter) || 0, fuel_cost: Number(d.fuel_cost) || 0,
      note: d.note || null, status: d.status,
      mileage_start_image: d.status === "breakdown" ? null : d.mileage_start_image,
      mileage_end_image: d.status === "breakdown" ? null : d.mileage_end_image,
      receipt_image: d.receipt_image,
    }))
    const { error } = await supabase.from("logbooks").upsert(inserts, { onConflict: 'booking_id, log_date' })
    if (error) { Swal.fire('ข้อผิดพลาด', 'บันทึกไม่สำเร็จ: ' + error.message, 'error'); setLoading(false); return }
    const hasBreakdown = days.some(d => d.status === "breakdown")
    const lastDay = days[days.length - 1]
    const finalMileage = Number(lastDay.end_mileage) || 0
    await supabase.from("vehicles").update({ last_mileage: finalMileage, status: hasBreakdown ? "maintenance" : "available" }).eq("id", booking.vehicle_id)
    await supabase.from("drivers").update({ status: "available" }).eq("id", booking.driver_id)
    await supabase.from("bookings").update({ status: "completed" }).eq("id", booking.id)
    
    Swal.fire({ title: 'สำเร็จ', text: 'ส่งรายงานและสิ้นสุดการเดินทางเรียบร้อยแล้ว', icon: 'success', confirmButtonColor: '#0ea5e9' }).then(() => window.location.reload())
  }

  return (
    <div className="flex flex-col gap-6 pb-28 animate-in fade-in slide-in-from-right-4 duration-500">

      {/* ── Trip Summary Card ── */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-none shadow-lg rounded-2xl text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 p-4">
          <Car className="size-28" />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between gap-5">
            <div className="space-y-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-none text-xs rounded-lg">
                กำลังดำเนินการ
              </Badge>
              <h3 className="text-2xl font-extrabold">{booking?.destination}</h3>
              <p className="text-sm text-blue-100 flex items-center gap-2">
                <MapPin className="size-4" />
                ทะเบียนรถ: <span className="text-white font-bold">{booking?.vehicles?.license_plate}</span>
                <span className="opacity-50">•</span> {booking?.user_name}
              </p>
            </div>
            <div className="bg-white/10 px-5 py-4 rounded-2xl border border-white/20 flex items-center gap-5 self-start shrink-0">
              <div className="text-center">
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">วันเดินทาง</p>
                <p className="font-extrabold text-2xl">{days.length}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">สถานะ</p>
                <p className="font-bold text-emerald-300 text-sm flex items-center gap-1 mt-1">
                  <CheckCircle2 className="size-3.5"/> Active
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Day Timeline ── */}
      <div className="flex flex-col gap-5">
        {isStarted && days.map((d, index) => {
          // ✅ ดึงข้อมูลน้ำมันของ "วันนี้" ออกมาแสดง
          const todayFuelRecords = fuelRecords.filter(f => f.log_date === d.date)

          return (
            <div key={index} className="flex gap-4">
              
              {/* Timeline indicator */}
              <div className="flex flex-col items-center gap-0 shrink-0">
                <div className="size-12 rounded-2xl bg-blue-600 shadow-md flex items-center justify-center text-white font-bold text-sm shrink-0">
                  D{index + 1}
                </div>
                {index < days.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-6 bg-slate-200 mt-2 rounded-full" />
                )}
              </div>

              {/* Day Card */}
              <div className="flex-1 min-w-0 pb-2">
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h4 className="text-lg font-extrabold text-white flex items-center gap-2">
                    วันที่ {index + 1}:
                    <span className="text-blue-400 bg-white/10 px-3 py-1 rounded-xl text-base border border-white/10">
                      {formatThaiDate(d.date)}
                    </span>
                  </h4>
                  {/* Status Selector */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 self-start">
                    <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider whitespace-nowrap">สภาพรถ:</span>
                    <Select
                      value={d.status}
                      onValueChange={(val) => {
                        const newDays = [...days]
                        newDays[index].status = val
                        if (val === "breakdown") {
                          newDays[index].start_mileage = ""
                          newDays[index].end_mileage = ""
                          newDays[index].mileage_start_image = null
                          newDays[index].mileage_end_image = null
                        }
                        setDays(newDays)
                      }}
                    >
                      <SelectTrigger className="w-auto min-w-[160px] h-8 border-none bg-white/10 text-white rounded-lg font-bold focus:ring-0 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-sarabun rounded-xl border-slate-200 bg-white">
                        <SelectItem value="normal" className="font-bold text-slate-700">ปกติพร้อมใช้งาน</SelectItem>
                        <SelectItem value="breakdown" className="font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50">แจ้งรถเสีย</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Day Content Card */}
                <Card className={cn(
                  "border rounded-2xl shadow-sm overflow-hidden transition-all duration-200",
                  d.status === 'breakdown' ? "bg-white/90 border-rose-100" : "bg-white/95 border-white/20"
                )}>
                  <CardContent className="p-5 space-y-5">
                    
                    {/* ── Mileage Section ── */}
                    {d.status === "normal" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* ขาไป */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                              <Play className="size-3.5 fill-current" /> ไมล์เริ่ม (ขาไป)
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg">
                              <Lock className="size-3"/> อัตโนมัติ
                            </span>
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">เลขไมล์ก่อนเดินทาง</Label>
                            <Input
                              type="number"
                              placeholder="รอดึงข้อมูล..."
                              className="h-11 text-base font-bold font-mono bg-slate-100 border-slate-200 rounded-xl px-4 text-slate-400 cursor-not-allowed"
                              value={d.start_mileage ?? ""}
                              readOnly
                            />
                          </div>
                          <FileUploadButton
                            label="ถ่ายรูปหน้าปัด (ขาไป)"
                            loading={uploadingField === `start-${index}`}
                            onUpload={async (file) => {
                              const url = await uploadImage(file, `start-${index}`)
                              const newDays = [...days]
                              newDays[index].mileage_start_image = url
                              setDays(newDays)
                            }}
                            url={d.mileage_start_image}
                          />
                        </div>

                        {/* ขากลับ */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-rose-600">
                            <Square className="size-3.5 fill-current" /> ไมล์จบ (ขากลับ)
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">กรอกตัวเลขหลังจอดรถเสร็จสิ้น</Label>
                            <Input
                              type="number"
                              placeholder="กรอกเลขไมล์หลังเดินทาง"
                              className="h-11 text-base font-bold font-mono bg-white border-rose-200 rounded-xl px-4 focus-visible:ring-rose-400 text-black"
                              value={d.end_mileage ?? ""}
                              onChange={(e) => {
                                const val = e.target.value
                                const newDays = [...days]
                                newDays[index].end_mileage = val
                                if (newDays[index + 1] && newDays[index].status !== "breakdown") {
                                  newDays[index + 1].start_mileage = val
                                }
                                setDays(newDays)
                              }}
                            />
                          </div>
                          <FileUploadButton
                            label="ถ่ายรูปหน้าปัด (ขากลับ)"
                            loading={uploadingField === `end-${index}`}
                            onUpload={async (file) => {
                              const url = await uploadImage(file, `end-${index}`)
                              const newDays = [...days]
                              newDays[index].mileage_end_image = url
                              setDays(newDays)
                            }}
                            url={d.mileage_end_image}
                          />
                        </div>
                      </div>
                    ) : (
                      /* ── Breakdown Section ── */
                      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-3">
                        <div className="flex items-center gap-2 text-rose-600 font-bold">
                          <AlertCircle className="size-5" /> แจ้งเหตุรถเสีย / ขัดข้อง
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">รายละเอียดสาเหตุ</Label>
                          <Input
                            placeholder="เช่น ยางแตก, หม้อน้ำมีปัญหา...อื่นๆ"
                            value={d.note ?? ""}
                            onChange={(e) => {
                              const newDays = [...days]
                              newDays[index].note = e.target.value
                              setDays(newDays)
                            }}
                            className="h-11 bg-white rounded-xl border-rose-200 focus-visible:ring-rose-400 text-black"
                          />
                        </div>
                      </div>
                    )}

                    <Separator className="bg-slate-100" />

                    {/* ── Fuel Section (✅ โชว์หลายรายการ) ── */}
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
                          <Fuel className="size-4" /> ประวัติเติมน้ำมันประจำวัน
                        </div>
                        <div className="shrink-0 w-auto">
                          <FuelPopupForm 
                            d={d} 
                            index={index} 
                            uploadingField={uploadingField}
                            onUploadImage={uploadImage}
                            onSaveFuel={saveFuelDataOnly}
                          />
                        </div>
                      </div>

                      {todayFuelRecords.length > 0 ? (
                        <div className="grid gap-2 mt-2">
                          {todayFuelRecords.map((fuel, fIndex) => (
                            <div key={fuel.id} className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-amber-100 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="bg-amber-100 text-amber-700 size-6 flex items-center justify-center rounded-full text-xs font-bold">{fIndex + 1}</div>
                                <div>
                                  <p className="text-[13px] font-bold text-slate-700">
                                    ยอด <span className="text-amber-600">{fuel.fuel_cost} บาท</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400">ปริมาณ {fuel.fuel_liter} ลิตร</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" onClick={() => window.open(fuel.receipt_image, '_blank')}>
                                <Eye className="size-3 mr-1" /> ดูใบเสร็จ
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-white/50 rounded-xl border border-dashed border-amber-200">
                          <p className="text-xs text-amber-600/60 font-medium">ไม่มีรายการแวะปั๊มในวันนี้</p>
                        </div>
                      )}
                    </div>

                    {/* ── Save Button ── */}
                    <div className="flex justify-end pt-1">
                      <Button
                        className="font-bold rounded-xl h-11 px-7 bg-slate-900 hover:bg-slate-700 text-white shadow-sm transition-all text-sm"
                        onClick={() => saveDay(index)}
                        disabled={savingIndex === index}
                      >
                        {savingIndex === index
                          ? <><Loader2 className="mr-2 size-4 animate-spin" /> กำลังบันทึก...</>
                          : <><Save className="mr-2 size-4" /> บันทึกวันที่ {index + 1}</>
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Finish Button (sticky) ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 md:relative md:bg-transparent md:border-none md:p-0 md:mt-4 md:backdrop-blur-none flex justify-end">
        <Button
          className="w-full md:w-auto h-13 px-10 text-base font-bold shadow-xl shadow-blue-600/20 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-[1.01]"
          onClick={finishTrip}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="mr-2 size-5 animate-spin" /> กำลังตรวจสอบและส่งข้อมูล...</>
          ) : (
            <>ส่งรายงานและจบภารกิจ <ChevronRight className="ml-2 size-5" /></>
          )}
        </Button>
      </div>
    </div>
  )
}

// ================= MAIN PAGE =================

export default function LogbookPage() {
  const [bookings, setBookings] = useState([])
  const [activeTab, setActiveTab] = useState("today")
  const [selectedBooking, setSelectedBooking] = useState(null)
  
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null) 

  useEffect(() => {
    loadAllData()
  }, [user])

  async function loadAllData() {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setFetchError(null)

    try {
      const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileErr && profileErr.code !== 'PGRST116') throw profileErr 
      if (profile) setUserProfile(profile)

      let myDriverId = null
      if (user.role === "driver") {
        const { data: driverData, error: driverErr } = await supabase.from("drivers").select("id").eq("user_id", user.id).single()
        if (driverErr && driverErr.code !== 'PGRST116') throw driverErr
        
        if (driverData) { 
          myDriverId = driverData.id 
        } else { 
          setBookings([])
          setIsLoading(false)
          return 
        }
      }

      let query = supabase
        .from("bookings")
        .select(`id, user_name, department, destination, status, start_date, end_date, start_time, end_time, vehicle_id, driver_id, vehicles:vehicle_id ( license_plate, last_mileage ), drivers:driver_id ( name )`)
        .in("status", ["approved", "started"])
        .order("start_date", { ascending: true })

      if (user.role === "driver" && myDriverId) query = query.eq("driver_id", myDriverId)

      const { data, error } = await query
      if (error) throw error
      
      setBookings(data || [])
    } catch (error) {
      console.error("Load Logbook Error:", error)
      setFetchError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ โปรดตรวจสอบอินเทอร์เน็ต หรือปิดส่วนขยายบล็อกโฆษณา (AdBlock)")
    } finally {
      setIsLoading(false) 
    }
  }

  function startTrip(booking) {
    setSelectedBooking({ ...booking, autoStart: true })
    setActiveTab("record")
  }

  return (
    <div className="min-h-screen relative font-sarabun text-black bg-slate-900">
      
      <Image src="/images/image.png" alt="Background" fill priority className="object-cover z-0 opacity-40" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="สมุดบันทึกการใช้รถ" />
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full relative z-10">
        
        {/* ── Page Title ── */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            Logbook / สมุดลงเวลา
          </h1>
          <p className="text-white/70 text-sm mt-1">
            บันทึกเลขไมล์รถยนต์รายวัน, อัปโหลดภาพหน้าปัด และรายงานการเติมน้ำมัน
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          {/* ── Tab Switcher — unified style ── */}
          <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-2xl border border-white/20 shadow-sm inline-flex mb-5">
            <TabsList className="grid w-[340px] grid-cols-2 bg-transparent h-11 gap-1">
              <TabsTrigger
                value="today"
                className="rounded-xl font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500 transition-all text-sm"
              >
                งานที่ได้รับมอบหมาย
              </TabsTrigger>
              <TabsTrigger
                value="record"
                disabled={!selectedBooking}
                className="rounded-xl font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-500 transition-all disabled:opacity-40 text-sm"
              >
                บันทึกปัจจุบัน
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="mt-0 outline-none">
            <DriverTodayJobs
              bookings={bookings}
              startTrip={startTrip}
              isLoading={isLoading}
              onRefresh={loadAllData}
              fetchError={fetchError} 
            />
          </TabsContent>

          <TabsContent value="record" className="mt-0 outline-none">
            {selectedBooking ? (
              <TripRecordForm booking={selectedBooking} user={user} userProfile={userProfile} />
            ) : (
              <Card className="border border-white/10 bg-white/10 backdrop-blur-sm rounded-2xl mt-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-white/10 rounded-2xl p-5 mb-4">
                    <FileImage className="size-9 text-white/50" />
                  </div>
                  <p className="text-white font-bold">กรุณาเลือกงานจากแถบ "งานที่ได้รับมอบหมาย" ก่อน</p>
                  <p className="text-white/60 text-sm mt-1">เพื่อเริ่มบันทึกข้อมูลการเดินทาง</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}