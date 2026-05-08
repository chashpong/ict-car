"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Check, X, ChevronRight, MapPin, Calendar, Users,
  Building2, Clock, Briefcase, UserCircle, Phone,
  Car, Info, MapPinned, UserPlus,
  PenTool, Eraser, Image as ImageIcon, Save, CheckCircle2,
  Printer // ✅ เพิ่ม Icon Printer
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import Swal from 'sweetalert2'
import SignatureCanvas from 'react-signature-canvas'

// ✅ แก้ไขชื่อการ Import ให้ถูกต้อง (ห้ามมีขีดกลาง)
import { Form3Document } from "@/components/form-3-document"
import { useReactToPrint } from "react-to-print" // ✅ นำเข้าตัวช่วย Print

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

// --- ส่วนที่ 2: เนื้อหาในป๊อปอัป (แสดงแบบ 2 คอลัมน์) ---
function ApprovalDialogContent({ booking, onApprove, onReject, availableDrivers, selectedDriverId, setSelectedDriverId, userProfile }) {

  const sigCanvas = useRef(null)
  const documentRef = useRef(null) // ✅ Ref สำหรับจับภาพไป Print

  const hasSavedSignature = !!userProfile?.saved_signature
  const [signatureMode, setSignatureMode] = useState(hasSavedSignature ? 'saved' : 'draw')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [saveToProfile, setSaveToProfile] = useState(!hasSavedSignature)

  // ✅ State สำหรับเก็บลายเซ็นไปแสดงโชว์สดๆ ในกระดาษ A4 ขวามือ
  const [currentSignature, setCurrentSignature] = useState(hasSavedSignature ? userProfile.saved_signature : null)


  // ฟังก์ชันสั่ง Print ด้วย react-to-print
  const handlePrint = useReactToPrint({
    contentRef: documentRef, // ✅ เปลี่ยนมาใช้ contentRef ตรงๆ แบบนี้ครับ
    documentTitle: `ใบขออนุญาตใช้รถ_${booking.user_name}`,
  });

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
      setHasDrawn(false)
      setCurrentSignature(null) // ล้างพรีวิวด้วย
    }
  }

  // ส่งลายเซ็นไปโชว์ที่กระดาษพรีวิวทันทีที่วาดเสร็จ
  const handleSignatureEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setCurrentSignature(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
      setHasDrawn(true);
    }
  };

  // เปลี่ยนลายเซ็นพรีวิวเมื่อสลับโหมด
  useEffect(() => {
    if (signatureMode === 'saved') {
      setCurrentSignature(userProfile?.saved_signature || null);
    } else {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        setCurrentSignature(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
      } else {
        setCurrentSignature(null);
      }
    }
  }, [signatureMode, userProfile]);

  const handleApproveClick = () => {
    if (!currentSignature) {
      Swal.fire({ icon: 'warning', title: 'กรุณาลงลายมือชื่อ', confirmButtonColor: '#0f172a' })
      return
    }
    onApprove(booking.id, booking.vehicle_id, selectedDriverId, currentSignature, saveToProfile)
  }

  // หาชื่อคนขับเพื่อส่งไปพรีวิว
  const selectedDriverName = availableDrivers.find(d => d.id === selectedDriverId)?.name || "";
  const vehiclePlate = booking.vehicles?.license_plate || "";

  return (
    // ✅ 1. เพิ่ม overflow-hidden ที่กล่องแม่ เพื่อล็อคไม่ให้กล่องแม่ยืดทะลุจอ
    <div className="flex flex-col lg:flex-row gap-8 py-4 font-sarabun text-black bg-white h-full overflow-hidden">

      {/* 🔴 ฝั่งซ้าย: เครื่องมืออนุมัติ */}
      {/* ✅ 2. เพิ่ม h-full ให้ฝั่งซ้ายสูงเต็มที่ และใส่ overflow-y-auto ให้เลื่อนขึ้นลงได้ */}
      <div className="w-full lg:w-[400px] shrink-0 h-full space-y-6 overflow-y-auto pr-2 pb-10 scrollbar-hide">

        <div className="grid grid-cols-2 gap-4 bg-slate-900 p-6 rounded-[1.5rem] text-white shadow-lg shrink-0">
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
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
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

        {/* มอบหมายคนขับรถ */}
        <div className="space-y-3 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-1 bg-blue-600 rounded-full" />
            <h4 className="font-bold text-sm text-blue-900 uppercase tracking-wide flex items-center gap-2">
              <UserPlus className="size-4" /> 1. มอบหมายพนักงานขับรถ <span className="text-red-500">*</span>
            </h4>
          </div>
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
            <SelectTrigger className="w-full h-12 rounded-xl bg-white border-blue-200 focus:ring-blue-500 font-bold text-slate-700">
              <SelectValue placeholder="-- คลิกเพื่อเลือกพนักงานขับรถ --" />
            </SelectTrigger>
            <SelectContent className="bg-white font-sarabun text-black border-slate-200">
              {availableDrivers.length === 0 ? (
                <SelectItem value="none" disabled>ไม่มีพนักงานขับรถว่างในขณะนี้</SelectItem>
              ) : (
                availableDrivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id} className="font-bold focus:bg-blue-50 focus:text-blue-700">
                    {driver.name} (โทร: {driver.phone || '-'})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* ลายเซ็นผู้อนุมัติ */}
        <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <PenTool className="size-5 text-slate-700" />
              <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">
                2. ลงลายมือชื่อผู้อนุมัติ <span className="text-red-500">*</span>
              </h4>
            </div>

            {hasSavedSignature && (
              <div className="flex bg-slate-200/50 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSignatureMode('saved')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${signatureMode === 'saved' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <ImageIcon className="size-3 inline mr-1" /> ลายเซ็นที่บันทึกไว้
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('draw')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${signatureMode === 'draw' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <PenTool className="size-3 inline mr-1" /> วาดใหม่
                </button>
              </div>
            )}
          </div>

          {signatureMode === 'saved' ? (
            <div className="border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50/30 flex flex-col items-center justify-center p-6 h-32 md:h-40 relative">
              <div className="absolute top-3 right-3 text-emerald-600 flex items-center gap-1 text-xs font-bold bg-emerald-100 px-2 py-1 rounded-full">
                <CheckCircle2 className="size-3" /> ใช้งานลายเซ็นเดิม
              </div>
              <img
                src={userProfile.saved_signature}
                alt="Saved Signature"
                className="max-h-full max-w-full object-contain mix-blend-multiply"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden cursor-crosshair relative">
                <Button variant="ghost" size="sm" onClick={clearSignature} className="absolute top-2 right-2 text-slate-400 hover:text-red-600 h-7 text-xs bg-white/80 backdrop-blur z-10">
                  <Eraser className="size-3 mr-1" /> ล้าง
                </Button>
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#1e3a8a"
                  canvasProps={{ className: 'sigCanvas w-full h-32 md:h-40' }}
                  onEnd={handleSignatureEnd} 
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">ใช้นิ้วหรือเมาส์วาดลายเซ็นลงในกรอบด้านบน</p>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="save-signature"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <Label htmlFor="save-signature" className="text-sm font-medium text-slate-600 cursor-pointer flex items-center gap-1.5">
                  <Save className="size-4 text-blue-600" /> บันทึกลายเซ็นนี้ไว้ใช้ในครั้งต่อไปอัตโนมัติ
                </Label>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-2">
          <Button
            variant="outline"
            className="flex-1 text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold h-12 rounded-2xl transition-all"
            onClick={() => onReject(booking.id)}
          >
            <X className="size-4 mr-2" /> ปฏิเสธคำขอ
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold h-12 rounded-2xl text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] disabled:opacity-50"
            onClick={handleApproveClick}
            disabled={!selectedDriverId || !currentSignature}
          >
            <Check className="size-4 mr-2" /> อนุมัติการจอง
          </Button>
        </div>
      </div>

      {/* ⚪ ฝั่งขวา: พรีวิวเอกสารแบบ ๓ ของจริง */}
      {/* ✅ 3. ลบ max-h-[75vh] ออก และใส่ h-full เพื่อให้สูงเท่ากับฝั่งซ้ายเป๊ะๆ */}
      <div className="flex-1 h-full bg-slate-100 rounded-3xl p-4 md:p-6 overflow-y-auto relative border border-slate-200 shadow-inner">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-100/90 backdrop-blur-sm z-10 py-2">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Info className="size-5 text-blue-500" /> พรีวิวเอกสารใบขออนุญาต (แบบ ๓)
          </h3>
          <Button onClick={handlePrint} variant="outline" className="bg-white hover:bg-slate-50 text-blue-700 border-blue-200 font-bold h-9 shadow-sm rounded-xl">
            <Printer className="size-4 mr-2" /> พิมพ์เอกสาร
          </Button>
        </div>

        <div ref={documentRef} className="print-container overflow-hidden rounded-xl">
          <Form3Document
            booking={booking}
            driverName={selectedDriverName}
            vehiclePlate={vehiclePlate}
            signatureImage={currentSignature}
            adminName={userProfile?.full_name || userProfile?.name} 
            startMileage={booking.vehicles?.last_mileage}           
          />
        </div>
      </div>

    </div>
  )
}

// --- ส่วนที่ 3: หน้าหลัก (ApprovalsPage) ---
export default function ApprovalsPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)

  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [availableDrivers, setAvailableDrivers] = useState([])
  const [selectedDriverId, setSelectedDriverId] = useState("")

  useEffect(() => {
    fetchData()
    fetchDrivers()
  }, [])

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setUserProfile(data)
    }
    fetchUserProfile()
  }, [user])

  async function fetchData() {
    const { data: bData } = await supabase
      .from("bookings")
      .select("*, vehicles(license_plate, brand, model, last_mileage)") // ✅ เพิ่ม last_mileage เข้าไปตรงนี้
      .eq("status", "pending")
      .order("created_at", { ascending: true })

    setBookings(bData || [])
  }

  async function fetchDrivers() {
    const { data } = await supabase
      .from("drivers")
      .select("*")
      .in("status", ["ว่าง", "available"])

    setAvailableDrivers(data || [])
  }

  async function approveBooking(id, vehicleId, driverId, signatureBase64, saveToProfile) {
    if (!driverId) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกพนักงานขับรถ', confirmButtonColor: '#0f172a' });
      return;
    }

    try {
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          driver_id: driverId,
          approver_signature: signatureBase64
        })
        .eq("id", id)

      if (bookingError) throw bookingError;

      if (saveToProfile && user?.id) {
        await supabase.from("profiles").update({ saved_signature: signatureBase64 }).eq("id", user.id);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setUserProfile(data)
      }

      if (vehicleId) await supabase.from("vehicles").update({ status: "in-use" }).eq("id", vehicleId);
      if (driverId) await supabase.from("drivers").update({ status: "busy" }).eq("id", driverId);

      Swal.fire({ icon: 'success', title: 'อนุมัติสำเร็จ!', text: 'บันทึกลายเซ็นและมอบหมายงานเรียบร้อย', confirmButtonColor: '#0f172a' });

      fetchData();
      fetchDrivers();
      setSelectedBooking(null);
      setSelectedDriverId("");

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

  const handleOpenChange = (open) => {
    if (!open) {
      setSelectedBooking(null);
      setSelectedDriverId("");
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

      <Dialog open={!!selectedBooking} onOpenChange={handleOpenChange}>
        {/* ✅ ปรับความกว้าง Pop-up ให้รองรับ 2 ฝั่ง (max-w-[95vw] หรือ max-w-7xl) */}
        <DialogContent className="max-w-[98vw] lg:max-w-[1400px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white max-h-[92vh] flex flex-col">
          <DialogHeader className="p-6 bg-[#0f172a] text-white text-center shrink-0">
            <DialogTitle className="text-2xl font-bold font-sarabun tracking-tight">
              แบบฟอร์มตรวจสอบและพิจารณาอนุมัติ
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 pt-2 overflow-y-auto flex-1 bg-white scrollbar-hide">
            {selectedBooking && (
              <ApprovalDialogContent
                booking={selectedBooking}
                onApprove={approveBooking}
                onReject={rejectBooking}
                availableDrivers={availableDrivers}
                selectedDriverId={selectedDriverId}
                setSelectedDriverId={setSelectedDriverId}
                userProfile={userProfile}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}