"use client"

import { useState, useEffect } from "react"
import { Check, X, ChevronRight, MapPin, Calendar, Users, Building2, Clock, Briefcase, UserCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    <Card className="group overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-[1.5rem] bg-white font-sarabun">
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
              <p className="text-[15px] font-semibold text-black">{booking.destination}</p>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-50 pt-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="size-4" />
              <span className="text-xs font-medium">{formatThaiDate(booking.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="size-4" />
              <span className="text-xs font-medium">{booking.passengers} คน</span>
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

// --- ส่วนที่ 2: เนื้อหาในป๊อปอัป ---
function ApprovalDialogContent({ booking, vehicles, drivers, onApprove, onReject }) {
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [selectedDriver, setSelectedDriver] = useState("")

  return (
    <div className="flex flex-col gap-6 py-2 font-sarabun text-black bg-white">
      <div className="space-y-4 px-1">
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">ผู้ขอใช้รถ / ตำแหน่ง</p>
            <div className="flex items-center gap-2 text-black">
              <UserCircle className="size-4 text-slate-400" />
              <p className="text-[15px] font-semibold">{booking.user_name}</p>
            </div>
            <p className="text-[13px] text-slate-500 font-medium ml-6">{booking.position || '-'}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">สังกัดหน่วยงาน</p>
            <p className="text-[14px] font-semibold text-slate-600">{booking.department}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">สถานที่ไปราชการ</p>
             <p className="text-[15px] font-semibold text-black">{booking.destination}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">จำนวนผู้เดินทาง</p>
             <p className="text-[15px] font-semibold text-black">{booking.passengers} คน</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">วันที่เดินทาง</p>
            <p className="text-[14px] font-semibold text-black">{formatThaiDate(booking.start_date)}</p>
            <p className="text-[13px] text-slate-500 font-medium">{formatThaiTime(booking.start_time)}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">เดินทางกลับ</p>
            <p className="text-[14px] font-semibold text-black">{formatThaiDate(booking.end_date)}</p>
            <p className="text-[13px] text-slate-500 font-medium">{formatThaiTime(booking.end_time)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
             <Briefcase className="size-3" /> ภารกิจ/วัตถุประสงค์
          </p>
          <div className="bg-white p-4 rounded-xl border border-slate-100 text-[14px] text-slate-700 leading-relaxed font-medium">
             {booking.duty_details || booking.purpose || 'ไม่ระบุ'}
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      <div className="space-y-4 px-1 pb-4">
        <h4 className="font-semibold text-[13px] flex items-center gap-2 text-slate-500 uppercase tracking-widest">
          <Clock className="size-4" /> การมอบหมายงาน (เจ้าหน้าที่พัสดุ)
        </h4>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700 ml-1">เลือกรถยนต์ที่ว่าง <span className="text-red-500">*</span></Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white shadow-sm">
                <SelectValue placeholder="เลือกทะเบียนรถยนต์..." />
              </SelectTrigger>
              <SelectContent className="font-sarabun">
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.model} - {v.license_plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700 ml-1">พนักงานขับรถ <span className="text-red-500">*</span></Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-white shadow-sm">
                <SelectValue placeholder="เลือกชื่อพนักงาน..." />
              </SelectTrigger>
              <SelectContent className="font-sarabun">
                {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 px-1 sticky bottom-0 bg-white border-t border-slate-50">
        <Button 
          variant="outline" 
          className="flex-1 text-slate-500 border-slate-200 hover:bg-slate-50 font-semibold h-11 rounded-xl" 
          onClick={() => onReject(booking.id)}
        >
          ไม่อนุญาต
        </Button>
        <Button 
          className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold h-11 rounded-xl text-white shadow-sm"
          onClick={() => {
            if(!selectedVehicle || !selectedDriver) { 
               Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาระบุรถและพนักงานขับรถ', confirmButtonColor: '#0f172a' });
               return; 
            }
            onApprove(booking.id, selectedVehicle, selectedDriver)
          }}
        >
          อนุมัติการจอง
        </Button>
      </div>
    </div>
  )
}

// --- ส่วนที่ 3: หน้าหลัก (ApprovalsPage) ---
export default function ApprovalsPage() {
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: bData } = await supabase.from("bookings").select("*").eq("status", "pending").order("created_at")
    const { data: vData } = await supabase.from("vehicles").select("*").eq("status", "available")
    const { data: dData } = await supabase.from("drivers").select("*")
    setBookings(bData || [])
    setVehicles(vData || [])
    setDrivers(dData || [])
  }

  async function approveBooking(id, vehicleId, driverId) {
    const { error } = await supabase.from("bookings").update({ status: "approved", vehicle_id: vehicleId, driver_id: driverId }).eq("id", id)
    if (!error) {
      Swal.fire({ icon: 'success', title: 'อนุมัติสำเร็จ!', confirmButtonColor: '#0f172a' });
      fetchData(); setSelectedBooking(null); 
    }
  }

  async function rejectBooking(id) {
    const { error } = await supabase.from("bookings").update({ status: "rejected" }).eq("id", id)
    if (!error) {
      Swal.fire({ icon: 'info', title: 'ดำเนินการแล้ว', confirmButtonColor: '#0f172a' });
      fetchData(); setSelectedBooking(null); 
    }
  }

  return (
    <div className="font-sarabun">
      <PageHeader title="การพิจารณาอนุมัติ" />
      
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-slate-50/50 min-h-screen">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-black">
              พิจารณาคำขอใช้รถยนต์
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              รายการรอดำเนินการ: <span className="text-blue-600 font-semibold">{bookings.length} รายการ</span>
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card className="h-80 flex flex-col items-center justify-center border border-slate-200 rounded-[2rem] bg-white shadow-sm">
             <div className="p-4 rounded-full bg-slate-50 mb-3 text-slate-300">
                <Clock className="size-10" />
             </div>
             <p className="font-medium text-slate-500 text-sm">ยังไม่มีรายการคำขอจองใหม่ในขณะนี้</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {bookings.map(booking => (
              <BookingApprovalCard key={booking.id} booking={booking} onClick={() => setSelectedBooking(booking)} />
            ))}
          </div>
        )}
      </div>

      {/* ป๊อปอัปพิจารณาอนุมัติ */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="p-7 bg-[#0f172a] text-white text-center shrink-0">
             <DialogTitle className="text-lg font-semibold font-sarabun tracking-wider">
               พิจารณาอนุญาตใช้รถส่วนกลาง (แบบ ๓)
             </DialogTitle>
          </DialogHeader>
          
          <div className="px-7 pb-4 pt-2 overflow-y-auto flex-1">
            {selectedBooking && (
              <ApprovalDialogContent 
                booking={selectedBooking}
                vehicles={vehicles}
                drivers={drivers}
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