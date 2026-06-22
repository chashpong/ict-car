"use client"

import { useState, useEffect } from "react"
import Image from "next/image" 
import { 
  Car, Search, Eye, CalendarIcon, Clock, Trash2, 
  User, Phone, MapPin, CheckCircle2, 
  AlertCircle, Info, Loader2, Users, ClipboardList,
  FileText, Flag, XCircle, RefreshCw, Pencil 
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
  pending_review: { label: "รอตรวจสอบ", className: "bg-orange-100 text-orange-700 border-orange-200" },
  pending_approval: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved: { label: "อนุมัติ", className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-red-100 text-red-700 border-red-200" },
  in_progress: { label: "กำลังเดินทาง", className: "bg-blue-100 text-blue-700 border-blue-200" },
  interrupted: { label: "รถเสีย/ฉุกเฉิน", className: "bg-rose-100 text-rose-700 border-rose-200 animate-pulse" },
  completed: { label: "เสร็จสิ้น", className: "bg-gray-100 text-gray-700 border-gray-200" }
}

const vehicleTypes = ["รถเก๋ง", "รถกระบะ", "รถตู้", "รถบัส/รถโดยสาร", "SUV", "รถบรรทุก", "อื่นๆ"]

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
// 🛡️ เพิ่ม prop initialData เพื่อรับข้อมูลเดิมมาแสดงตอนแก้ไข
function BookingForm({ onClose, onSave, vehicles = [], allBookings = [], initialData = null }) { 
  const [formData, setFormData] = useState({
    user_name: "", position: "", department: "", 
    start_date: format(new Date(), 'yyyy-MM-dd'), end_date: format(new Date(), 'yyyy-MM-dd'), 
    start_time: "08:30", end_time: "16:30", 
    destination: "", origin: "หน่วยงานต้นสังกัด", purpose: "", duty_details: "", 
    passengers: 1, vehicle_type_preference: "รถกระบะ", contact_phone: "" 
  })
  
  const [isSaving, setIsSaving] = useState(false)

  // 🛡️ ถ้าเป็นการแก้ไข ให้เอาข้อมูลเก่ามาใส่ในฟอร์ม
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
      });
    }
  }, [initialData]);

  const getVehicleStatusForUser = (car) => {
    if (car.status === 'maintenance') return { isAvailable: false, reason: 'อยู่ระหว่างซ่อมบำรุง' };
    
    if (car.seats && car.seats < formData.passengers) {
      return { isAvailable: false, reason: `ที่นั่งไม่พอ (มี ${car.seats} / ต้องการ ${formData.passengers})` };
    }

    const startReq = parse(`${formData.start_date} ${formData.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const endReq = parse(`${formData.end_date} ${formData.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
    
    const conflict = allBookings.find(b => {
      // 🛡️ ข้ามการเช็กเวลาชนกันของ "ใบจองตัวเอง" (กรณีแก้ไขวันเวลา)
      if (initialData && b.id === initialData.id) return false;

      if (b.vehicle_id !== car.id || b.status === 'rejected' || b.status === 'completed' || b.status === 'interrupted') return false;
      
      const bStart = parse(`${b.start_date} ${b.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
      const bEnd = parse(`${b.end_date} ${b.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
      
      return isBefore(startReq, bEnd) && isBefore(bStart, endReq);
    });

    if (conflict) return { isAvailable: false, reason: 'ติดภารกิจช่วงเวลานี้' };

    return { isAvailable: true, reason: 'ว่าง' };
  }

  const handleSave = async () => {
    const startDateTime = parse(`${formData.start_date} ${formData.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const endDateTime = parse(`${formData.end_date} ${formData.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
    
    if (isBefore(endDateTime, startDateTime)) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'วัน-เวลาที่สิ้นสุด ต้องอยู่หลังวัน-เวลาเริ่มต้นครับ' });
      return;
    }

    setIsSaving(true)
    try {
      // 🛡️ ลบ object vehicles ที่ติดมาจากการ Join ก่อนส่งไป API เพื่อป้องกัน Error
      const payload = { ...formData };
      delete payload.vehicles; 

      await onSave(payload);
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col py-4 font-sarabun text-slate-800 max-h-[75vh]">
      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* 📝 ฝั่งซ้าย: ฟอร์มกรอกข้อมูล */}
          <div className="lg:col-span-3 space-y-4 lg:border-r lg:pr-6 border-slate-100">
            {/* โชว์สาเหตุที่ถูกตีกลับ ถ้าเป็นการแก้ไขคำขอที่โดน Reject */}
            {initialData?.status === 'rejected' && initialData?.reject_reason && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4 flex gap-2 text-sm">
                <AlertCircle className="size-5 shrink-0" />
                <div>
                  <p className="font-bold">สาเหตุที่ไม่อนุมัติ/ถูกตีกลับ:</p>
                  <p>{initialData.reject_reason}</p>
                  <p className="text-[10px] mt-1 opacity-70">กรุณาแก้ไขข้อมูลและกดส่งคำขออีกครั้ง</p>
                </div>
              </div>
            )}

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase ml-1">จำนวนผู้ร่วมทาง (คน) <span className="text-red-500">*</span></Label>
                <Input type="number" min={1} value={formData.passengers} onChange={(e) => setFormData({ ...formData, passengers: Number(e.target.value) })} className="h-11 rounded-xl bg-white border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase ml-1">ประเภทรถที่ต้องการ</Label>
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

          {/* 🚘 ฝั่งขวา: แผงตรวจสอบสถานะรถ */}
          <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl border border-slate-200/60 p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <Label className="font-bold flex items-center gap-2 text-slate-700">
                <Search className="size-4 text-emerald-600" /> ตรวจสถานะรถ ณ ช่วงเวลาที่เลือก
              </Label>
              <div className="flex gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold">
                   ว่าง {vehicles.filter(c => getVehicleStatusForUser(c).isAvailable).length}
                </Badge>
                <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 font-bold">
                   ไม่ว่าง {vehicles.filter(c => !getVehicleStatusForUser(c).isAvailable).length}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
              {vehicles.map((car) => {
                const { isAvailable, reason } = getVehicleStatusForUser(car);
                return (
                  <div 
                    key={car.id} 
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all cursor-default",
                      isAvailable ? "border-emerald-100 bg-white shadow-sm" : "border-rose-100 bg-rose-50/50 opacity-80"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg", isAvailable ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500")}>
                          <Car className="size-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-slate-900">{car.license_plate}</p>
                          <p className="text-[9px] text-slate-500">{car.brand} {car.model}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-[9px] px-1.5 py-0", isAvailable ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-rose-500 hover:bg-rose-500 text-white")}>
                        {isAvailable ? <CheckCircle2 className="size-3 mr-1"/> : <XCircle className="size-3 mr-1"/>}
                        {isAvailable ? "ว่าง" : "ไม่ว่าง"}
                      </Badge>
                    </div>
                    {!isAvailable && (
                      <div className="mt-2 text-[9px] font-bold text-rose-600 bg-rose-100 p-1.5 rounded-md flex items-center justify-center gap-1">
                        <Users className="size-3" /> {reason}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-auto pt-4">
              <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                <Info className="size-3 text-blue-500"/>
                ระบบจะใช้ข้อมูลนี้ประกอบการพิจารณาจัดสรรรถโดยเจ้าหน้าที่
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 mt-2 shrink-0">
        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto px-10 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">ยกเลิก</Button>
        <Button 
          onClick={handleSave} 
          disabled={!formData.purpose || !formData.contact_phone || isSaving}
          className="w-full sm:w-auto bg-[#0f172a] hover:bg-slate-800 px-12 h-12 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <><Loader2 className="mr-2 size-5 animate-spin" /> {initialData ? "กำลังบันทึก..." : "กำลังส่งคำขอ..."}</>
          ) : (
            initialData ? "บันทึกการแก้ไข" : "ส่งคำขอจองรถยนต์"
          )}
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
    const flow = ['pending_review', 'pending_approval', 'approved', 'in_progress', 'completed'];
    
    if (status === 'rejected') {
      if (stepName === 'pending_review' || stepName === 'pending_approval') return 'completed'; 
      if (stepName === 'approved') return 'rejected'; 
      return 'pending'; 
    }
    
    let currentIndex = flow.indexOf(status);
    if (status === 'interrupted') currentIndex = flow.indexOf('in_progress'); 
    
    const stepIndex = flow.indexOf(stepName);

    if (stepIndex < currentIndex) return 'completed'; 
    if (stepIndex === currentIndex) return status === 'completed' ? 'completed' : 'current'; 
    
    return 'pending'; 
  };

  const steps = [
    { id: 'pending_review', title: '1. ส่งคำขอจองรถ', desc: 'ระบบได้รับคำขอของคุณแล้ว อยู่ระหว่างรอเจ้าหน้าที่ตรวจสอบข้อมูล', icon: <FileText className="size-5" /> },
    { id: 'pending_approval', title: '2. ตรวจสอบ & จัดสรรรถ', desc: 'เจ้าหน้าที่พิจารณาความเหมาะสมและจัดสรรยานพาหนะ/คนขับเรียบร้อย', icon: <ClipboardList className="size-5" /> },
    { id: 'approved', title: '3. พิจารณาอนุมัติ', desc: booking.status === 'rejected' ? `ไม่อนุมัติคำขอ` : 'ผู้มีอำนาจพิจารณาอนุมัติการเดินทาง', icon: booking.status === 'rejected' ? <XCircle className="size-5" /> : <CheckCircle2 className="size-5" /> },
    { id: 'in_progress', title: '4. กำลังเดินทาง', desc: booking.status === 'interrupted' ? 'เกิดเหตุขัดข้อง/รถเสียระหว่างทาง รอการสับเปลี่ยนรถ' : 'พนักงานขับรถเริ่มการเดินทางแล้ว', icon: booking.status === 'interrupted' ? <AlertCircle className="size-5" /> : <Car className="size-5" /> },
    { id: 'completed', title: '5. เสร็จสิ้นภารกิจ', desc: 'พนักงานขับรถส่งรายงานและสิ้นสุดทริปแล้ว', icon: <Flag className="size-5" /> },
  ];

  return (
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
            <p className="font-bold text-blue-300 mt-0.5">{booking.vehicles?.license_plate || "รอการจัดสรร"}</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10 bg-slate-50">
        <h4 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
          <Info className="size-5 text-blue-600" /> ลำดับสถานะการดำเนินการ
        </h4>
        
        <div className="relative space-y-6 md:space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-100 before:via-blue-200 before:to-blue-100">
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
                <div className={`ml-4 md:ml-0 w-[calc(100%-3.5rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl shadow-sm border transition-all duration-300 ${status === 'current' ? 'border-blue-300 shadow-blue-100 scale-[1.02] bg-white' : 'border-slate-100 bg-white/90 backdrop-blur-sm'} ${status === 'rejected' ? 'border-rose-200 bg-rose-50' : ''}`}>
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
  
  // 🛡️ สถานะสำหรับเปิด Dialog และเก็บข้อมูลที่จะแก้ไข
  const [createOpen, setCreateOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [viewBooking, setViewBooking] = useState(null)

  useEffect(() => { loadData() }, [user]) 

  async function loadData() {
    // 1. ถ้ายังไม่มี user ให้หยุดรอก่อน
    if (!user) {
      return; 
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      // 🛑 [จุดแก้ปัญหา เพิ่มบรรทัดนี้เข้าไปเลยครับ!] 🛑
      // บังคับให้ระบบ "รอ" จนกว่า Supabase จะโหลด Session หลังบ้านเสร็จสมบูรณ์
      await supabase.auth.getSession();

      // ... (โค้ดดึงข้อมูลเดิมของคุณทั้งหมดให้อยู่ต่อจากนี้) ...
      let query = supabase.from("bookings").select("*, vehicles(license_plate, brand, model)").order("created_at", { ascending: false }).limit(50);

      if (user.role === "user") {
        query = query.eq("user_id", user.id);
      }

      const promises = [
        query,
        supabase.from("vehicles").select("id, license_plate, brand, model, status, seats")
      ];
      
     

      if (user?.id && !userProfile) {
        promises.push(supabase.from('profiles').select('*').eq('id', user.id).single());
      }

      const results = await Promise.all(promises);

      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;

      if (results[0].data) setBookings(results[0].data);
      if (results[1].data) setVehicles(results[1].data);
      if (results[2] && results[2].data) setUserProfile(results[2].data);
      
    } catch (error) {
      console.error("Load Data Error:", error);
      setFetchError("เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาตรวจสอบการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  }

  // 🛡️ ฟังก์ชันเปิด Dialog แบบสร้างใหม่
  const handleOpenCreate = () => {
    setEditingBooking(null);
    setCreateOpen(true);
  }

  // 🛡️ ฟังก์ชันเปิด Dialog แบบแก้ไข
  const handleOpenEdit = (booking) => {
    setEditingBooking(booking);
    setCreateOpen(true);
  }

 // 🛡️ เปลี่ยนมาใช้ Supabase ยิงตรงจากหน้าบ้าน (ไม่ต้องง้อโฟลเดอร์ /api)
  async function saveBooking(data) {
    if (!user) return;
    
    try {
      const isEditing = !!data.id; 
      
      // 1. คลีนข้อมูลก่อนส่ง: ลบ object vehicles ที่ติดมาจากการ Join ก่อนหน้า
      const payload = { ...data };
      delete payload.vehicles; 

      // 2. บังคับใส่ค่าเริ่มต้นที่สำคัญ (DevSecOps)
      payload.status = 'pending_review'; // บังคับกลับไปรอตรวจสอบเสมอ
      payload.user_id = user.id;         // ยัด ID ของคนจองใส่เข้าไปด้วย

      let result;

      if (isEditing) {
        // ✏️ โหมดแก้ไข (UPDATE)
        result = await supabase
          .from("bookings")
          .update(payload)
          .eq("id", payload.id)
          .eq("user_id", user.id); // ป้องกันคนอื่นมาแอบแก้ใบจองที่ไม่ใช่ของตัวเอง
      } else {
        // 🆕 โหมดสร้างใหม่ (INSERT)
        result = await supabase
          .from("bookings")
          .insert([payload])
          .select()
          .single();
      }
  
      if (!result.error) {
        // บันทึกประวัติการกระทำลง Audit Log
        await supabase.from('audit_logs').insert([{
          user_id: user.id,
          user_name: userProfile?.full_name || user.email,
          action: isEditing ? 'UPDATE' : 'CREATE',
          entity_type: 'bookings',
          entity_id: String(isEditing ? payload.id : result.data?.id),
        }]);

        setCreateOpen(false);
        setEditingBooking(null);
        Swal.fire({ 
          icon: 'success', 
          title: isEditing ? 'แก้ไขสำเร็จ' : 'ส่งคำขอสำเร็จ', 
          text: isEditing ? 'อัปเดตและส่งตรวจสอบใหม่แล้ว' : 'ระบบส่งคำขอให้ผู้ตรวจสอบเรียบร้อยแล้ว', 
          timer: 2000, 
          showConfirmButton: false 
        });
        loadData(); // โหลดตารางใหม่
      } else {
        throw new Error(result.error.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
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
                <SelectItem value="pending_review">รอตรวจสอบ</SelectItem>
                <SelectItem value="pending_approval">รอพิจารณา</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                <SelectItem value="in_progress">กำลังเดินทาง</SelectItem>
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

          <Dialog 
            open={createOpen} 
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) setEditingBooking(null); // เคลียร์ข้อมูลตอนปิด Popup
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate} className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02]">
                <Car className="mr-2 size-5" /> จองรถยนต์ใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-6xl p-0 rounded-[2.5rem] border-none overflow-hidden bg-white shadow-2xl text-black">
              <DialogHeader className="bg-[#0f172a] p-8 text-white">
                <DialogTitle className="text-2xl font-bold text-center tracking-tight">
                  {editingBooking ? 'แก้ไขใบขออนุญาตใช้รถส่วนกลาง' : 'ใบขออนุญาตใช้รถส่วนกลาง (แบบ ๓)'}
                </DialogTitle>
                <DialogDescription className="hidden">แบบฟอร์มกรอกรายละเอียด</DialogDescription>
              </DialogHeader>
              <div className="px-10 pb-4 pt-2">
                <BookingForm 
                  onClose={() => { setCreateOpen(false); setEditingBooking(null); }} 
                  onSave={saveBooking} 
                  vehicles={vehicles} 
                  allBookings={bookings} 
                  initialData={editingBooking} // ส่งข้อมูลที่จะแก้ไขเข้าไป
                />
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
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">ผู้ขอ</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">หน่วยงาน</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">วัตถุประสงค์</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">เริ่ม</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">สิ้นสุด</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">ผู้โดยสาร</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">สถานะ</TableHead>
                  <TableHead className="pr-6 text-right font-bold text-slate-500 uppercase text-[11px] tracking-widest">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="h-48 text-center"><Loader2 className="animate-spin mx-auto mb-2 text-blue-600 size-6" />กำลังโหลดข้อมูล...</TableCell></TableRow>
                ) : fetchError ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center bg-rose-50/50">
                      <div className="flex flex-col items-center justify-center p-4">
                        <AlertCircle className="mb-3 text-rose-500 size-10 animate-bounce" />
                        <p className="text-rose-800 font-extrabold text-lg mb-1">พบปัญหาการเชื่อมต่อฐานข้อมูล</p>
                        <p className="text-rose-600/80 text-sm max-w-md">{fetchError}</p>
                        <Button variant="outline" onClick={loadData} className="mt-5 border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-800 rounded-xl px-6 h-10 font-bold">
                          <RefreshCw className="mr-2 size-4" /> ลองโหลดใหม่อีกครั้ง
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="h-48 text-center text-slate-400 italic">ไม่พบประวัติการจอง</TableCell></TableRow>
                ) : filtered.map((b) => (
                  <TableRow key={b.id} className="hover:bg-blue-50/50 transition-colors border-b border-slate-100/50 group">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-slate-500 uppercase">
                      REQ-{b.id.split('-')[0]}
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-slate-900">{b.user_name}</p>
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <p className="text-[11px] text-slate-600 truncate">{b.department || "-"}</p>
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
                      <Badge className={cn("px-3 py-0.5 rounded-full text-[9px] font-bold border shadow-sm", statusMap[b.status]?.className)}>
                        {statusMap[b.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        
                        {/* 🛡️ ปุ่มแก้ไข (แสดงเฉพาะสถานะรอตรวจสอบ หรือ ถูกตีกลับ) */}
                        {(b.status === 'pending_review' || b.status === 'rejected') && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEdit(b)} 
                            className="text-amber-500 hover:bg-amber-100 hover:text-amber-700 rounded-xl h-9 w-9 transition-colors"
                            title="แก้ไขคำขอ"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setViewBooking(b)} 
                          className="text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-xl h-9 w-9 transition-colors"
                          title="ดูสถานะคำขอ"
                        >
                          <Eye className="size-4" />
                        </Button>

                        {/* 🛡️ ปุ่มลบ (แสดงเฉพาะสถานะรอตรวจสอบ) */}
                        {b.status === 'pending_review' && (
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