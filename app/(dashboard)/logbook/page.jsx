"use client"

import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import Image from "next/image" // ✅ 1. นำเข้า Next Image
import { 
  Search, FileImage, MapPin, Camera, Play, 
  Square, CheckCircle2, AlertCircle, Loader2,
  Calendar as CalendarIcon, Clock, Fuel, Save, ChevronRight, Navigation,
  Car, UserCheck, RefreshCw 
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
import { cn } from "@/lib/utils" // ✅ นำเข้า cn เผื่อใช้กับปุ่มรีเฟรช

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
        className={`w-full gap-2 h-12 rounded-xl border-dashed transition-all font-bold ${
          url ? "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
        asChild
        disabled={loading}
      >
        <label className="cursor-pointer">
          {loading ? <Loader2 className="size-4 animate-spin" /> : (url ? <CheckCircle2 className="size-4" /> : icon)}
          <span className="text-sm">{url ? "อัปโหลดรูปสำเร็จ (คลิกเพื่อเปลี่ยน)" : label}</span>
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
            <p className="text-white text-xs font-bold flex items-center gap-1"><Camera className="size-3"/> แตะเพื่อเปลี่ยนรูป</p>
          </div>
        </div>
      )}
    </div>
  )
}

function DriverTodayJobs({ bookings, startTrip, isLoading, onRefresh }) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-2 pt-2 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 drop-shadow-md">
            <CalendarIcon className="size-6 text-blue-400" /> งานวันนี้ของคุณ
          </h2>
          <p className="text-sm text-white/90 mt-1 drop-shadow-sm">รายการเดินทางที่ได้รับการอนุมัติและรอการดำเนินการ</p>
        </div>
        
        {/* ✅ ปุ่มรีเฟรชเฉพาะส่วน */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onRefresh} 
          disabled={isLoading}
          className="h-10 w-10 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm"
          title="รีเฟรชงานใหม่"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <Card className="border-none bg-white/90 backdrop-blur-sm shadow-sm rounded-[2rem] h-64 flex flex-col items-center justify-center text-slate-500">
           <Loader2 className="size-8 animate-spin text-blue-500 mb-3" />
           <p className="font-bold text-sm">กำลังตรวจสอบงานของคุณ...</p>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="border-dashed border-2 border-white/20 bg-black/30 backdrop-blur-md shadow-none rounded-[2rem]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-white/10 rounded-full p-6 mb-4">
              <CheckCircle2 className="size-10 text-white/60" />
            </div>
            <p className="text-white font-bold text-lg">ไม่มีงานค้างในวันนี้</p>
            <p className="text-white/70 text-sm mt-1">คุณสามารถพักผ่อนได้เลย หรือรอรับงานใหม่</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[1.5rem] bg-white/95 backdrop-blur-sm group">
              <CardHeader className="pb-4 bg-slate-50/80 border-b border-slate-200/60 px-6 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-slate-800 leading-tight">{booking.user_name}</CardTitle>
                    <CardDescription className="font-bold text-blue-600 text-xs bg-blue-50 w-fit px-2 py-0.5 rounded-md">{booking.department}</CardDescription>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold shadow-none rounded-lg px-3 py-1">
                    อนุมัติแล้ว
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 flex flex-col gap-6">
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="bg-blue-100 p-2 rounded-xl shrink-0">
                    <Navigation className="size-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">จุดหมายปลายทาง</p>
                    <p className="font-bold text-slate-800 text-[15px]">{booking.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 px-2">
                  <div className="space-y-1.5 relative">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">เริ่มเดินทาง</p>
                    <p className="font-extrabold text-slate-800">{formatThaiDate(booking.start_date)}</p>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md"><Clock className="size-3" /> {formatTime(booking.start_time)}</p>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-10 bg-slate-200"></div>
                  </div>
                  <div className="space-y-1.5 pl-2">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">สิ้นสุดงาน</p>
                    <p className="font-extrabold text-slate-800">{formatThaiDate(booking.end_date)}</p>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 w-fit px-2 py-0.5 rounded-md"><Clock className="size-3" /> {formatTime(booking.end_time)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-[12px] font-medium text-slate-500 space-y-1">
                    <p className="flex items-center gap-2"><Car className="size-3.5 text-slate-400"/> <span className="font-bold text-slate-700">{booking.vehicles?.license_plate}</span></p>
                    <p className="flex items-center gap-2"><UserCheck className="size-3.5 text-slate-400"/> {booking.drivers?.name}</p>
                  </div>
                  <Button 
                    className="rounded-xl px-6 h-12 bg-slate-900 hover:bg-blue-600 text-white font-bold shadow-md transition-all group-hover:shadow-blue-200" 
                    onClick={() => startTrip(booking)}
                  >
                    <Play className="mr-2 size-4 fill-current" /> {booking.status === 'started' ? "บันทึกต่อ" : "เริ่มงาน"}
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
  const [loading, setLoading] = useState(false)
  const [uploadingField, setUploadingField] = useState(null)
  const [savingIndex, setSavingIndex] = useState(null) 

  useEffect(() => {
    async function loadLogs() {
      if (!booking) return

      const { data: savedLogs } = await supabase
        .from("logbooks")
        .select("*")
        .eq("booking_id", booking.id)
        .order("log_date", { ascending: true })

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
    }

    loadLogs()
  }, [booking])

  async function uploadImage(file, fieldKey) {
    if (!file) return null
    setUploadingField(fieldKey)
    const fileName = `${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from("logbook-images").upload(fileName, file)
    
    if (error) {
      alert("อัปโหลดรูปไม่สำเร็จ")
      setUploadingField(null)
      return null
    }

    const { data } = supabase.storage.from("logbook-images").getPublicUrl(fileName)
    setUploadingField(null)
    return data.publicUrl
  }

  async function saveDay(index) {
    setSavingIndex(index)
    const d = days[index]
    
    const startM = Number(d.start_mileage) || 0
    const endM = Number(d.end_mileage) || 0
    const dist = endM - startM

    const payload = {
      booking_id: booking.id,
      vehicle_id: booking.vehicle_id,
      driver_id: booking.driver_id,
      log_date: d.date, 
      start_mileage: d.status === "breakdown" ? 0 : startM,
      end_mileage: d.status === "breakdown" ? 0 : endM,
      distance: dist > 0 ? dist : 0,
      fuel_liter: Number(d.fuel_liter) || 0,
      fuel_cost: Number(d.fuel_cost) || 0,
      note: d.note || null,
      status: d.status,
      mileage_start_image: d.status === "breakdown" ? null : d.mileage_start_image,
      mileage_end_image: d.status === "breakdown" ? null : d.mileage_end_image,
      receipt_image: d.receipt_image
    }

    const { data: oldLog } = await supabase.from("logbooks").select("*").eq('booking_id', booking.id).eq('log_date', d.date).single()

    const { data: newLog, error } = await supabase.from("logbooks").upsert(payload, { 
      onConflict: 'booking_id, log_date' 
    }).select().single()

    if (error) {
      Swal.fire('ข้อผิดพลาด', error.message, 'error')
      setSavingIndex(null)
      return
    }

    if (user && newLog) {
       await supabase.from('audit_logs').insert([{
         user_id: user.id,
         user_name: userProfile?.full_name || user.email,
         action: 'UPDATE',
         entity_type: 'logbooks',
         entity_id: String(newLog.id),
         old_data: oldLog || null,
         new_data: newLog
       }]);
    }

    if (d.status === "breakdown") {
      await supabase.from("vehicles").update({ status: "maintenance" }).eq("id", booking.vehicle_id)
      
      await supabase.from("maintenance").insert([{
        vehicle_id: booking.vehicle_id,
        vehicle_plate: booking.vehicles?.license_plate || "ไม่ทราบทะเบียน", 
        type: "แจ้งรถเสีย", 
        date: d.date, 
        description: d.note || "แจ้งรถเสียระหว่างปฏิบัติงาน", 
        cost: 0 
      }])

      Swal.fire({ 
        icon: 'warning', 
        title: 'แจ้งรถเสียสำเร็จ', 
        text: 'ระบบได้ระงับการใช้งานรถคันนี้ และส่งเรื่องไปยังฝ่ายซ่อมบำรุงเรียบร้อยแล้ว', 
        confirmButtonColor: '#d33' 
      })
    } else {
      Swal.fire({ 
        icon: 'success', 
        title: 'บันทึกสำเร็จ', 
        text: `บันทึกข้อมูลของวันที่ ${formatThaiDate(d.date)} เก็บเข้าระบบแล้ว ท่านสามารถออกจากหน้านี้ได้`, 
        timer: 2000, 
        showConfirmButton: false 
      })
    }

    if (booking.status !== 'started') {
      await supabase.from("bookings").update({ status: "started" }).eq("id", booking.id)
    }
    
    setSavingIndex(null)
  }

  function validate() {
    for (let d of days) {
      if (d.status !== "breakdown") {
        if (!d.start_mileage || !d.end_mileage) {
          alert(`กรุณากรอกเลขไมล์ของวันที่ ${formatThaiDate(d.date)} ให้ครบถ้วน`)
          return false
        }
        if (!d.mileage_start_image || !d.mileage_end_image) {
          alert(`กรุณาแนบรูปไมล์เริ่มและไมล์จบของวันที่ ${formatThaiDate(d.date)}`)
          return false
        }
      }
      if (Number(d.fuel_cost) > 0 && !d.receipt_image) {
        alert(`กรุณาแนบใบเสร็จน้ำมันของวันที่ ${formatThaiDate(d.date)}`)
        return false
      }
      if (d.status === "breakdown" && !d.note) {
        alert(`กรุณาระบุหมายเหตุในวันที่รถเสีย (${formatThaiDate(d.date)})`)
        return false
      }
    }
    return true
  }

  async function finishTrip() {
    if (!validate()) return
    setLoading(true)

    const inserts = days.map(d => ({
      booking_id: booking.id,
      vehicle_id: booking.vehicle_id,
      driver_id: booking.driver_id,
      log_date: d.date, 
      start_mileage: d.status === "breakdown" ? 0 : Number(d.start_mileage || 0),
      end_mileage: d.status === "breakdown" ? 0 : Number(d.end_mileage || 0),
      distance: d.status === "breakdown" ? 0 : (Number(d.end_mileage || 0) - Number(d.start_mileage || 0)),
      fuel_liter: Number(d.fuel_liter) || 0,
      fuel_cost: Number(d.fuel_cost) || 0,
      note: d.note || null,
      status: d.status,
      mileage_start_image: d.status === "breakdown" ? null : d.mileage_start_image,
      mileage_end_image: d.status === "breakdown" ? null : d.mileage_end_image,
      receipt_image: d.receipt_image,
    }))

    const { error } = await supabase.from("logbooks").upsert(inserts, { onConflict: 'booking_id, log_date' })
    
    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message)
      setLoading(false)
      return
    }

    const hasBreakdown = days.some(d => d.status === "breakdown")
    const lastDay = days[days.length - 1]
    const finalMileage = Number(lastDay.end_mileage) || 0
    
    const finalVehicleStatus = hasBreakdown ? "maintenance" : "available"

    await supabase.from("vehicles").update({ 
      last_mileage: finalMileage, 
      status: finalVehicleStatus 
    }).eq("id", booking.vehicle_id)

    await supabase.from("drivers").update({ status: "available" }).eq("id", booking.driver_id)
    await supabase.from("bookings").update({ status: "completed" }).eq("id", booking.id)

    if (user) {
       await supabase.from('audit_logs').insert([{
         user_id: user.id,
         user_name: userProfile?.full_name || user.email,
         action: 'UPDATE',
         entity_type: 'bookings',
         entity_id: String(booking.id),
         old_data: { status: 'started' },
         new_data: { status: 'completed' }
       }]);
    }
    
    Swal.fire('สำเร็จ', 'ส่งรายงานและสิ้นสุดการเดินทางเรียบร้อยแล้ว', 'success').then(() => {
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-none shadow-lg rounded-3xl text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 p-4"><Car className="size-32" /></div>
        <CardContent className="pt-6 relative z-10 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="space-y-2">
              <Badge className="mb-2 bg-white/20 text-white hover:bg-white/30 border-none">กำลังดำเนินการเดินทาง</Badge>
              <h3 className="text-2xl font-extrabold drop-shadow-sm">{booking?.destination}</h3>
              <p className="text-sm text-blue-100 flex items-center gap-2 font-medium">
                <MapPin className="size-4" /> ทะเบียนรถ: <span className="text-white font-bold">{booking?.vehicles?.license_plate}</span> • ผู้จอง: {booking?.user_name}
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex items-center gap-6 backdrop-blur-sm self-start">
              <div className="text-center">
                <p className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">จำนวนวันเดินทาง</p>
                <p className="font-extrabold text-2xl">{days.length}</p>
              </div>
              <Separator orientation="vertical" className="h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">สถานะ</p>
                <p className="font-extrabold text-emerald-300 text-lg flex items-center justify-center gap-1 mt-1"><CheckCircle2 className="size-4"/> Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8 pl-2 md:pl-6 relative border-l-2 border-slate-200 ml-4 md:ml-6 bg-white/80 backdrop-blur-sm rounded-r-3xl py-4 pr-4">
        {isStarted && days.map((d, index) => (
          <div key={index} className="relative pl-6 md:pl-10 space-y-4">
            {/* Timeline Dot */}
            <div className="absolute -left-[29px] top-4 size-14 rounded-full border-[6px] border-slate-50 bg-blue-600 shadow-md flex items-center justify-center z-10 text-white font-bold text-sm">
              D{index + 1}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <h4 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                วันที่ {index + 1}: <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{formatThaiDate(d.date)}</span>
              </h4>
              <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-2">สภาพรถ:</span>
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
                  <SelectTrigger className="w-[130px] h-9 border-none bg-slate-100 rounded-lg font-bold focus:ring-0 text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-sarabun rounded-xl border-slate-200 bg-white">
                    <SelectItem value="normal" className="font-bold text-slate-700">ปกติพร้อมใช้งาน</SelectItem>
                    <SelectItem value="breakdown" className="font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50">แจ้งรถเสีย</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className={`overflow-hidden transition-all duration-300 border-none rounded-3xl ${d.status === 'breakdown' ? 'bg-slate-100/80 opacity-90' : 'bg-white shadow-md border border-slate-100'}`}>
              <CardContent className="p-6 md:p-8 space-y-8">
                
                {d.status === "normal" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ขาไป (ไมล์เริ่ม) */}
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-blue-600 bg-blue-100/50 w-fit px-3 py-1.5 rounded-lg">
                        <Play className="size-4 fill-current" /> บันทึกไมล์เริ่ม (ขาไป)
                      </div>
                      <Input
                        type="number"
                        placeholder="ระบุตัวเลขไมล์รถ..."
                        className="h-14 text-xl font-bold font-mono bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-blue-500 shadow-sm text-black"
                        value={d.start_mileage}
                        onChange={(e) => {
                          const newDays = [...days]
                          newDays[index].start_mileage = e.target.value
                          setDays(newDays)
                        }}
                      />
                      <FileUploadButton 
                        label="ถ่ายรูปหน้าปัด (ไมล์เริ่ม)" 
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

                    {/* ขากลับ (ไมล์จบ) */}
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-rose-600 bg-rose-100/50 w-fit px-3 py-1.5 rounded-lg">
                        <Square className="size-4 fill-current" /> บันทึกไมล์จบ (ขากลับ)
                      </div>
                      <Input
                        type="number"
                        placeholder="ระบุตัวเลขไมล์รถ..."
                        className="h-14 text-xl font-bold font-mono bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-rose-500 shadow-sm text-black"
                        value={d.end_mileage}
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
                      <FileUploadButton 
                        label="ถ่ายรูปหน้าปัด (ไมล์จบ)" 
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
                  <div className="py-6 px-4 space-y-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-2 text-rose-600 font-extrabold text-lg">
                      <AlertCircle className="size-6" /> แจ้งเหตุรถเสีย / ขัดข้อง
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">รายละเอียดสาเหตุที่รถไม่สามารถใช้งานได้</Label>
                      <Input
                        placeholder="เช่น ยางแตก, หม้อน้ำมีปัญหา, สตาร์ทไม่ติด..."
                        value={d.note}
                        onChange={(e) => {
                          const newDays = [...days]
                          newDays[index].note = e.target.value
                          setDays(newDays)
                        }}
                        className="bg-white h-12 rounded-xl border-rose-200 focus-visible:ring-rose-500 text-black"
                      />
                    </div>
                  </div>
                )}

                <Separator className="bg-slate-100" />

                {/* ข้อมูลน้ำมัน */}
                <div className="space-y-5 bg-amber-50/30 p-5 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-amber-700 bg-amber-100/50 w-fit px-3 py-1.5 rounded-lg">
                    <Fuel className="size-4" /> เติมน้ำมันและค่าใช้จ่าย (ระบุเฉพาะวันที่มีการเติม)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">ปริมาณน้ำมัน (ลิตร)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={d.fuel_liter}
                        className="h-12 rounded-xl border-slate-200 bg-white font-mono font-bold text-black"
                        onChange={(e) => {
                          const newDays = [...days]
                          newDays[index].fuel_liter = e.target.value
                          setDays(newDays)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">ยอดชำระ (บาท)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={d.fuel_cost}
                        className="h-12 rounded-xl border-slate-200 bg-white font-mono font-bold text-amber-600 focus-visible:ring-amber-500"
                        onChange={(e) => {
                          const newDays = [...days]
                          newDays[index].fuel_cost = e.target.value
                          setDays(newDays)
                        }}
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1 pt-6">
                      <FileUploadButton 
                        label="แนบรูปใบเสร็จ" 
                        icon={<FileImage className="size-4" />}
                        loading={uploadingField === `receipt-${index}`}
                        onUpload={async (file) => {
                          const url = await uploadImage(file, `receipt-${index}`)
                          const newDays = [...days]
                          newDays[index].receipt_image = url
                          setDays(newDays)
                        }}
                        url={d.receipt_image}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    className="font-bold rounded-xl h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all" 
                    onClick={() => saveDay(index)} 
                    disabled={savingIndex === index}
                  >
                    {savingIndex === index ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                    บันทึกข้อมูล (วันที่ {index + 1}) ลงระบบ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 md:relative md:bg-transparent md:border-none md:p-0 md:mt-8 md:backdrop-blur-none flex justify-end">
        <Button 
          className="w-full md:w-auto h-14 px-10 text-lg font-bold shadow-xl shadow-blue-600/20 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-[1.02]"
          onClick={finishTrip}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="mr-2 size-5 animate-spin" /> กำลังตรวจสอบและส่งข้อมูล...</>
          ) : (
            <>เสร็จสิ้นภารกิจและส่งรายงาน <ChevronRight className="ml-2 size-5" /></>
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
  
  // ✅ 2. เพิ่ม State จัดการ Loading
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAllData() // ✅ 3. เรียกใช้ฟังก์ชันดึงรวดเดียวตอนเข้าหน้าเว็บ
    }
  }, [user])

  // ✅ 4. รวบรวมการดึง Profile และ Bookings ให้อยู่ในฟังก์ชันเดียวกัน
  async function loadAllData() {
    setIsLoading(true);
    try {
      // 4.1 ดึง Profile ของคนที่ล็อกอินอยู่ก่อน
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) setUserProfile(profile);

      // 4.2 ตรวจสอบว่าเป็นคนขับหรือไม่
      let myDriverId = null;
      if (user.role === "driver") {
        const { data: driverData } = await supabase.from("drivers").select("id").eq("user_id", user.id).single();
        if (driverData) {
          myDriverId = driverData.id;
        } else {
          setBookings([]);
          return; 
        }
      }

      // 4.3 ดึงคิวจองรถที่ได้รับการอนุมัติแล้ว
      let query = supabase
        .from("bookings")
        .select(`
          id, user_name, department, destination, status,
          start_date, end_date, start_time, end_time,
          vehicle_id, driver_id,
          vehicles:vehicle_id ( license_plate, last_mileage ),
          drivers:driver_id ( name )
        `)
        .in("status", ["approved", "started"])
        .order("start_date", { ascending: true })

      if (user.role === "driver" && myDriverId) {
        query = query.eq("driver_id", myDriverId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      setBookings(data || []);

    } catch (error) {
      console.error("Fetch Error:", error.message);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถดึงข้อมูลได้',
        text: `รายละเอียด: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function startTrip(booking) {
    setSelectedBooking({
      ...booking,
      autoStart: true
    })
    setActiveTab("record")
  }

  return (
    // ✅ 5. ลบ backgroundImage ออก เปลี่ยนไปใช้ `<Image />`
    <div className="min-h-screen relative font-sarabun text-black bg-slate-900">
      
      {/* โหลดรูปพื้นหลังแบบ Priority และบีบอัด */}
      <Image 
        src="/images/image.png" 
        alt="Background" 
        fill 
        priority 
        className="object-cover z-0 opacity-40" 
      />
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="สมุดบันทึกการใช้รถ" />
      </div>

      <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto w-full relative z-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            Logbook / สมุดลงเวลา
          </h1>
          <p className="text-white/90 font-medium drop-shadow-sm">
            บันทึกเลขไมล์รถยนต์รายวัน, อัปโหลดภาพหน้าปัด และรายงานการเติมน้ำมัน
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white/90 p-1.5 rounded-2xl border border-white/20 shadow-sm inline-block mb-6 backdrop-blur-sm">
            <TabsList className="grid w-[350px] grid-cols-2 bg-transparent h-12">
              <TabsTrigger 
                value="today" 
                className="rounded-xl font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500 transition-all"
              >
                งานที่ได้รับมอบหมาย
              </TabsTrigger>
              <TabsTrigger 
                value="record" 
                disabled={!selectedBooking}
                className="rounded-xl font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-500 transition-all"
              >
                บันทึกปัจจุบัน
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="mt-0 outline-none">
            {/* ✅ 6. ส่งสถานะ Loading และฟังก์ชัน Load ข้อมูลให้ Component ย่อยเพื่อทำปุ่มรีเฟรช */}
            <DriverTodayJobs 
              bookings={bookings} 
              startTrip={startTrip} 
              isLoading={isLoading} 
              onRefresh={loadAllData} 
            />
          </TabsContent>

          <TabsContent value="record" className="mt-0 outline-none">
            {selectedBooking ? (
              <TripRecordForm booking={selectedBooking} user={user} userProfile={userProfile} />
            ) : (
              <Card className="border-dashed border-2 border-white/20 bg-black/30 backdrop-blur-md shadow-none rounded-[2rem] mt-4">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-white/10 rounded-full p-6 mb-4">
                    <FileImage className="size-10 text-white/60" />
                  </div>
                  <p className="text-white font-bold text-lg">กรุณาเลือกงานจากแถบ "งานที่ได้รับมอบหมาย" ก่อน</p>
                  <p className="text-white/70 text-sm mt-1">เพื่อเริ่มบันทึกข้อมูลการเดินทางของคุณ</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}