"use client"

import { useState, useEffect } from "react"
import { 
  Search, FileImage, MapPin, Camera, Play, 
  Square, CheckCircle2, AlertCircle, Loader2,
  Calendar as CalendarIcon, Clock, Fuel
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

import { supabase } from "@/lib/supabase"

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

/**
 * ปุ่มอัปโหลดรูปภาพพร้อม Preview
 */
function FileUploadButton({ label, onUpload, url, icon = <Camera className="size-4" />, loading = false }) {
  return (
    <div className="space-y-2">
      <Button
        variant={url ? "outline" : "secondary"}
        className={`w-full gap-2 h-11 border-dashed transition-all ${
          url ? "border-green-500 bg-green-50 text-green-600 hover:bg-green-100" : ""
        }`}
        asChild
        disabled={loading}
      >
        <label className="cursor-pointer">
          {loading ? <Loader2 className="size-4 animate-spin" /> : (url ? <CheckCircle2 className="size-4" /> : icon)}
          <span className="text-sm">{url ? "เปลี่ยนรูปภาพ" : label}</span>
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
        <div className="relative group rounded-lg overflow-hidden border aspect-video">
          <img src={url} className="w-full h-full object-cover" alt="Preview" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <p className="text-white text-xs">แตะปุ่มด้านบนเพื่อเปลี่ยนรูป</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * รายการงานวันนี้ของคนขับ
 */
function DriverTodayJobs({ bookings, startTrip }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="px-1">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CalendarIcon className="size-5 text-primary" /> งานวันนี้
        </h2>
        <p className="text-sm text-muted-foreground">รายการเดินทางที่ได้รับมอบหมาย</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <CheckCircle2 className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">ไม่มีงานค้างในวันนี้</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-l-4 border-l-primary transition-all hover:shadow-md">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{booking.user_name}</CardTitle>
                  <Badge className="bg-green-500 hover:bg-green-600">อนุมัติแล้ว</Badge>
                </div>
                <CardDescription className="font-medium text-primary/80">{booking.department}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="size-4 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium">{booking.destination}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase text-[10px]">เริ่มเดินทาง</p>
                    <p className="font-semibold">{formatThaiDate(booking.start_date)}</p>
                    <p className="flex items-center gap-1"><Clock className="size-3" /> {formatTime(booking.start_time)}</p>
                  </div>
                  <div className="space-y-1 border-l pl-3">
                    <p className="text-muted-foreground uppercase text-[10px]">สิ้นสุดงาน</p>
                    <p className="font-semibold">{formatThaiDate(booking.end_date)}</p>
                    <p className="flex items-center gap-1"><Clock className="size-3" /> {formatTime(booking.end_time)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">รถ:</span> {booking.vehicles?.license_plate} <br />
                    <span className="font-bold text-foreground">คนขับ:</span> {booking.drivers?.name}
                  </div>
                  <Button size="sm" className="rounded-full px-4" onClick={() => startTrip(booking)}>
                    <Play className="mr-2 size-3 fill-current" /> เริ่มงาน
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

/**
 * ฟอร์มบันทึกการเดินทาง (Step-by-step Timeline)
 */
function TripRecordForm({ booking }) {
  const [isStarted, setIsStarted] = useState(false)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [uploadingField, setUploadingField] = useState(null) // เก็บว่าช่องไหนกำลังโหลดรูป

  // Resume Draft
  useEffect(() => {
    const saved = localStorage.getItem("tripDraft")
    if (saved && !booking?.autoStart) {
      setDays(JSON.parse(saved))
      setIsStarted(true)
    }
  }, [])

  // Auto Save
  useEffect(() => {
    if (days.length > 0) {
      localStorage.setItem("tripDraft", JSON.stringify(days))
    }
  }, [days])

  async function startTrip() {
    if (!booking) return
    const start = new Date(booking.start_date)
    const end = booking.end_date ? new Date(booking.end_date) : new Date(booking.start_date)
    let current = new Date(start)
    let temp = []
    while (current <= end) {
      temp.push({
        date: current.toISOString().slice(0, 10),
        start_mileage: "", end_mileage: "",
        fuel_liter: "", fuel_cost: "",
        note: "", status: "normal",
        mileage_start_image: null, mileage_end_image: null, receipt_image: null
      })
      current.setDate(current.getDate() + 1)
    }
    setDays(temp)
    setIsStarted(true)
  }

  useEffect(() => {
    if (booking && booking.autoStart && !initialized) {
      startTrip()
      setInitialized(true)
    }
  }, [booking?.id])

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
      start_mileage: d.status === "breakdown" ? 0 : Number(d.start_mileage || 0),
      end_mileage: d.status === "breakdown" ? 0 : Number(d.end_mileage || 0),
      distance: d.status === "breakdown" ? 0 : Number(d.end_mileage || 0) - Number(d.start_mileage || 0),
      fuel_liter: d.fuel_liter || 0,
      fuel_cost: d.fuel_cost || 0,
      note: d.note || null,
      status: d.status,
      mileage_start_image: d.status === "breakdown" ? null : d.mileage_start_image,
      mileage_end_image: d.status === "breakdown" ? null : d.mileage_end_image,
      receipt_image: d.receipt_image,
      created_at: new Date(d.date).toISOString()
    }))

    const { error } = await supabase.from("logbooks").insert(inserts)
    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message)
      setLoading(false)
      return
    }

    localStorage.removeItem("tripDraft")
    await supabase.from("bookings").update({ status: "completed" }).eq("id", booking.id)
    alert("บันทึกข้อมูลการเดินทางเรียบร้อยแล้ว")
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Current Job Summary */}
      <Card className="bg-primary/5 border-primary/20 shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-1">
              <Badge className="mb-2 bg-primary">กำลังดำเนินการ</Badge>
              <h3 className="text-xl font-bold">{booking?.destination}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="size-3" /> {booking?.vehicles?.license_plate} • {booking?.user_name}
              </p>
            </div>
            <div className="bg-background/80 p-3 rounded-lg border flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">จำนวนวัน</p>
                <p className="font-bold">{days.length}</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">สถานะ</p>
                <p className="font-bold text-success">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline of days */}
      <div className="space-y-8">
        {isStarted && days.map((d, index) => (
          <div key={index} className="relative pl-8 border-l-2 border-dashed border-muted ml-3 space-y-4">
            {/* Timeline Indicator */}
            <div className="absolute -left-[13px] top-0 size-6 rounded-full border-4 border-background bg-primary shadow-sm flex items-center justify-center">
              <div className="size-1.5 rounded-full bg-white" />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-foreground">
                วันที่ {index + 1}: <span className="text-primary">{formatThaiDate(d.date)}</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">สภาพรถ:</span>
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
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">ปกติ</SelectItem>
                    <SelectItem value="breakdown">รถเสีย</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className={`overflow-hidden transition-all ${d.status === 'breakdown' ? 'bg-muted/40 opacity-80' : 'shadow-sm'}`}>
              <CardContent className="p-5 space-y-6">
                
                {d.status === "normal" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ไมล์เริ่ม */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-success">
                        <Play className="size-4 fill-current" /> บันทึกไมล์เริ่ม
                      </div>
                      <Input
                        type="number"
                        placeholder="กรอกเลขไมล์..."
                        className="h-12 text-lg font-mono"
                        value={d.start_mileage}
                        onChange={(e) => {
                          const newDays = [...days]
                          newDays[index].start_mileage = e.target.value
                          setDays(newDays)
                        }}
                      />
                      <FileUploadButton 
                        label="ถ่ายรูปไมล์เริ่ม" 
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

                    {/* ไมล์จบ */}
                    <div className="space-y-4 border-t pt-6 md:border-t-0 md:pt-0">
                      <div className="flex items-center gap-2 text-sm font-bold text-destructive">
                        <Square className="size-4 fill-current" /> บันทึกไมล์จบ
                      </div>
                      <Input
                        type="number"
                        placeholder="กรอกเลขไมล์..."
                        className="h-12 text-lg font-mono"
                        value={d.end_mileage}
                        onChange={(e) => {
                          const newDays = [...days]
                          newDays[index].end_mileage = e.target.value
                          setDays(newDays)
                        }}
                      />
                      <FileUploadButton 
                        label="ถ่ายรูปไมล์จบ" 
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
                  <div className="py-4 space-y-3">
                    <div className="flex items-center gap-2 text-destructive font-bold">
                      <AlertCircle className="size-5" /> แจ้งเหตุรถเสีย / ไม่ได้ใช้งาน
                    </div>
                    <Input
                      placeholder="ระบุหมายเหตุ เช่น ยางแตก, หม้อน้ำมีปัญหา..."
                      value={d.note}
                      onChange={(e) => {
                        const newDays = [...days]
                        newDays[index].note = e.target.value
                        setDays(newDays)
                      }}
                      className="bg-background"
                    />
                  </div>
                )}

                <Separator />

                {/* ส่วนน้ำมัน */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
                    <Fuel className="size-4" /> ข้อมูลน้ำมันและค่าใช้จ่าย (ถ้ามี)
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase pl-1">ปริมาณ (ลิตร)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={d.fuel_liter}
                        onChange={(e) => {
                          const newDays = [...days]
                          newDays[index].fuel_liter = e.target.value
                          setDays(newDays)
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase pl-1">ค่าน้ำมัน (บาท)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={d.fuel_cost}
                        onChange={(e) => {
                          const newDays = [...days]
                          newDays[index].fuel_cost = e.target.value
                          setDays(newDays)
                        }}
                      />
                    </div>
                  </div>
                  <FileUploadButton 
                    label="แนบใบเสร็จน้ำมัน" 
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
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Floating Submit Button (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 md:relative md:bg-transparent md:border-none md:p-0 md:mt-4">
        <Button 
          className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-xl"
          onClick={finishTrip}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="mr-2 size-5 animate-spin" /> กำลังส่งข้อมูล...</>
          ) : (
            "ส่งรายงานและจบงาน"
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

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    const { data } = await supabase
      .from("bookings")
      .select(`
        id, user_name, department, destination,
        start_date, end_date, start_time, end_time,
        vehicle_id, driver_id,
        vehicles:vehicle_id ( license_plate ),
        drivers:driver_id ( name )
      `)
      .in("status", ["approved", "started"])
    
    setBookings(data || [])
  }

  function startTrip(booking) {
    setSelectedBooking({
      ...booking,
      autoStart: true
    })
    setActiveTab("record")
  }

  return (
    <>
      <PageHeader title="สมุดบันทึกการใช้รถ" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Logbook
          </h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลการเดินทางและบันทึกเลขไมล์รายวัน
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
            <TabsTrigger value="today">งานที่ได้รับมอบหมาย</TabsTrigger>
            <TabsTrigger value="record" disabled={!selectedBooking}>บันทึกปัจจุบัน</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0 outline-none">
            <DriverTodayJobs bookings={bookings} startTrip={startTrip} />
          </TabsContent>

          <TabsContent value="record" className="mt-0 outline-none">
            {selectedBooking ? (
              <TripRecordForm booking={selectedBooking} />
            ) : (
              <div className="text-center py-20 border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">ยังไม่มีงานที่กำลังดำเนินการ</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}