"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context" 
import { 
  FileText, Printer, Info, Clock, CheckCircle2, Search, X
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useReactToPrint } from "react-to-print"
import { Form3Document } from "@/components/form-3-document" 

const formatThaiDate = (dateString) => {
  if (!dateString) return "ไม่ได้ระบุ";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

// --- คอมโพเนนต์แสดงเนื้อหาเอกสาร ---
function HistoryDialogContent({ booking, userProfile, onClose }) {
  const documentRef = useRef(null)
  const isCompleted = booking.status === "completed"

  const handlePrint = useReactToPrint({
    contentRef: documentRef, 
    documentTitle: `ใบขออนุญาตใช้รถ_${booking.user_name}`,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 p-4 md:p-6">
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
            {isCompleted ? <CheckCircle2 className="size-6" /> : <Clock className="size-6" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              {isCompleted ? "เอกสารสมบูรณ์พร้อมพิมพ์" : "กำลังดำเนินการ (รอคนขับจบงาน)"}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {isCompleted ? "คนขับกรอกเลขไมล์เรียบร้อยแล้ว สามารถพิมพ์เอกสารได้" : "ดูพรีวิวเอกสารได้ แต่ยังไม่สามารถพิมพ์ได้จนกว่าคนขับจะกรอกเลขไมล์หลังไป"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isCompleted ? (
            <Button onClick={handlePrint} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 font-bold shadow-md rounded-xl h-12 px-6">
              <Printer className="size-4 mr-2" /> พิมพ์เอกสาร
            </Button>
          ) : (
            <Badge variant="outline" className="flex-1 sm:flex-none justify-center text-amber-600 border-amber-200 bg-amber-50 px-4 h-12 text-sm">
              รอเลขไมล์จากคนขับ
            </Badge>
          )}

          <Button onClick={onClose} variant="outline" className="flex-1 sm:flex-none h-12 px-4 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="size-5 sm:mr-2" /> 
            <span className="hidden sm:inline">ปิดหน้าต่าง</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex justify-center pb-10">
        <div ref={documentRef} className="print-container shadow-xl rounded-xl overflow-hidden border border-slate-200 bg-white h-max">
          <Form3Document 
            booking={booking} 
            driverName={booking.display_driver_name} 
            vehiclePlate={booking.display_license_plate} 
            signatureImage={booking.approver_signature} 
            adminName={userProfile?.full_name || userProfile?.name} 
            // ✅ ใช้เลขไมล์ที่ดึงมาจากตาราง logbooks ที่ประมวลผลแล้ว
            startMileage={booking.logbook_start_mileage} 
            endMileage={booking.logbook_end_mileage} 
          />
        </div>
      </div>
    </div>
  )
}

// --- หน้าหลักประวัติการอนุมัติ ---
export default function HistoryPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [historyBookings, setHistoryBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setUserProfile(data)
    }
    fetchUserProfile()
  }, [user])

  async function fetchHistory() {
    setIsLoading(true)
    try {
      // 1. ดึงข้อมูลการจองทั้งหมด
      const { data: bData, error: bError } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["approved", "completed", "started"])
        .order("created_at", { ascending: false });

      if (bError) throw bError;

      // 2. ดึงข้อมูลรถและคนขับ
      const { data: vData } = await supabase.from("vehicles").select("id, license_plate, last_mileage");
      const { data: dData } = await supabase.from("drivers").select("id, name");

      // 3. ✅ ดึงข้อมูลตาราง logbooks เฉพาะที่เกี่ยวข้องกับงานพวกนี้
      const bookingIds = (bData || []).map(b => b.id);
      let lData = [];
      if (bookingIds.length > 0) {
        const { data: logs } = await supabase
          .from("logbooks")
          .select("booking_id, log_date, start_mileage, end_mileage")
          .in("booking_id", bookingIds)
          .order("log_date", { ascending: true }); // ✅ เรียงตามวันที่ เพื่อหาวันแรกและวันสุดท้าย
        lData = logs || [];
      }

      // 4. ประกอบร่างข้อมูลเข้าด้วยกัน
      const enrichedData = (bData || []).map(booking => {
        const vehicle = vData?.find(v => v.id === booking.vehicle_id);
        const driver = dData?.find(d => d.id === booking.driver_id);
        
        // หากลุ่ม logbooks ของงานนี้
        const bookingLogs = lData.filter(l => l.booking_id === booking.id);
        
        // ตัวแปรเก็บเลขไมล์ที่จะไปแสดงในกระดาษ
        let finalStartMileage = "...........................";
        let finalEndMileage = "...........................";

        if (bookingLogs.length > 0) {
          // มีบันทึกใน logbook -> วันแรกเอาไมล์เริ่ม, วันสุดท้ายเอาไมล์จบ
          finalStartMileage = bookingLogs[0].start_mileage || "...........................";
          finalEndMileage = bookingLogs[bookingLogs.length - 1].end_mileage || "...........................";
        } else {
          // ยังไม่มีบันทึกเลย (รถยังไม่ออก) -> โชว์เลขไมล์ปัจจุบันของรถไปก่อน
          finalStartMileage = vehicle?.last_mileage || "...........................";
        }

        return {
          ...booking,
          display_license_plate: vehicle?.license_plate || booking.license_plate || "-",
          display_driver_name: driver?.name || booking.driver_name || "ไม่ระบุคนขับ",
          current_mileage: vehicle?.last_mileage,
          logbook_start_mileage: finalStartMileage, // ✅ เก็บค่าที่คำนวณแล้วไว้ใช้
          logbook_end_mileage: finalEndMileage      // ✅ เก็บค่าที่คำนวณแล้วไว้ใช้
        };
      });

      setHistoryBookings(enrichedData);
    } catch (err) {
      console.error("❌ Error fetching history:", err);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="font-sarabun text-black min-h-screen bg-slate-50/30">
      <PageHeader title="ประวัติการอนุมัติ" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 italic">
              สมุดบันทึกและประวัติการใช้รถ
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              รายการที่อนุมัติแล้วและเสร็จสิ้นทั้งหมด ({historyBookings.length} รายการ)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อผู้ขอ หรือ ปลายทาง..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
              <div className="size-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : historyBookings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
              <div className="p-6 rounded-full bg-slate-50 mb-4 text-slate-300">
                <FileText className="size-16" />
              </div>
              <p className="font-bold text-lg text-slate-400">ยังไม่มีประวัติการอนุมัติ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 text-[13px] text-slate-500 uppercase tracking-wider">
                    <th className="p-4 font-bold rounded-tl-3xl">ผู้ขอ / หน่วยงาน</th>
                    <th className="p-4 font-bold">ปลายทาง / วัตถุประสงค์</th>
                    <th className="p-4 font-bold">เริ่มเดินทาง</th>
                    <th className="p-4 font-bold">รถ / คนขับ</th>
                    <th className="p-4 font-bold text-center">สถานะ</th>
                    <th className="p-4 font-bold text-center rounded-tr-3xl">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <p className="font-bold text-slate-900 text-[15px]">{booking.user_name}</p>
                        <p className="text-[13px] text-slate-500 mt-0.5">{booking.department || 'ไม่ระบุหน่วยงาน'}</p>
                      </td>
                      <td className="p-4 max-w-[200px] truncate">
                        <p className="font-bold text-slate-700 text-[14px] truncate">{booking.destination}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5 truncate">{booking.purpose || '-'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-[14px] font-semibold text-slate-800">{formatThaiDate(booking.start_date)}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">ถึง {formatThaiDate(booking.end_date)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-[14px] font-bold text-blue-600">{booking.display_license_plate}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">{booking.display_driver_name}</p>
                      </td>
                      <td className="p-4 text-center">
                        {booking.status === "completed" ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1">
                            เสร็จสิ้น
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold px-3 py-1">
                            กำลังดำเนินการ
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          onClick={() => setSelectedBooking(booking)}
                          variant="ghost"
                          className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all"
                        >
                          <FileText className="size-4 mr-2" />
                          ดูเอกสาร
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-5xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white max-h-[95vh] flex flex-col">
          <DialogHeader className="p-6 bg-[#0f172a] text-white text-center shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-bold font-sarabun tracking-tight text-white mx-auto">
              แฟ้มเอกสารใบขออนุญาตใช้รถ (แบบ ๓)
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-hidden flex-1 flex flex-col bg-slate-50 min-h-0">
            {selectedBooking && (
              <HistoryDialogContent 
                booking={selectedBooking} 
                userProfile={userProfile} 
                onClose={() => setSelectedBooking(null)} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}