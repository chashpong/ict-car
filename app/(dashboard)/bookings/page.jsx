"use client"

import { useState, useEffect } from "react"
import { Car, Search, Eye, CalendarIcon, Clock, Trash2, FileText } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, isBefore, parse } from "date-fns" 
import { th } from "date-fns/locale"
import { supabase } from "@/lib/supabase"
import Swal from 'sweetalert2'

// ✅ นำเข้าฟังก์ชันออก PDF 
import { generateForm3PDF } from "@/lib/export-pdf"

// --- 1. ตั้งค่าสถานะ ---
const statusMap = {
  pending: { label: "รอดำเนินการ", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved: { label: "อนุมัติ", className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-red-100 text-red-700 border-red-200" },
  started: { label: "กำลังเดินทาง", className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "เสร็จสิ้น", className: "bg-gray-100 text-gray-700 border-gray-200" }
}

// --- 2. ฟังก์ชันช่วยเหลือ ---
const formatThaiDate = (dateString) => {
  if (!dateString) return "ไม่ได้ระบุ";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatThaiTime = (timeString) => {
  if (!timeString) return "ไม่ได้ระบุ";
  return `${timeString.substring(0, 5)} น.`;
};

// --- 3. คอมโพเนนต์ย่อย ---
function TimePickerClock({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const [currentH, currentM] = value ? value.split(':') : ["00", "00"];
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <Clock className="mr-2 h-4 w-4" />{value ? `${value} น.` : "เลือกเวลา"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex h-[280px] divide-x border-b bg-white font-sarabun">
          <div className="flex flex-1 flex-col overflow-y-auto p-2 scrollbar-hide">
            <p className="mb-2 text-center text-[10px] font-bold text-slate-400 sticky top-0 bg-white py-1">ชั่วโมง</p>
            {hours.map((h) => (
              <Button key={h} variant={currentH === h ? "default" : "ghost"} size="sm" className={cn("mb-1", currentH === h && "bg-blue-600 text-white")} onClick={() => onChange(`${h}:${currentM}`)}>{h}</Button>
            ))}
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto p-2 scrollbar-hide">
            <p className="mb-2 text-center text-[10px] font-bold text-slate-400 sticky top-0 bg-white py-1">นาที</p>
            {minutes.map((m) => (
              <Button key={m} variant={currentM === m ? "default" : "ghost"} size="sm" className={cn("mb-1", currentM === m && "bg-blue-600 text-white")} onClick={() => onChange(`${currentH}:${m}`)}>{m}</Button>
            ))}
          </div>
        </div>
        <div className="p-2 bg-slate-50 border-t"><Button className="w-full bg-blue-700 hover:bg-blue-800 text-white" size="sm" onClick={() => setIsOpen(false)}>ตกลง</Button></div>
      </PopoverContent>
    </Popover>
  );
}

function DatePickerThai({ dateValue, onDateChange, placeholder }) {
  const date = dateValue ? new Date(dateValue) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />{date ? formatThaiDate(dateValue) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={(d) => onDateChange(d ? format(d, 'yyyy-MM-dd') : "")} locale={th} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

// ✅ แก้ไขจุดที่ 1: เพิ่ม vehicles เข้าไปในวงเล็บ (รับ props)
function BookingForm({ onClose, onSave, vehicles = [] }) { 
  const [formData, setFormData] = useState({
    user_name: "", 
    position: "", 
    department: "", 
    start_date: "", 
    end_date: "", 
    start_time: "00:00", 
    end_time: "00:00", 
    destination: "", 
    duty_details: "", 
    passengers: 1, // ✅ แก้ไขจุดที่ 2: เพิ่มเครื่องหมายคอมมาตรงนี้
    vehicle_id: "" 
  })

  return (
    <div className="flex flex-col gap-5 py-2 font-sarabun">
      {/* ... ส่วนบนคงเดิม ... */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="font-bold">ข้าพเจ้า (ผู้ขอใช้รถ) <span className="text-red-500">*</span></Label><Input value={formData.user_name} onChange={(e) => setFormData({ ...formData, user_name: e.target.value })} placeholder="ชื่อ-นามสกุล" /></div>
        <div className="space-y-2"><Label className="font-bold">ตำแหน่ง <span className="text-red-500">*</span></Label><Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="ระบุตำแหน่ง" /></div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="font-bold">สังกัดหน่วยงาน <span className="text-red-500">*</span></Label><Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="ชื่อหน่วยงาน" /></div>
        <div className="space-y-2"><Label className="font-bold">สถานที่ไปราชการ <span className="text-red-500">*</span></Label><Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} placeholder="ระบุสถานที่ปลายทาง" /></div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="font-bold">วันที่เริ่มต้น <span className="text-red-500">*</span></Label><DatePickerThai dateValue={formData.start_date} onDateChange={(d) => setFormData({ ...formData, start_date: d })} placeholder="วว/ดด/ปปปป" /></div>
        <div className="space-y-2"><Label className="font-bold">เวลาเริ่มต้น <span className="text-red-500">*</span></Label><TimePickerClock value={formData.start_time} onChange={(v) => setFormData({ ...formData, start_time: v })} /></div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="font-bold">วันที่สิ้นสุด <span className="text-red-500">*</span></Label><DatePickerThai dateValue={formData.end_date} onDateChange={(d) => setFormData({ ...formData, end_date: d })} placeholder="วว/ดด/ปปปป" /></div>
        <div className="space-y-2"><Label className="font-bold">เวลาสิ้นสุด <span className="text-red-500">*</span></Label><TimePickerClock value={formData.end_time} onChange={(v) => setFormData({ ...formData, end_time: v })} /></div>
      </div>

      {/* ✅ ส่วนเลือกรถที่หายไปในโค้ดที่คุณส่งมาแต่มีใน Error */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="font-bold">เลือกรถยนต์ที่ต้องการ <span className="text-red-500">*</span></Label>
          <Select 
            onValueChange={(v) => setFormData({ ...formData, vehicle_id: v })}
            value={formData.vehicle_id}
          >
            <SelectTrigger className="rounded-xl h-11 border-slate-200">
              <SelectValue placeholder="ค้นหารถที่ว่าง..." />
            </SelectTrigger>
            <SelectContent className="font-sarabun text-black bg-white">
              {vehicles.map((car) => (
                <SelectItem key={car.id} value={car.id}>
                  {car.license_plate} - {car.brand} {car.model}
                </SelectItem>
              ))}
              {vehicles.length === 0 && (
                <p className="text-sm p-2 text-center text-muted-foreground">ไม่มีรถว่างในขณะนี้</p>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="font-bold">มีผู้นั่งไปในครั้งนี้จำนวน (คน) <span className="text-red-500">*</span></Label>
          <Input type="number" min={1} value={formData.passengers} onChange={(e) => setFormData({ ...formData, passengers: e.target.value })} className="h-11 rounded-xl" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="font-bold">เพื่อปฏิบัติราชการเกี่ยวกับเรื่อง <span className="text-red-500">*</span></Label>
        <Textarea rows={2} value={formData.duty_details} onChange={(e) => setFormData({ ...formData, duty_details: e.target.value })} placeholder="ระบุรายละเอียดภารกิจ" className="resize-none font-sarabun" />
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose} className="px-8 font-bold text-slate-600 hover:bg-slate-50 rounded-xl">ยกเลิก</Button>
        <Button onClick={() => onSave(formData)} className="bg-blue-700 hover:bg-blue-800 px-8 font-bold text-white shadow-sm rounded-xl">ส่งคำขอจองรถ</Button>
      </div>
    </div>
  )
}

function BookingDetail({ booking, onClose }) {
  const status = statusMap[booking.status] || { label: booking.status, className: "bg-gray-100" }
  return (
    <div className="flex flex-col gap-6 py-2 font-sarabun">
      <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-blue-900">รายละเอียดข้อมูลคำขอ</h3><Badge className={cn("px-4 py-1 font-bold", status.className)}>{status.label}</Badge></div>
      <div className="grid grid-cols-2 gap-6 rounded-xl border bg-slate-50 p-6 shadow-sm">
        <div className="space-y-1"><p className="text-xs font-bold text-slate-400">ผู้ขอใช้รถ</p><p className="font-medium text-slate-900">{booking.user_name}</p></div>
        <div className="space-y-1"><p className="text-xs font-bold text-slate-400">ตำแหน่ง</p><p className="font-medium text-slate-900">{booking.position || "-"}</p></div>
        <div className="space-y-1"><p className="text-xs font-bold text-slate-400">หน่วยงาน</p><p className="font-medium text-slate-900">{booking.department}</p></div>
        <div className="space-y-1"><p className="text-xs font-bold text-slate-400">จำนวนผู้เดินทาง</p><p className="font-medium">{booking.passengers} คน</p></div>
        <div className="col-span-2 border-t pt-4"><p className="text-xs font-bold text-slate-400 mb-1 uppercase">สถานที่ปลายทาง</p><p className="font-medium">{booking.destination}</p></div>
        <div className="space-y-1"><p className="text-xs font-bold text-slate-400">วันที่เดินทาง</p><p className="font-medium text-blue-700">{formatThaiDate(booking.start_date)} - {formatThaiDate(booking.end_date)}</p></div>
        <div className="space-y-1"><p className="text-xs font-bold text-slate-400">เวลาที่ใช้รถ</p><p className="font-medium text-slate-900">{formatThaiTime(booking.start_time)} - {formatThaiTime(booking.end_time)}</p></div>
        <div className="col-span-2 border-t pt-4"><p className="text-xs font-bold text-slate-400 mb-2 uppercase">ปฏิบัติราชการเกี่ยวกับเรื่อง</p><p className="text-sm bg-white p-3 rounded border shadow-sm leading-relaxed">{booking.duty_details || booking.purpose}</p></div>
      </div>
      <div className="flex justify-end"><Button variant="secondary" onClick={onClose} className="px-12 font-bold bg-slate-800 text-white hover:bg-slate-900 rounded-xl">ปิดหน้าต่าง</Button></div>
    </div>
  )
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [detailBooking, setDetailBooking] = useState(null)

  useEffect(() => { fetchBookings() }, [])

  // ✅ แก้ไขส่วนการดึงข้อมูลเพื่อให้ PDF ดึงชื่อคนขับและเลขทะเบียนรถมาแสดงได้
  async function fetchBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        drivers ( name ),           
        vehicles ( license_plate )  
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // 💡 Mapping ข้อมูลใหม่เพื่อให้ PDF ดึงไปใช้งานได้ทันที
      const formattedData = data.map(booking => ({
        ...booking,
        driver_name: booking.drivers?.name || "....................",           
        license_plate: booking.vehicles?.license_plate || "...................." 
      }));
      setBookings(formattedData);
    } else {
      console.error("Fetch Error:", error);
    }
  }

  // เพิ่ม State สำหรับเก็บรายการรถที่ว่าง
const [availableVehicles, setAvailableVehicles] = useState([])

// เพิ่มฟังก์ชันดึงข้อมูลรถใน useEffect หรือเรียกใน fetchBookings
async function fetchAvailableVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, license_plate, brand, model")
    .eq("status", "available") // ดึงเฉพาะรถที่ว่าง

  if (!error) setAvailableVehicles(data || [])
}

useEffect(() => {
  fetchBookings()
  fetchAvailableVehicles() // ดึงรายการรถมาเตรียมไว้
}, [])


  const triggerAlert = (type, title, description) => {
    Swal.fire({
      icon: type,
      title: title,
      text: description,
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#2563eb',
      background: '#1e1e1e',
      color: '#ffffff',
      customClass: { popup: 'font-sarabun' }
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบรายการ?',
      text: "คุณต้องการลบคำขอจองรถยนต์นี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#475569',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      background: '#1e1e1e',
      color: '#ffffff',
      customClass: { popup: 'font-sarabun' }
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (!error) {
        Swal.fire({
          title: 'ลบสำเร็จ!',
          text: 'ข้อมูลถูกลบออกจากระบบแล้ว',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          background: '#1e1e1e',
          color: '#ffffff',
          customClass: { popup: 'font-sarabun' }
        });
        fetchBookings();
      } else {
        triggerAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้');
      }
    }
  };

  async function saveBooking(data) {
    const now = new Date();
    // ✅ เพิ่ม data.vehicle_id ในเงื่อนไขตรวจสอบ
  if (!data.user_name || !data.position || !data.department || !data.start_date || !data.destination || !data.duty_details || !data.passengers || !data.vehicle_id) {
    triggerAlert('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณาระบุข้อมูลที่มีเครื่องหมาย (*) และเลือกรถยนต์ให้ครบถ้วน');
    return;
  }

    if (!data.user_name || !data.position || !data.department || !data.start_date || !data.destination || !data.duty_details || !data.passengers) {
      triggerAlert('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณาระบุข้อมูลที่มีเครื่องหมาย (*) ให้ครบถ้วน');
      return;
    }

    const proposedStart = parse(`${data.start_date} ${data.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const proposedEnd = parse(`${data.end_date} ${data.end_time}`, 'yyyy-MM-dd HH:mm', new Date());

    if (isBefore(proposedStart, now)) {
      triggerAlert('warning', 'เวลาไม่ถูกต้อง', 'วันและเวลาเริ่มต้นห้ามเป็นเวลาในอดีต');
      return;
    }

    if (isBefore(proposedEnd, proposedStart)) {
      triggerAlert('warning', 'ช่วงเวลาไม่สัมพันธ์กัน', 'วันและเวลาเดินทางกลับ ห้ามมาก่อนเวลาเริ่มต้น');
      return;
    }

    const { error } = await supabase.from("bookings").insert([{ ...data, status: "pending" }])

    if (!error) {
      setCreateOpen(false); 
      setTimeout(() => {
        triggerAlert('success', 'ส่งคำขอสำเร็จ', 'ข้อมูลถูกส่งเข้าระบบเรียบร้อยแล้ว');
        fetchBookings();
      }, 300);
    } else {
      triggerAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    }
  }

  const filtered = bookings.filter((b) => {
    const term = search.toLowerCase()
    return (b.user_name?.toLowerCase().includes(term) || b.destination?.toLowerCase().includes(term) || b.department?.toLowerCase().includes(term)) && (statusFilter === "all" || b.status === statusFilter)
  })

  return (
    <div className="font-sarabun">
      <PageHeader title="การจองรถยนต์ส่วนกลาง" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-slate-50/50 min-h-screen">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">การจองรถยนต์</h1>
            <p className="text-sm text-slate-500 font-medium">ระบบจัดการคำขอจองรถยนต์ทางอิเล็กทรอนิกส์</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button className="bg-blue-700 hover:bg-blue-800 shadow-md px-6 text-white font-bold h-11 rounded-xl"><Car className="mr-2 h-4 w-4" />จองรถยนต์ใหม่</Button></DialogTrigger>
            <DialogContent 
              className="sm:max-w-3xl font-sarabun p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white"
              onPointerDownOutside={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
            >
              <DialogHeader className="bg-[#0f172a] p-6 text-white">
                <DialogTitle className="text-xl font-bold text-center tracking-wide font-sarabun">ใบขออนุญาตใช้รถส่วนกลาง (แบบ ๓)</DialogTitle>
              </DialogHeader>
              <div className="px-8 pb-4">
                 <BookingForm onClose={() => setCreateOpen(false)}  onSave={saveBooking} vehicles={availableVehicles} 
                  />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white rounded-3xl">
          <CardHeader className="bg-white border-b py-5 px-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input placeholder="ค้นหาชื่อผู้ขอ, หน่วยงาน..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 h-12 rounded-xl border-slate-200 focus:ring-blue-500 bg-slate-50 font-sarabun" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-12 rounded-xl font-sarabun">
                    <SelectValue placeholder="สถานะทั้งหมด" />
                </SelectTrigger>
                <SelectContent className="font-sarabun">
                    <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                    <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider pl-8 py-4">ผู้ขอใช้รถ</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4">หน่วยงาน</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4">วันที่เดินทาง</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4">เวลา</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider text-center py-4">สถานะ</TableHead>
                  <TableHead className="w-[150px] pr-8 text-right font-bold text-slate-500 text-xs uppercase tracking-wider py-4">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                    <TableCell className="pl-8 font-medium text-slate-700">{booking.user_name}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{booking.department}</TableCell>
                    <TableCell className="text-slate-700 font-medium">{formatThaiDate(booking.start_date)} - {formatThaiDate(booking.end_date)}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-700 font-medium">{formatThaiTime(booking.start_time)} - {formatThaiTime(booking.end_time)}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className={cn("font-medium px-3 py-1 rounded-full text-[11px]", statusMap[booking.status]?.className)}>{statusMap[booking.status]?.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => generateForm3PDF(booking)} 
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl mr-1 font-bold h-9"
                        >
                          <FileText className="size-4 mr-1" /> พิมพ์
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDetailBooking(booking)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl h-9 w-9">
                          <Eye className="size-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-9 w-9">
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
        <DialogContent 
            className="sm:max-w-2xl font-sarabun p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white" 
            onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="bg-[#0f172a] p-6 text-white relative">
            <DialogTitle className="text-xl font-bold text-center tracking-wide font-sarabun">ข้อมูลรายละเอียดคำขอจองรถ</DialogTitle>
          </DialogHeader>
          <div className="px-8 pb-4">
             {detailBooking && <BookingDetail booking={detailBooking} onClose={() => setDetailBooking(null)} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}