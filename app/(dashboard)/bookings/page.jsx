"use client"

import { useState, useEffect } from "react"
import Image from "next/image" 
import { 
  Car, Search, Eye, CalendarIcon, Clock, Trash2, 
  User, Phone, MapPin, CheckCircle2, 
  AlertCircle, Info, Loader2, Users, ClipboardList,
  FileText, Flag, XCircle, RefreshCw 
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, isBefore, parse, startOfToday } from "date-fns" 
import { th } from "date-fns/locale"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context" 
import Swal from 'sweetalert2'

// --- 1. ข้อมูลพื้นฐาน ---
const statusMap = {
  pending: { label: "รอดำเนินการ", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved: { label: "อนุมัติ", className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-red-100 text-red-700 border-red-200" },
  started: { label: "กำลังเดินทาง", className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "เสร็จสิ้น", className: "bg-gray-100 text-gray-700 border-gray-200" }
}

const vehicleTypes = ["ไม่ระบุ", "รถเก๋ง", "รถกระบะ", "รถตู้", "รถบัส/รถโดยสาร", "SUV", "รถบรรทุก", "อื่นๆ"]

const formatThaiDate = (dateString) => {
  if (!dateString) return "ไม่ได้ระบุ";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatThaiTime = (timeString) => {
  if (!timeString) return "ไม่ได้ระบุ";
  return `${timeString.substring(0, 5)} น.`;
};

// --- 2. คอมโพเนนต์ย่อย (Picker) ---
function TimePickerClock({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"]; 
  const [currentH, currentM] = value ? value.split(':') : ["08", "00"];
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl h-11", !value && "text-muted-foreground")}>
          <Clock className="mr-2 h-4 w-4" />{value ? `${value} น.` : "เลือกเวลา"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 rounded-2xl overflow-hidden" align="start">
        <div className="flex h-[240px] divide-x border-b bg-white font-sarabun text-black">
          <div className="flex flex-1 flex-col overflow-y-auto p-2 scrollbar-hide">
            {hours.map((h) => (
              <Button key={h} variant={currentH === h ? "default" : "ghost"} size="sm" className={cn("mb-1", currentH === h && "bg-blue-600 text-white")} onClick={() => onChange(`${h}:${currentM}`)}>{h}</Button>
            ))}
          </div>
          <div className="flex flex-1 flex-col p-2">
            {minutes.map((m) => (
              <Button key={m} variant={currentM === m ? "default" : "ghost"} size="sm" className={cn("mb-1", currentM === m && "bg-blue-600 text-white")} onClick={() => onChange(`${currentH}:${m}`)}>{m}</Button>
            ))}
          </div>
        </div>
        <div className="p-2 bg-slate-50"><Button className="w-full bg-blue-700 text-white rounded-lg" size="sm" onClick={() => setIsOpen(false)}>ตกลง</Button></div>
      </PopoverContent>
    </Popover>
  );
}

function DatePickerThai({ dateValue, onDateChange, placeholder }) {
  const date = dateValue ? new Date(dateValue) : undefined;
  
  const today = startOfToday(); 

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal rounded-xl h-11", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />{date ? formatThaiDate(dateValue) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl bg-white" align="start">
        <Calendar 
          mode="single" 
          selected={date} 
          onSelect={(d) => onDateChange(d ? format(d, 'yyyy-MM-dd') : "")} 
          locale={th} 
          initialFocus 
          className="text-black font-sarabun" 
          disabled={(date) => isBefore(date, today)} 
        />
      </PopoverContent>
    </Popover>
  );
}

// --- 3. ฟอร์มการจอง (BookingForm) ---
// --- 3. ฟอร์มการจอง (BookingForm) ---
function BookingForm({ onClose, onSave, vehicles = [], allBookings = [] }) { 
  const [formData, setFormData] = useState({
    user_name: "", position: "", department: "", 
    start_date: format(new Date(), 'yyyy-MM-dd'), end_date: format(new Date(), 'yyyy-MM-dd'), 
    start_time: "08:30", end_time: "16:30", 
    destination: "", origin: "หน่วยงานต้นสังกัด", purpose: "", duty_details: "", 
    passengers: 1, vehicle_id: "", vehicle_type_preference: "ไม่ระบุ", contact_phone: "" 
  })

  const getVehicleStatus = (car) => {
    if (car.status !== 'available') return { status: 'busy', reason: car.status === 'maintenance' ? 'อยู่ระหว่างซ่อมบำรุง' : 'กำลังปฏิบัติงาน' };
    const startReq = parse(`${formData.start_date} ${formData.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const endReq = parse(`${formData.end_date} ${formData.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const conflict = allBookings.find(b => {
      if (b.vehicle_id !== car.id || b.status === 'rejected' || b.status === 'completed') return false;
      const bStart = parse(`${b.start_date} ${b.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
      const bEnd = parse(`${b.end_date} ${b.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
      return isBefore(startReq, bEnd) && isBefore(bStart, endReq);
    });
    return conflict ? { status: 'busy', reason: 'ชนเวลาจอง' } : { status: 'available' };
  }

  return (
    // ✅ เพิ่ม max-h-[75vh] และ overflow-y-auto ตรงนี้เพื่อให้เนื้อหาด้านในเลื่อนได้
    <div className="flex flex-col py-4 font-sarabun text-slate-800 max-h-[75vh]">
      
      {/* 🔴 ส่วนเนื้อหาฟอร์ม (เลื่อนได้) */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 md:border-r md:pr-6 border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase ml-1">ผู้ขอใช้รถ</Label>
                <Input value={formData.user_name} onChange={(e) => setFormData({ ...formData, user_name: e.target.value })} placeholder="ชื่อ-นามสกุล" className="h-11 rounded-xl bg-white border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase ml-1">ตำแหน่ง</Label>
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="ระบุตำแหน่ง" className="h-11 rounded-xl bg-white border-slate-200" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase ml-1">สังกัดหน่วยงาน</Label>
              <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="กอง/ฝ่าย" className="h-11 rounded-xl bg-white border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase ml-1">วัตถุประสงค์การใช้รถ <span className="text-red-500">*</span></Label>
              <Input value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="เช่น ไปราชการเรื่อง..." className="h-11 rounded-xl bg-white border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase ml-1">รายละเอียดภารกิจ</Label>
              <Textarea rows={2} value={formData.duty_details} onChange={(e) => setFormData({ ...formData, duty_details: e.target.value })} placeholder="รายละเอียดเพิ่มเติม" className="rounded-xl resize-none font-sarabun bg-white border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase ml-1">จำนวนผู้ร่วมทาง (คน)</Label>
                <Input type="number" min={1} value={formData.passengers} onChange={(e) => setFormData({ ...formData, passengers: e.target.value })} className="h-11 rounded-xl bg-white border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase ml-1">ประเภทรถที่ขอ</Label>
                <Select onValueChange={(v) => setFormData({ ...formData, vehicle_type_preference: v })} value={formData.vehicle_type_preference}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-sarabun text-black bg-white">
                    {vehicleTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase ml-1">เบอร์ติดต่อกลับ <span className="text-red-500">*</span></Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-3.5 size-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="ชื่อ / เบอร์โทรศัพท์" className="pl-10 h-11 rounded-xl bg-white border-slate-200" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 ml-1">วันที่เริ่ม <span className="text-red-500">*</span></Label>
                <DatePickerThai dateValue={formData.start_date} onDateChange={(d) => setFormData({ ...formData, start_date: d })} placeholder="เริ่มเดินทาง" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 ml-1">เวลาเริ่ม <span className="text-red-500">*</span></Label>
                <TimePickerClock value={formData.start_time} onChange={(v) => setFormData({ ...formData, start_time: v })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 ml-1">วันที่สิ้นสุด <span className="text-red-500">*</span></Label>
                <DatePickerThai dateValue={formData.end_date} onDateChange={(d) => setFormData({ ...formData, end_date: d })} placeholder="เดินทางกลับ" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 ml-1">เวลาสิ้นสุด <span className="text-red-500">*</span></Label>
                <TimePickerClock value={formData.end_time} onChange={(v) => setFormData({ ...formData, end_time: v })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b pb-4 border-dashed border-slate-200">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 ml-1">ต้นทาง</Label>
                <Input value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} className="h-11 rounded-xl bg-white border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 ml-1">ปลายทาง <span className="text-red-500">*</span></Label>
                <Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="h-11 rounded-xl bg-white border-slate-200" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-bold flex items-center gap-2 text-slate-700">
                  <Car className="size-4 text-blue-600" /> ตรวจสถานะรถที่ว่าง
                </Label>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold text-[10px]">
                  รถทั้งหมด {vehicles.length} คัน
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {vehicles.map((car) => {
                  const avail = getVehicleStatus(car); 
                  const isSelected = formData.vehicle_id === car.id;
                  const isBusy = avail.status === 'busy';
                  return (
                    <div 
                      key={car.id} 
                      onClick={() => !isBusy && setFormData({ ...formData, vehicle_id: car.id })}
                      className={cn(
                        "p-3 rounded-2xl border-2 transition-all cursor-pointer relative group",
                        isSelected ? "border-blue-600 bg-blue-50 shadow-md" : "border-slate-100 bg-white hover:border-slate-200",
                        isBusy && "opacity-50 cursor-not-allowed bg-slate-50 grayscale"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl", isBusy ? "bg-slate-200" : "bg-emerald-100 text-emerald-600")}>
                          <Car className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate text-slate-900">{car.license_plate}</p>
                          <p className="text-[10px] text-slate-500 truncate">{car.brand} {car.model}</p>
                          <div className={cn("mt-1 flex items-center gap-1 text-[9px] font-bold", isBusy ? "text-rose-600" : "text-emerald-600")}>
                             {isBusy ? <AlertCircle className="size-2" /> : <CheckCircle2 className="size-2" />}
                             {isBusy ? avail.reason : "ว่างพร้อมใช้"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🔴 ส่วน Footer ปุ่มกด (ยึดติดอยู่ล่างสุดเสมอ) */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 mt-2 shrink-0">
        <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto px-10 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">ยกเลิก</Button>
        <Button 
          onClick={() => onSave(formData)} 
          disabled={!formData.vehicle_id || !formData.purpose || !formData.contact_phone}
          className="w-full sm:w-auto bg-[#0f172a] hover:bg-slate-800 px-12 h-12 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-[1.02]"
        >
          ส่งคำขอจองรถยนต์
        </Button>
      </div>
    </div>
  )
}

// --- 4. คอมโพเนนต์แสดง Timeline สถานะ ---
function BookingTimelineDialog({ booking, onClose }) {
  if (!booking) return null;

  const getStepStatus = (stepName) => {
    const status = booking.status;
    if (status === 'rejected') {
      if (stepName === 'pending') return 'completed'; 
      if (stepName === 'approved') return 'rejected'; 
      return 'pending'; 
    }
    const flow = ['pending', 'approved', 'started', 'completed'];
    const currentIndex = flow.indexOf(status);
    const stepIndex = flow.indexOf(stepName);

    if (stepIndex < currentIndex) return 'completed';
    // ✅ แก้ไขส่วนนี้: ถ้าระบบบอกว่า "เสร็จสิ้น" ให้ขึ้นเช็คถูกเลย ไม่ต้องหมุนรอ
    if (stepIndex === currentIndex) return status === 'completed' ? 'completed' : 'current';
    return 'pending';
  };

  const steps = [
    { id: 'pending', title: 'ส่งคำขอจองรถ', desc: 'ระบบได้รับคำขอของคุณแล้ว รอผู้มีอำนาจพิจารณา', icon: <FileText className="size-5" /> },
    { id: 'approved', title: 'อนุมัติ & จัดสรรรถ', desc: booking.status === 'rejected' ? 'คำขอของคุณไม่ได้รับการอนุมัติ' : 'พิจารณาอนุมัติพร้อมจัดสรรรถและคนขับเรียบร้อย', icon: booking.status === 'rejected' ? <XCircle className="size-5" /> : <CheckCircle2 className="size-5" /> },
    { id: 'started', title: 'กำลังเดินทาง', desc: 'พนักงานขับรถเริ่มการเดินทางแล้ว', icon: <Car className="size-5" /> },
    { id: 'completed', title: 'เสร็จสิ้น', desc: 'พนักงานขับรถส่งรายงานและสิ้นสุดทริปแล้ว', icon: <Flag className="size-5" /> },
  ];

  return (
    // ✅ ลบรูปแบบ background image ออกไปให้เหลือแค่สีขาวเรียบๆ กันขึ้น 404
    <div className="font-sarabun text-black flex flex-col h-full w-full bg-white overflow-hidden rounded-[2.5rem] relative">
      <div className="bg-[#0f172a] p-6 md:p-8 text-white shrink-0 relative z-10 shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-blue-400 font-bold tracking-widest uppercase mb-1">รหัสคำขอ REQ-{booking.id.split('-')[0]}</p>
            <h3 className="text-xl font-extrabold">{booking.destination}</h3>
          </div>
          <Badge className={cn("px-3 py-1 rounded-full text-xs font-bold", statusMap[booking.status]?.className)}>
            {statusMap[booking.status]?.label}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">วันเดินทาง</p>
            <p className="font-bold text-white mt-0.5">{formatThaiDate(booking.start_date)} ({formatThaiTime(booking.start_time)})</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">รถที่จัดสรร</p>
            <p className="font-bold text-blue-300 mt-0.5">{booking.vehicles?.license_plate || "รอดำเนินการ"}</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
        <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Info className="size-5 text-blue-600" /> ลำดับสถานะการดำเนินการ
        </h4>
        
        <div className="relative space-y-6 md:space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-100 before:via-slate-200 before:to-slate-100">
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            let bgColor = "bg-white border-slate-200 text-slate-400";
            let textColor = "text-slate-400";
            let descColor = "text-slate-400";

            if (status === 'completed') {
              bgColor = "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200";
              textColor = "text-emerald-700";
              descColor = "text-emerald-600/80";
            } else if (status === 'current') {
              bgColor = "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50";
              textColor = "text-blue-700";
              descColor = "text-blue-600/80";
            } else if (status === 'rejected') {
              bgColor = "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200";
              textColor = "text-rose-700";
              descColor = "text-rose-600/80";
            }

            return (
              <div key={step.id} className="relative flex items-center md:justify-between md:odd:flex-row-reverse group">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 shadow-sm z-10 transition-colors duration-300 ${bgColor}`}>
                  {step.icon}
                </div>
                <div className={`ml-4 md:ml-0 w-[calc(100%-3.5rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl shadow-sm border transition-all duration-300 ${status === 'current' ? 'border-blue-200 shadow-blue-100 scale-[1.02] bg-white' : 'border-slate-100 bg-white/90 backdrop-blur-sm'} ${status === 'rejected' ? 'border-rose-200 bg-rose-50' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className={`font-extrabold ${textColor}`}>{step.title}</h5>
                    {status === 'completed' && <CheckCircle2 className="size-4 text-emerald-500" />}
                    {status === 'current' && <Loader2 className="size-4 text-blue-500 animate-spin" />}
                  </div>
                  <p className={`text-xs font-medium leading-relaxed ${descColor}`}>{step.desc}</p>
                </div>
                <div className="hidden md:block md:w-[calc(50%-3rem)]"></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-white/60 backdrop-blur-md border-t border-slate-200/60 flex justify-end shrink-0 relative z-10">
        <Button onClick={onClose} className="rounded-xl px-8 font-bold bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-800">
          ปิดหน้าต่าง
        </Button>
      </div>
    </div>
  )
}

// --- 5. หน้าหลัก (BookingsPage) ---
export default function BookingsPage() {
  const { user } = useAuth(); 
  const [userProfile, setUserProfile] = useState(null) 
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [viewBooking, setViewBooking] = useState(null)

  useEffect(() => { loadData() }, [user]) 

  async function loadData() {
    if (!user) return;
    setIsLoading(true);

    let query = supabase.from("bookings").select("*, vehicles(license_plate, brand, model)").order("created_at", { ascending: false });
    
    if (user.role === "user") {
      query = query.eq("user_id", user.id);
    }

    try {
      const promises = [
        query.limit(100),
        supabase.from("vehicles").select("*")
      ];

      if (user?.id && !userProfile) {
        promises.push(supabase.from('profiles').select('*').eq('id', user.id).single());
      }

      const results = await Promise.all(promises);

      if (results[0].data) setBookings(results[0].data);
      if (results[1].data) setVehicles(results[1].data);
      if (results[2]?.data) setUserProfile(results[2].data);
    } catch (error) {
      console.error("Load Data Error:", error)
    } finally {
      setIsLoading(false);
    }
  }

  async function saveBooking(data) {
    if (!user) return;
    
    const { data: newBooking, error } = await supabase
      .from("bookings")
      .insert([{ ...data, user_id: user.id, status: "pending" }])
      .select()
      .single();

    if (!error) {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        user_name: userProfile?.full_name || user.email,
        action: 'CREATE',
        entity_type: 'bookings',
        entity_id: String(newBooking.id),
        new_data: newBooking
      }]);

      setCreateOpen(false);
      Swal.fire({ icon: 'success', title: 'จองรถสำเร็จ', text: 'คำขอของคุณอยู่ในระหว่างรอการอนุมัติ', timer: 2000, showConfirmButton: false });
      loadData();
    } else {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message });
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ลบคำขอจองรถ?',
      text: "การลบจะไม่สามารถกู้คืนข้อมูลได้",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก'
    });
    
    if (result.isConfirmed) {
      const { data: oldData } = await supabase.from("bookings").select("*").eq("id", id).single();
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      
      if (!error) {
        if (user) {
          await supabase.from('audit_logs').insert([{
            user_id: user.id,
            user_name: userProfile?.full_name || user.email,
            action: 'DELETE',
            entity_type: 'bookings',
            entity_id: String(id),
            old_data: oldData
          }]);
        }

        Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
        loadData();
      }
    }
  };

  const filtered = bookings.filter((b) => {
    const term = search.toLowerCase();
    const matchesSearch = b.user_name?.toLowerCase().includes(term) || b.destination?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  })

  return (
    <div className="min-h-screen font-sarabun text-black relative bg-slate-900">
      
      <Image 
        src="/images/image.png" 
        alt="Background" 
        fill 
        priority 
        className="object-cover z-0 opacity-40" 
      />
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="การจองรถ" />
      </div>

      <div className="p-4 md:p-8 relative z-10">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">การจองรถยนต์ส่วนกลาง</h1>
          <p className="text-white/90 text-sm drop-shadow-md">ระบบบริหารจัดการและจองยานพาหนะอิเล็กทรอนิกส์ (แบบฟอร์ม ๓)</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex flex-1 gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="ค้นหาชื่อผู้จอง หรือ สถานที่..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-11 h-12 rounded-2xl border-none shadow-sm bg-white text-black focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-12 rounded-2xl border-none shadow-sm bg-white text-black font-bold">
                <SelectValue placeholder="ทุกสถานะ" />
              </SelectTrigger>
              <SelectContent className="font-sarabun text-black bg-white">
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                <SelectItem value="started">กำลังเดินทาง</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              disabled={isLoading}
              className="h-12 w-12 rounded-2xl bg-white border-none shadow-sm text-slate-600 hover:text-blue-600 shrink-0 transition-transform active:scale-95"
              title="โหลดข้อมูลใหม่"
            >
              <RefreshCw className={cn("size-5", isLoading && "animate-spin text-blue-600")} />
            </Button>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02]">
                <Car className="mr-2 size-5" /> จองรถยนต์ใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl p-0 rounded-[2.5rem] border-none overflow-hidden bg-white shadow-2xl text-black">
              <DialogHeader className="bg-[#0f172a] p-8 text-white">
                <DialogTitle className="text-2xl font-bold text-center tracking-tight">ใบขออนุญาตใช้รถส่วนกลาง (แบบ ๓)</DialogTitle>
                <DialogDescription className="hidden">
                  แบบฟอร์มกรอกรายละเอียดเพื่อขออนุมัติการใช้งานรถยนต์ส่วนกลาง
                </DialogDescription>
              </DialogHeader>
              <div className="px-10 pb-4 pt-2">
                <BookingForm onClose={() => setCreateOpen(false)} onSave={saveBooking} vehicles={vehicles} allBookings={bookings} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white/95 backdrop-blur-sm rounded-[2rem]">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200/50">
                  <TableHead className="pl-6 py-5 font-bold text-slate-500 uppercase text-[11px] tracking-widest">เลขที่</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">ผู้ขอ / หน่วยงาน</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">วัตถุประสงค์</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">เริ่มเดินทาง</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">เดินทางกลับ</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">คน</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">ประเภทรถ</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">ทะเบียนรถ</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">สถานะ</TableHead>
                  <TableHead className="pr-6 text-right font-bold text-slate-500 uppercase text-[11px] tracking-widest">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="h-48 text-center"><Loader2 className="animate-spin mx-auto mb-2 text-blue-600 size-6" />กำลังโหลดข้อมูล...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="h-48 text-center text-slate-400 italic">ไม่พบประวัติการจอง</TableCell></TableRow>
                ) : filtered.map((b) => (
                  <TableRow key={b.id} className="hover:bg-blue-50/50 transition-colors border-b border-slate-100/50 group">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-slate-500 uppercase">
                      REQ-{b.id.split('-')[0]}
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-slate-900">{b.user_name}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{b.department || "ไม่ระบุแผนก"}</p>
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <p className="text-xs text-slate-600 truncate">{b.purpose || "-"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-[11px] font-medium text-slate-700">{formatThaiDate(b.start_date)}</p>
                      <p className="text-[10px] text-blue-600 font-bold">{formatThaiTime(b.start_time)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-[11px] font-medium text-slate-700">{formatThaiDate(b.end_date)}</p>
                      <p className="text-[10px] text-rose-600 font-bold">{formatThaiTime(b.end_time)}</p>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-700 text-xs">
                      {b.passengers}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-[9px] font-bold h-6 rounded-md shadow-sm">
                        {b.vehicle_type_preference || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-blue-700 text-xs">
                      {b.vehicles?.license_plate || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("px-3 py-0.5 rounded-full text-[9px] font-bold border shadow-sm", statusMap[b.status]?.className)}>
                        {statusMap[b.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setViewBooking(b)} 
                          className="text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-xl h-9 w-9 transition-colors"
                          title="ดูสถานะคำขอ"
                        >
                          <Eye className="size-4" />
                        </Button>

                        {b.status === 'pending' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} className="text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl h-9 w-9 transition-colors">
                            <Trash2 className="size-4" />
                          </Button>
                        )}

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!viewBooking} onOpenChange={(open) => !open && setViewBooking(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] border-none bg-transparent shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="hidden">
              <DialogTitle>สถานะคำขอ</DialogTitle>
              <DialogDescription>ดูรายละเอียดสถานะและไทม์ไลน์ของการจอง</DialogDescription>
            </DialogHeader>
            <BookingTimelineDialog booking={viewBooking} onClose={() => setViewBooking(null)} />
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}