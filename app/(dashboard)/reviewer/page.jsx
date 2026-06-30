"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Car,
  UserCircle,
  FileText,
  X,
  ClipboardList,
  CalendarIcon,
  MapPin,
  Loader2,
  RefreshCw,
  Phone,
  UserPlus,
  Settings,
  Printer,
  Info
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import Swal from 'sweetalert2'

// ✅ Import คอมโพเนนต์พรีวิวเอกสารและระบบ Print
import { Form3Document } from "@/components/form-3-document"
import { useReactToPrint } from "react-to-print"

// --- Formatting Helpers ---
const formatThaiDate = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
};

const formatThaiTime = (timeString) => {
  if (!timeString) return "-";
  return `${timeString.substring(0, 5)} น.`;
};

// --- ส่วนที่ 1: ป๊อปอัปตรวจสอบและพิจารณา (แบบมีพรีวิวเอกสาร) ---
function ReviewDialogContent({ booking, vehicles, drivers, allBookings, onClose, onApprove, onReject, userProfile, isReadOnly }) {
  const documentRef = useRef(null);
  
  // ✅ ล็อกขนาด A4 ให้ตรงกับสเกลหน้าผู้อนุมัติเป๊ะๆ 100%
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;

  const [mobileTab, setMobileTab] = useState("review"); 
  const [allocationMode, setAllocationMode] = useState(booking?.status === 'rejected' ? "reject" : "approve");
  
  const [allocationData, setAllocationData] = useState({
    vehicle_id: booking?.vehicle_id || "",
    driver_id: booking?.driver_id || "",
    reject_reason: booking?.reject_reason || ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: documentRef,
    documentTitle: `ใบขออนุญาตใช้รถ_${booking.user_name}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    `,
  });

  const checkResourceAvailability = (resourceId, type, currentBooking) => {
    if (!currentBooking || !resourceId) return false;

    const getSafeDate = (dateStr, timeStr) => {
      if (!dateStr || !timeStr) return new Date(0);
      const safeTime = timeStr.substring(0, 5);
      return new Date(`${dateStr}T${safeTime}:00`);
    };

    const reqStart = getSafeDate(currentBooking.start_date, currentBooking.start_time);
    const reqEnd = getSafeDate(currentBooking.end_date, currentBooking.end_time);

    const conflict = allBookings.find(b => {
      if (String(b.id) === String(currentBooking.id)) return false;

      const isTargetResource = type === 'vehicle' 
        ? String(b.vehicle_id) === String(resourceId) 
        : String(b.driver_id) === String(resourceId);

      if (!isTargetResource) return false;
      if (b.status === 'rejected' || b.status === 'completed') return false;

      const bStart = getSafeDate(b.start_date, b.start_time);
      const bEnd = getSafeDate(b.end_date, b.end_time);
      
      return (reqStart < bEnd) && (bStart < reqEnd);
    });

    return !conflict;
  };

  const handleAction = async () => {
    if (allocationMode === "approve" && (!allocationData.vehicle_id || !allocationData.driver_id)) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกรถและคนขับให้ครบถ้วน' });
      return;
    }
    if (allocationMode === "reject" && !allocationData.reject_reason) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (allocationMode === "approve") {
        await onApprove(booking.id, allocationData.vehicle_id, allocationData.driver_id);
      } else {
        await onReject(booking.id, allocationData.reject_reason);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDriverName = drivers.find(d => d.id === allocationData.driver_id)?.name || ".......................................................";
  const selectedVehiclePlate = vehicles.find(v => v.id === allocationData.vehicle_id)?.license_plate || "........................";
  const selectedVehicleMileage = vehicles.find(v => v.id === allocationData.vehicle_id)?.last_mileage;

  const ReviewPanel = (
    <div className="space-y-5 pb-6">
      <div className="grid grid-cols-2 gap-4 bg-slate-900 p-5 rounded-2xl text-white shadow-md">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ผู้ขอใช้รถ</p>
          <div className="flex items-center gap-2">
            <UserCircle className="size-4 text-blue-400 shrink-0" />
            <p className="text-base font-bold leading-tight">{booking.user_name}</p>
          </div>
          <p className="text-sm text-slate-300 ml-6">{booking.position || 'ไม่ระบุตำแหน่ง'}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">หน่วยงาน</p>
          <p className="text-sm font-semibold">{booking.department}</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1"><Phone className="size-3"/> {booking.contact_phone}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="size-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="w-full">
            <p className="text-[10px] font-bold text-slate-500">ปลายทาง / วัตถุประสงค์</p>
            <p className="font-bold text-sm text-slate-900">{booking.destination}</p>
            <p className="text-xs text-slate-600">{booking.purpose}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">เริ่มเดินทาง</p>
            <p className="text-xs font-bold text-black">{formatThaiDate(booking.start_date)}</p>
            <p className="text-xs text-blue-600 font-bold">{formatThaiTime(booking.start_time)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">เดินทางกลับ</p>
            <p className="text-xs font-bold text-black">{formatThaiDate(booking.end_date)}</p>
            <p className="text-xs text-rose-600 font-bold">{formatThaiTime(booking.end_time)}</p>
          </div>
        </div>
        <div className="flex gap-4 pt-3 border-t border-slate-100">
          <div className="flex-1 bg-slate-50 p-2 rounded-xl text-center">
            <p className="text-[10px] font-bold text-slate-500">ประเภทรถที่ขอ</p>
            <p className="font-extrabold text-blue-700 text-xs">{booking.vehicle_type_preference}</p>
          </div>
          <div className="flex-1 bg-slate-50 p-2 rounded-xl text-center">
            <p className="text-[10px] font-bold text-slate-500">จำนวนผู้โดยสาร</p>
            <p className="font-extrabold text-emerald-700 text-xs">{booking.passengers} คน</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <ClipboardList className="size-4 text-emerald-600" /> การตัดสินใจตรวจสอบ
        </h4>
        
        <div className={cn("flex gap-3 bg-slate-100 p-1 rounded-2xl", isReadOnly && "pointer-events-none opacity-80")}>
          <button 
            disabled={isReadOnly}
            onClick={() => setAllocationMode("approve")}
            className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all", allocationMode === "approve" ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700")}
          >
            ผ่าน & จัดสรรรถ
          </button>
          <button 
            disabled={isReadOnly}
            onClick={() => setAllocationMode("reject")}
            className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all", allocationMode === "reject" ? "bg-white text-rose-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700")}
          >
            ตีกลับ / ไม่อนุมัติ
          </button>
        </div>

        {allocationMode === "approve" ? (
          <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div className="space-y-2">
              <Label className="font-bold text-blue-900 flex items-center gap-2"><Car className="size-4"/> เลือกรถยนต์</Label>
              <Select disabled={isReadOnly} value={allocationData.vehicle_id} onValueChange={(v) => setAllocationData({...allocationData, vehicle_id: v})}>
                <SelectTrigger className="h-11 rounded-xl bg-white border-blue-200 focus:ring-blue-500 font-bold text-slate-700">
                  <SelectValue placeholder="-- เลือกรถยนต์ --" />
                </SelectTrigger>
                <SelectContent className="bg-white font-sarabun border-slate-200">
                  {vehicles.map(v => {
                    const isAvail = isReadOnly ? true : checkResourceAvailability(v.id, 'vehicle', booking);
                    return (
                      <SelectItem key={v.id} value={v.id} disabled={!isAvail} className={cn("font-bold", !isAvail && "opacity-50")}>
                        {v.license_plate} - {v.brand} ({v.seats} ที่นั่ง) {!isAvail && "❌ ติดภารกิจ"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-blue-900 flex items-center gap-2"><UserPlus className="size-4"/> เลือกพนักงานขับรถ</Label>
              <Select disabled={isReadOnly} value={allocationData.driver_id} onValueChange={(v) => setAllocationData({...allocationData, driver_id: v})}>
                <SelectTrigger className="h-11 rounded-xl bg-white border-blue-200 focus:ring-blue-500 font-bold text-slate-700">
                  <SelectValue placeholder="-- เลือกพนักงานขับรถ --" />
                </SelectTrigger>
                <SelectContent className="bg-white font-sarabun border-slate-200">
                  {drivers.length === 0 ? (
                    <SelectItem value="none" disabled>ไม่มีพนักงานขับรถว่างในขณะนี้</SelectItem>
                  ) : (
                    drivers.map((driver) => {
                      const isDriverAvail = isReadOnly ? true : checkResourceAvailability(driver.id, 'driver', booking);
                      return (
                        <SelectItem key={driver.id} value={driver.id} disabled={!isDriverAvail} className={cn("font-bold", !isDriverAvail && "opacity-50")}>
                          {driver.name} (โทร: {driver.phone || '-'}) {!isDriverAvail && "❌ ติดภารกิจ"}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-2 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
            <Label className="font-bold text-rose-800">เหตุผลที่ตีกลับ <span className="text-red-500">*</span></Label>
            <Textarea 
              disabled={isReadOnly}
              rows={4}
              placeholder="ระบุเหตุผลให้ผู้ขอทราบ..."
              value={allocationData.reject_reason}
              onChange={(e) => setAllocationData({...allocationData, reject_reason: e.target.value})}
              className="rounded-xl resize-none font-sarabun bg-white border-rose-200 focus-visible:ring-rose-500"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onClose} className="flex-1 text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold h-12 rounded-2xl">
          {isReadOnly ? "ปิดหน้าต่าง" : "ยกเลิก"}
        </Button>
        
        {!isReadOnly && (
          <Button 
            onClick={handleAction} disabled={isSubmitting}
            className={cn("flex-1 font-bold h-12 rounded-2xl text-white shadow-lg transition-all", allocationMode === "approve" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-rose-600 hover:bg-rose-700 shadow-rose-200")}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin"/>}
            <CheckCircle2 className="mr-2 size-4" /> 
            {allocationMode === "approve" ? "ยืนยันจัดสรรรถ" : "ยืนยันตีกลับ"}
          </Button>
        )}
      </div>
    </div>
  );

  // ✅ ปรับ PreviewPanel ให้ล็อกขนาดและมี Layout เหมือนผู้อนุมัติ
  const PreviewPanel = (
    <div className="flex-1 min-h-0 bg-slate-100 rounded-2xl p-4 overflow-y-auto overflow-x-auto border border-slate-200 custom-scrollbar relative">
      <div className="flex items-center justify-between mb-4 sticky top-0 left-0 bg-slate-100/95 backdrop-blur-sm z-50 py-1 min-w-[210mm]">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
          <Info className="size-4 text-blue-500" /> พรีวิวเอกสาร (แบบ ๓)
        </h3>
        <Button onClick={handlePrint} variant="outline" size="sm" className="bg-white hover:bg-slate-50 text-blue-700 border-blue-200 font-bold shadow-sm rounded-xl h-8">
          <Printer className="size-3.5 mr-1.5" /> พิมพ์
        </Button>
      </div>

      <div className="w-full flex justify-center pb-8 overflow-auto">
        <div 
          ref={documentRef} 
          className="print-container relative bg-white shadow-xl border border-slate-200 select-none overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0 shrink-0"
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            minWidth: `${A4_WIDTH_PX}px`,
            minHeight: `${A4_HEIGHT_PX}px`,
          }}
        >
          <Form3Document
            booking={booking}
            driverName={selectedDriverName}
            vehiclePlate={selectedVehiclePlate}
            signatureImage={null} 
            adminName={userProfile?.full_name || userProfile?.name}
            startMileage={selectedVehicleMileage}
          />
        </div>
      </div>
    </div>
  );

  return (
    // ✅ เพิ่ม min-h-0 เพื่อให้การแบ่งคอลัมน์ไม่ทะลุกรอบ
    <div className="font-sarabun text-black bg-white h-full w-full flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-0">
      
      {/* Mobile View */}
      <div className="flex flex-col h-full lg:hidden w-full min-h-0">
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("review")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${mobileTab === "review" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            <Settings className="size-4" /> จัดสรรรถ
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${mobileTab === "preview" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
          >
            <FileText className="size-4" /> พรีวิวเอกสาร
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar min-h-0">
          {mobileTab === "review" ? ReviewPanel : PreviewPanel}
        </div>
      </div>

      {/* Desktop View (แยก Scroll อิสระ) */}
      <div className="hidden lg:flex w-[400px] shrink-0 h-full overflow-y-auto pr-2 pb-4 custom-scrollbar flex-col">
        {ReviewPanel}
      </div>
      <div className="hidden lg:flex flex-1 h-full min-w-0 flex-col">
        {PreviewPanel}
      </div>
    </div>
  );
}

// --- ส่วนที่ 2: หน้าหลัก (ReviewerBookingsPage) ---
export default function ReviewerBookingsPage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null)
  
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); 
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // ✅ 1. ห่อฟังก์ชันโหลดข้อมูลด้วย useCallback
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // ❌ ลบ getSession ออกเพื่อป้องกัน Lock Error
      
      const promises = [
        supabase.from("bookings").select("*, vehicles(license_plate)").order("created_at", { ascending: false }),
        supabase.from("vehicles").select("*"), 
        supabase.from("drivers").select("id, name, phone, status"), 
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ];

      const [bRes, vRes, dRes, pRes] = await Promise.all(promises);

      if (bRes.error) throw new Error(`Bookings Error: ${bRes.error.message}`);
      if (vRes.error) throw new Error(`Vehicles Error: ${vRes.error.message}`);
      
      setBookings(bRes.data || []);
      setAllBookings(bRes.data || []);
      setVehicles(vRes.data || []);
      setDrivers(dRes.data || []);
      if (pRes.data) setUserProfile(pRes.data);

    } catch (error) {
      // ✅ 2. ข้าม Error แจ้งเตือนสีแดงจาก React Strict Mode
      if (error.name === 'AbortError' || error.message?.includes('Lock') || error.message?.includes('steal')) {
        return; 
      }
      console.error("Load Error:", error);
      Swal.fire({ icon: 'error', title: 'ดึงข้อมูลไม่สำเร็จ', text: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ✅ 3. รวม Real-time และ Visibility API ไว้ด้วยกัน
  useEffect(() => {
    if (!user) return;
    
    loadData(); // โหลดครั้งแรกตอนเปิดหน้า

    // -- จัดการเรื่องสลับแท็บเบราว์เซอร์ --
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // -- จัดการเรื่อง Real-time Database --
    const channel = supabase
      .channel('reviewer-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
         loadData(); 
      })
      .subscribe();

    // Cleanup ถอดการติดตามทั้งหมดเมื่อปิดหน้านี้
    return () => { 
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      supabase.removeChannel(channel); 
    };
  }, [user, loadData]);

  // ฟังก์ชัน handleOpenReview อยู่ต่อจากตรงนี้...

  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
  };

  const approveBooking = async (id, vehicleId, driverId) => {
    try {
      const { error } = await supabase.from("bookings").update({
        status: "pending_approval", 
        vehicle_id: vehicleId, 
        driver_id: driverId 
      }).eq("id", id);
      
      if (error) throw error;

      await supabase.from("audit_logs").insert([{
        user_id: user?.id,
        user_name: userProfile?.full_name || user?.email,
        action: "ALLOCATE",
        entity_type: "bookings",
        entity_id: String(id),
      }]);

      setReviewModalOpen(false);
      Swal.fire({ icon: 'success', title: 'จัดสรรรถสำเร็จ', timer: 1500, showConfirmButton: false });
      loadData();
    } catch (error) {
      throw error;
    }
  };

  const rejectBooking = async (id, reason) => {
    try {
      const { error } = await supabase.from("bookings").update({
        status: "rejected", 
        reject_reason: reason 
      }).eq("id", id);
      
      if (error) throw error;

      await supabase.from("audit_logs").insert([{
        user_id: user?.id,
        user_name: userProfile?.full_name || user?.email,
        action: "REJECT",
        entity_type: "bookings",
        entity_id: String(id),
      }]);

      setReviewModalOpen(false);
      Swal.fire({ icon: 'success', title: 'ตีกลับคำขอแล้ว', timer: 1500, showConfirmButton: false });
      loadData();
    } catch (error) {
      throw error;
    }
  };

  const displayedBookings = bookings.filter(b => {
    const matchesSearch = b.user_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "pending" ? b.status === "pending_review" : b.status !== "pending_review";
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen font-sarabun text-black relative bg-slate-900 pb-12">
      <Image src="/images/image.png" alt="Background" fill priority className="object-cover z-0 opacity-40" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="ตรวจสอบและจัดสรรรถ" />
      </div>
      
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">ตรวจสอบและจัดสรรยานพาหนะ</h1>
            <p className="text-white/80 mt-1 drop-shadow-md">คัดกรองคำขอ และจับคู่ยานพาหนะพร้อมพนักงานขับรถ</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl w-full sm:w-auto border border-white/20">
            <button 
              onClick={() => setActiveTab("pending")}
              className={cn("flex-1 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-200", activeTab === "pending" ? "bg-white text-blue-700 shadow-sm" : "text-white/80 hover:text-white")}
            >
              รอตรวจสอบ ({bookings.filter(b => b.status === 'pending_review').length})
            </button>
            <button 
              onClick={() => setActiveTab("processed")}
              className={cn("flex-1 sm:px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-200", activeTab === "processed" ? "bg-white text-blue-700 shadow-sm" : "text-white/80 hover:text-white")}
            >
              ดำเนินการแล้ว
            </button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="ค้นหาชื่อผู้ขอ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-11 rounded-xl border-none shadow-sm bg-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading} className="h-11 w-11 rounded-xl bg-white border-none shadow-sm text-slate-600 hover:text-blue-600">
              <RefreshCw className={cn("size-4", isLoading && "animate-spin text-blue-600")} />
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md rounded-[2rem] overflow-hidden bg-white/95 backdrop-blur-sm">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200/50">
                  <TableHead className="pl-6 font-bold text-slate-500">เลขที่</TableHead>
                  <TableHead className="font-bold text-slate-500">ผู้ขอ / หน่วยงาน</TableHead>
                  <TableHead className="font-bold text-slate-500">เดินทาง</TableHead>
                  <TableHead className="font-bold text-slate-500">ประเภทรถที่ขอ</TableHead>
                  <TableHead className="font-bold text-slate-500 text-center">คน</TableHead>
                  {activeTab === 'processed' && <TableHead className="font-bold text-slate-500">สถานะ</TableHead>}
                  <TableHead className="pr-6 text-right font-bold text-slate-500">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-48 text-center"><Loader2 className="animate-spin mx-auto mb-2 text-blue-600 size-6" />กำลังโหลดข้อมูล...</TableCell></TableRow>
                ) : displayedBookings.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-48 text-center text-slate-400">ไม่มีรายการคำขอ</TableCell></TableRow>
                ) : displayedBookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-slate-500 uppercase">REQ-{b.id.split('-')[0]}</TableCell>
                    <TableCell>
                      <p className="font-bold text-slate-900">{b.user_name}</p>
                      <p className="text-[10px] text-slate-500">{b.department}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CalendarIcon className="size-3" />
                        {formatThaiDate(b.start_date)} - {formatThaiDate(b.end_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">{b.vehicle_type_preference}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-700">{b.passengers}</TableCell>
                    
                    {activeTab === 'processed' && (
                      <TableCell className="text-center">
                        <Badge className={cn("text-[9px] px-2 py-0.5 border shadow-sm", 
                          b.status === 'pending_approval' ? "bg-yellow-100 text-yellow-700 border-yellow-200" : 
                          b.status === 'rejected' ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"
                        )}>
                          {b.status === 'pending_approval' ? 'รออนุมัติ' : b.status === 'rejected' ? 'ไม่อนุมัติ' : 'อนุมัติแล้ว'}
                        </Badge>
                      </TableCell>
                    )}

                    <TableCell className="pr-6 text-right">
                      {activeTab === "pending" ? (
                        <Button onClick={() => handleOpenReview(b)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-xs font-bold shadow-sm transition-transform hover:scale-[1.02]">
                          ตรวจสอบ
                        </Button>
                      ) : (
                        <Button onClick={() => handleOpenReview(b)} variant="outline" className="rounded-xl h-9 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border-slate-200 shadow-sm">ดูรายละเอียด</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ✅ ปรับ Dialog ให้ความกว้างความสูงเหมือนหน้าผู้อนุมัติ เพื่อป้องกันการทะลุกรอบและบีบอัด */}
        <Dialog 
          open={reviewModalOpen} 
          onOpenChange={(open) => {
            if (!open) setSelectedBooking(null);
            setReviewModalOpen(open);
          }}
        >
          <DialogContent 
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onFocusOutside={(e) => e.preventDefault()}
            className="max-w-[98vw] lg:max-w-[1400px] p-0 overflow-hidden border-none rounded-2xl lg:rounded-3xl shadow-2xl bg-white h-[95vh] lg:h-[90vh] flex flex-col"
          >
            <DialogHeader className="hidden">
              <DialogTitle>จัดการคำขอจองรถ</DialogTitle>
              <DialogDescription>ตรวจสอบ อนุมัติ และจัดสรรยานพาหนะ</DialogDescription>
            </DialogHeader>

            <div className="p-4 lg:p-5 bg-[#0f172a] text-white shrink-0 relative flex flex-row items-center justify-center">
              <h2 className="text-lg lg:text-2xl font-bold font-sarabun tracking-tight mx-auto">
                จัดการคำขอและจัดสรรรถยนต์
              </h2>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-all font-bold"
              >
                <span className="text-sm hidden sm:inline">ปิด</span>
                <X className="size-4" />
              </button>
            </div>

            {/* ✅ ซ่อน Scrollbar ของตัวกล่องหลัก แล้วไปให้หน้าต่างซ้ายขวาเลื่อนแยกกันเอง */}
            <div className="px-4 lg:px-6 pb-4 lg:pb-6 pt-3 overflow-hidden flex-1 bg-white flex flex-col min-h-0 rounded-b-2xl lg:rounded-b-3xl">
              {selectedBooking && (
                <ReviewDialogContent
                  booking={selectedBooking}
                  vehicles={vehicles}
                  drivers={drivers}
                  allBookings={allBookings}
                  onClose={() => setReviewModalOpen(false)}
                  onApprove={approveBooking}
                  onReject={rejectBooking}
                  userProfile={userProfile}
                  isReadOnly={activeTab === "processed"} 
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}