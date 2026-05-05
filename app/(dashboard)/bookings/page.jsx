"use client"

import { useState, useEffect } from "react"
import { 
  Car, Search, Eye, CalendarIcon, Clock, Trash2, 
  User, Phone, MapPin, CheckCircle2, 
  AlertCircle, Info, Loader2, Users, ClipboardList 
} from "lucide-react"
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
              <Button key={h} variant={currentH === h ? "default" : "ghost"} size="sm" className={cn("mb-1", currentH === h && "bg-blue-600")} onClick={() => onChange(`${h}:${currentM}`)}>{h}</Button>
            ))}
          </div>
          <div className="flex flex-1 flex-col p-2">
            {minutes.map((m) => (
              <Button key={m} variant={currentM === m ? "default" : "ghost"} size="sm" className={cn("mb-1", currentM === m && "bg-blue-600")} onClick={() => onChange(`${currentH}:${m}`)}>{m}</Button>
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal rounded-xl h-11", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />{date ? formatThaiDate(dateValue) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl bg-white" align="start">
        <Calendar mode="single" selected={date} onSelect={(d) => onDateChange(d ? format(d, 'yyyy-MM-dd') : "")} locale={th} initialFocus className="text-black" />
      </PopoverContent>
    </Popover>
  );
}

// --- 3. ฟอร์มการจอง (BookingForm) ---
function BookingForm({ onClose, onSave, vehicles = [], allBookings = [] }) { 
  const [formData, setFormData] = useState({
    user_name: "", 
    position: "", 
    department: "", 
    start_date: format(new Date(), 'yyyy-MM-dd'), 
    end_date: format(new Date(), 'yyyy-MM-dd'), 
    start_time: "08:30", 
    end_time: "16:30", 
    destination: "", 
    origin: "หน่วยงานต้นสังกัด", 
    purpose: "", 
    duty_details: "", 
    passengers: 1,
    vehicle_id: "",
    vehicle_type_preference: "ไม่ระบุ",
    contact_phone: "" 
  })

  const getVehicleStatus = (car) => {
    if (car.status !== 'available') {
      return { status: 'busy', reason: car.status === 'maintenance' ? 'อยู่ระหว่างซ่อมบำรุง' : 'กำลังปฏิบัติงาน' };
    }
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
    <div className="flex flex-col gap-6 py-4 font-sarabun text-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 border-r pr-6 border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase ml-1">ผู้ขอใช้รถ</Label>
              <Input value={formData.user_name} onChange={(e) => setFormData({ ...formData, user_name: e.target.value })} placeholder="ชื่อ-นามสกุล" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase ml-1">ตำแหน่ง</Label>
              <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="ระบุตำแหน่ง" className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500 uppercase ml-1">สังกัดหน่วยงาน</Label>
            <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="กอง/ฝ่าย" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500 uppercase ml-1">วัตถุประสงค์การใช้รถ <span className="text-red-500">*</span></Label>
            <Input value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="เช่น ไปราชการเรื่อง..." className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500 uppercase ml-1">รายละเอียดภารกิจ</Label>
            <Textarea rows={2} value={formData.duty_details} onChange={(e) => setFormData({ ...formData, duty_details: e.target.value })} placeholder="รายละเอียดเพิ่มเติม" className="rounded-xl resize-none font-sarabun" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase ml-1">จำนวนผู้ร่วมทาง (คน)</Label>
              <Input type="number" min={1} value={formData.passengers} onChange={(e) => setFormData({ ...formData, passengers: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase ml-1">ประเภทรถที่ขอ</Label>
              <Select onValueChange={(v) => setFormData({ ...formData, vehicle_type_preference: v })} value={formData.vehicle_type_preference}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
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
              <Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="ชื่อ / เบอร์โทรศัพท์" className="pl-10 h-11 rounded-xl" />
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
          <div className="grid grid-cols-2 gap-4 border-b pb-4 border-dashed">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 ml-1">ต้นทาง</Label>
              <Input value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 ml-1">ปลายทาง <span className="text-red-500">*</span></Label>
              <Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="h-11 rounded-xl" />
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
      
      <div className="flex justify-end gap-3 pt-6 border-t mt-2">
        <Button variant="ghost" onClick={onClose} className="px-10 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">ยกเลิก</Button>
        <Button 
          onClick={() => onSave(formData)} 
          disabled={!formData.vehicle_id || !formData.purpose || !formData.contact_phone}
          className="bg-[#0f172a] hover:bg-slate-800 px-12 h-12 rounded-2xl font-bold text-white shadow-lg transition-all"
        >
          ส่งคำขอจองรถยนต์
        </Button>
      </div>
    </div>
  )
}

// --- 4. หน้าหลัก (BookingsPage) ---
export default function BookingsPage() {
  const { user } = useAuth(); 
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setIsLoading(true);
    const [bRes, vRes] = await Promise.all([
      supabase.from("bookings").select("*, vehicles(license_plate, brand, model)").order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*")
    ]);
    if (!bRes.error) setBookings(bRes.data || []);
    if (!vRes.error) setVehicles(vRes.data || []);
    setIsLoading(false);
  }

  async function saveBooking(data) {
    if (!user) return;
    const { error } = await supabase.from("bookings").insert([{ ...data, user_id: user.id, status: "pending" }]);
    if (!error) {
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
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (!error) {
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

  // ... (ส่วนบนคงเดิมทั้งหมดจนถึงส่วน return ของ BookingsPage)

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sarabun text-black">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 italic">การจองรถยนต์ส่วนกลาง</h1>
        <p className="text-muted-foreground text-sm">ระบบบริหารจัดการและจองยานพาหนะอิเล็กทรอนิกส์ (แบบฟอร์ม ๓)</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-1 gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="ค้นหาชื่อผู้จอง หรือ สถานที่..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-11 h-12 rounded-2xl border-none shadow-sm bg-white focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-12 rounded-2xl border-none shadow-sm bg-white font-bold">
              <SelectValue placeholder="ทุกสถานะ" />
            </SelectTrigger>
            <SelectContent className="font-sarabun text-black bg-white">
              <SelectItem value="all">สถานะทั้งหมด</SelectItem>
              <SelectItem value="pending">รอดำเนินการ</SelectItem>
              <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
              <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
              <SelectItem value="completed">เสร็จสิ้น</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02]">
              <Car className="mr-2 size-5" /> จองรถยนต์ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl p-0 rounded-[2.5rem] border-none overflow-hidden bg-white shadow-2xl">
            <DialogHeader className="bg-[#0f172a] p-8 text-white">
              <DialogTitle className="text-2xl font-bold text-center tracking-tight">ใบขออนุญาตใช้รถส่วนกลาง (แบบ ๓)</DialogTitle>
            </DialogHeader>
            <div className="px-10 pb-4 pt-2">
              <BookingForm onClose={() => setCreateOpen(false)} onSave={saveBooking} vehicles={vehicles} allBookings={bookings} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="pl-6 py-5 font-bold text-slate-500 uppercase text-[11px] tracking-widest">ผู้ขอ / หน่วยงาน</TableHead>
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
                <TableRow><TableCell colSpan={9} className="h-48 text-center"><Loader2 className="animate-spin mx-auto mb-2 text-blue-600" />กำลังโหลดข้อมูล...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-48 text-center text-slate-400 italic">ไม่พบประวัติการจอง</TableCell></TableRow>
              ) : filtered.map((b) => (
                <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group">
                  <TableCell className="pl-6">
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
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-[9px] font-bold h-6 rounded-md">
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
                      {/* ✅ เอาปุ่มพิมพ์ออกตามคำสั่ง */}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} className="text-rose-500 hover:bg-rose-50 rounded-xl h-9 w-9">
                        <Trash2 className="size-4" />
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
  )
}