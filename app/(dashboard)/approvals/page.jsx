"use client"

import { useState, useEffect } from "react"
import { 
  Check, X, ChevronRight, MapPin, Calendar, Users, 
  Building2, Clock, Briefcase, UserCircle, Phone, 
  Car, Info, Hash, MapPinned, CreditCard 
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import Swal from 'sweetalert2'

// --- ฟังก์ชันช่วยเหลือสำหรับการจัดรูปแบบไทย ---
const formatThaiDate = (dateString) => {
  if (!dateString) return "ไม่ได้ระบุ";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatThaiTime = (timeString) => {
  if (!timeString) return "ไม่ได้ระบุ";
  return `${timeString.substring(0, 5)} น.`;
};

// --- ส่วนที่ 1: การ์ดรายการ (Card) ---
function BookingApprovalCard({ booking, onClick }) {
  return (
    <Card className="group overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-[1.5rem] bg-white font-sarabun text-black">
      <CardContent className="p-0">
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
          <div>
            <p className="font-semibold text-black text-lg leading-tight">{booking.user_name}</p>
            <p className="text-[13px] text-slate-500 mt-1 flex items-center font-medium">
              <Building2 className="size-3.5 mr-1" /> {booking.department}
            </p>
          </div>
          <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-lg text-[11px] font-semibold px-2 py-0.5">
            รอพิจารณา
          </Badge>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-500">
              <MapPin className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">จุดหมายปลายทาง</p>
              <p className="text-[15px] font-semibold text-black truncate">{booking.destination}</p>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-50 pt-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="size-4" />
              <span className="text-xs font-medium">{formatThaiDate(booking.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Car className="size-4" />
              <span className="text-xs font-bold text-blue-600">{booking.vehicles?.license_plate || 'รอดำเนินการ'}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={onClick}
          variant="outline"
          className="w-full bg-white border-slate-200 hover:bg-slate-50 text-black rounded-xl font-semibold py-5 text-sm shadow-sm transition-all"
        >
          ตรวจสอบและพิจารณา
          <ChevronRight className="ml-2 size-4 text-slate-400" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// --- ส่วนที่ 2: เนื้อหาในป๊อปอัป (แสดงรายละเอียดทั้งหมดที่จองมา) ---
function ApprovalDialogContent({ booking, onApprove, onReject }) {
  return (
    <div className="flex flex-col gap-6 py-4 font-sarabun text-black bg-white">
      {/* ข้อมูลผู้ขอ */}
      <div className="grid grid-cols-2 gap-4 bg-slate-900 p-6 rounded-[1.5rem] text-white shadow-lg">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ผู้ขอใช้รถ / ตำแหน่ง</p>
          <div className="flex items-center gap-2">
            <UserCircle className="size-5 text-blue-400" />
            <p className="text-lg font-bold">{booking.user_name}</p>
          </div>
          <p className="text-sm text-slate-300 ml-7">{booking.position || 'ไม่ระบุตำแหน่ง'}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">หน่วยงานต้นสังกัด</p>
          <p className="text-md font-semibold">{booking.department}</p>
          <div className="flex items-center justify-end gap-2 text-blue-400 mt-2">
            <Phone className="size-3.5" />
            <p className="text-sm font-bold">{booking.contact_phone || '-'}</p>
          </div>
        </div>
      </div>

      {/* ✅ ส่วนที่เพิ่ม: ข้อมูลทะเบียนรถยนต์ที่ถูกเลือกมา */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-1 bg-emerald-500 rounded-full" />
          <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">ข้อมูลรถยนต์ที่เลือกใช้</h4>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
              <Car className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">ทะเบียนรถยนต์</p>
              <p className="text-xl font-black text-slate-900">{booking.vehicles?.license_plate || 'ยังไม่ได้ระบุ'}</p>
              <p className="text-xs text-slate-500 font-medium">{booking.vehicles?.brand} {booking.vehicles?.model}</p>
            </div>
          </div>
          <Badge className="bg-white text-emerald-600 border-emerald-200 font-bold px-3 py-1">
            ระบุในคำขอ
          </Badge>
        </div>
      </div>

      {/* รายละเอียดการเดินทาง */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-4 w-1 bg-blue-600 rounded-full" />
          <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">เส้นทางและเวลาเดินทาง</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
             <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600"><MapPinned className="size-4" /></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">ต้นทาง</p>
                <p className="text-[14px] font-bold text-slate-800">{booking.origin || 'หน่วยงานต้นสังกัด'}</p>
             </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
             <div className="p-2 bg-white rounded-lg shadow-sm text-rose-600"><MapPin className="size-4" /></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">ปลายทาง</p>
                <p className="text-[14px] font-bold text-slate-800">{booking.destination}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เริ่มเดินทาง</p>
            <p className="text-[15px] font-bold text-black">{formatThaiDate(booking.start_date)}</p>
            <p className="text-[13px] text-blue-600 font-bold bg-blue-50 w-fit px-2 rounded mt-1">{formatThaiTime(booking.start_time)}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เดินทางกลับ</p>
            <p className="text-[15px] font-bold text-black">{formatThaiDate(booking.end_date)}</p>
            <p className="text-[13px] text-rose-600 font-bold bg-rose-50 w-fit px-2 rounded mt-1 ml-auto">{formatThaiTime(booking.end_time)}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* รายละเอียดภารกิจ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-4 w-1 bg-amber-500 rounded-full" />
          <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">วัตถุประสงค์และข้อมูลเพิ่มเติม</h4>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
             <Briefcase className="size-3" /> หัวข้อ/วัตถุประสงค์การใช้รถ
          </p>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[14px] text-slate-800 font-bold">
             {booking.purpose || 'ไม่ได้ระบุวัตถุประสงค์'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-slate-400" />
              <p className="text-xs font-bold text-slate-500">ผู้เดินทาง</p>
            </div>
            <p className="text-sm font-bold text-slate-800">{booking.passengers} คน</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-slate-400" />
              <p className="text-xs font-bold text-slate-500">ประเภทที่ขอ</p>
            </div>
            <Badge variant="outline" className="bg-white text-blue-600 border-blue-200 font-bold">{booking.vehicle_type_preference || 'ไม่ระบุ'}</Badge>
          </div>
        </div>
      </div>

      {/* ปุ่มดำเนินการ */}
      <div className="flex gap-4 pt-6 mt-2 border-t border-slate-50">
        <Button 
          variant="outline" 
          className="flex-1 text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold h-12 rounded-2xl transition-all" 
          onClick={() => onReject(booking.id)}
        >
          <X className="size-4 mr-2" /> ปฏิเสธคำขอ
        </Button>
        <Button 
          className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold h-12 rounded-2xl text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]"
          onClick={() => onApprove(booking.id, booking.vehicle_id, booking.driver_id)}
        >
          <Check className="size-4 mr-2" /> อนุมัติการจอง
        </Button>
      </div>
    </div>
  )
}

// --- ส่วนที่ 3: หน้าหลัก (ApprovalsPage) ---
export default function ApprovalsPage() {
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => { fetchData() }, [])

  // ✅ แก้ไข: เพิ่มการ Join ตาราง vehicles เพื่อเอาเลขทะเบียนมาแสดง
  async function fetchData() {
    const { data: bData } = await supabase
      .from("bookings")
      .select("*, vehicles(license_plate, brand, model)") // 🚩 จุดที่แก้ไข: ดึงข้อมูลรถมาด้วย
      .eq("status", "pending")
      .order("created_at", { ascending: true })
    
    setBookings(bData || [])
  }

  async function approveBooking(id, vehicleId, driverId) {
    try {
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", id)

      if (bookingError) throw bookingError;

      if (vehicleId) {
        await supabase.from("vehicles").update({ status: "in-use" }).eq("id", vehicleId);
      }
      if (driverId) {
        await supabase.from("drivers").update({ status: "busy" }).eq("id", driverId);
      }

      Swal.fire({ icon: 'success', title: 'อนุมัติสำเร็จ!', text: 'ระบบทำการล็อคสถานะรถเรียบร้อยแล้ว', confirmButtonColor: '#0f172a' });
      fetchData(); 
      setSelectedBooking(null); 

    } catch (error) {
      console.error("Approval Error:", error.message);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message });
    }
  }

  async function rejectBooking(id) {
    const { error } = await supabase.from("bookings").update({ status: "rejected" }).eq("id", id)
    if (!error) {
      Swal.fire({ icon: 'info', title: 'ดำเนินการแล้ว', text: 'ปฏิเสธคำขอจองเรียบร้อย', confirmButtonColor: '#0f172a' });
      fetchData(); setSelectedBooking(null); 
    }
  }

  return (
    <div className="font-sarabun text-black min-h-screen bg-slate-50/30">
      <PageHeader title="การพิจารณาอนุมัติ" />
      
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 italic">
              พิจารณาคำขอใช้รถยนต์
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              รายการรอตรวจเอกสาร: <span className="text-blue-600 font-bold">{bookings.length} รายการ</span>
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card className="h-96 flex flex-col items-center justify-center border-none rounded-[2.5rem] bg-white shadow-sm text-black">
             <div className="p-6 rounded-full bg-slate-50 mb-4 text-slate-200">
                <Clock className="size-16" />
             </div>
             <p className="font-bold text-slate-400 text-lg">ยังไม่มีคำขอใหม่รอการพิจารณา</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
            {bookings.map(booking => (
              <BookingApprovalCard key={booking.id} booking={booking} onClick={() => setSelectedBooking(booking)} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white max-h-[92vh] flex flex-col">
          <DialogHeader className="p-8 bg-[#0f172a] text-white text-center shrink-0">
             <DialogTitle className="text-2xl font-bold font-sarabun tracking-tight">
               ใบขออนุญาตใช้รถส่วนกลาง (แบบ ๓)
             </DialogTitle>
             <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Document Verification & Approval</p>
          </DialogHeader>
          
          <div className="px-10 pb-6 pt-2 overflow-y-auto flex-1 bg-white scrollbar-hide">
            {selectedBooking && (
              <ApprovalDialogContent 
                booking={selectedBooking}
                onApprove={approveBooking}
                onReject={rejectBooking}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}