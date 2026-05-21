"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  Check, X, ChevronRight, MapPin, Calendar, Users,
  Building2, Clock, Briefcase, UserCircle, Phone,
  Car, Info, MapPinned, UserPlus,
  PenTool, Eraser, Image as ImageIcon, Save, CheckCircle2,
  Printer, Trash2, Upload, RefreshCw, Loader2, FileText, Settings
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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

import { Form3Document } from "@/components/form-3-document"
import { useReactToPrint } from "react-to-print"

const formatThaiDate = (dateString) => {
  if (!dateString) return "ไม่ได้ระบุ";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatThaiTime = (timeString) => {
  if (!timeString) return "ไม่ได้ระบุ";
  return `${timeString.substring(0, 5)} น.`;
};

// --- ส่วนที่ 1: การ์ดรายการ ---
function BookingApprovalCard({ booking, onClick }) {
  return (
    <Card className="group overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white font-sarabun text-black">
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

// --- ส่วนที่ 2: ป๊อปอัปตรวจสอบและพิจารณา ---
function ApprovalDialogContent({ booking, onApprove, onReject, availableDrivers, selectedDriverId, setSelectedDriverId, userProfile, onUpdateSignatures }) {

  const sigCanvas = useRef(null)
  const documentRef = useRef(null)

  // ── Mobile tab state ──
  const [mobileTab, setMobileTab] = useState("approve") // "approve" | "preview"

  const savedSignatures = useMemo(() => {
    try {
      if (!userProfile?.saved_signature) return [];
      if (userProfile.saved_signature.trim().startsWith('[')) {
        return JSON.parse(userProfile.saved_signature);
      } else {
        return [{ id: 'legacy-1', data: userProfile.saved_signature }];
      }
    } catch (e) {
      return [];
    }
  }, [userProfile?.saved_signature]);

  const canSaveMore = savedSignatures.length < 5;

  const [signatureMode, setSignatureMode] = useState(savedSignatures.length > 0 ? 'saved' : 'draw')
  const [hasDrawn, setHasDrawn] = useState(false)

  const [currentSignature, setCurrentSignature] = useState(
    savedSignatures.length > 0 ? savedSignatures[0].data : null
  )

  const handlePrint = useReactToPrint({
    contentRef: documentRef,
    documentTitle: `ใบขออนุญาตใช้รถ_${booking.user_name}`,
  });

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
      setHasDrawn(false)
      setCurrentSignature(null)
    }
  }

  const handleSignatureEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setCurrentSignature(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
      setHasDrawn(true);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setCurrentSignature(canvas.toDataURL('image/png'));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  useEffect(() => {
    if (signatureMode === 'saved') {
      if (savedSignatures.length > 0) {
        const exists = savedSignatures.find(s => s.data === currentSignature)
        if (!exists) setCurrentSignature(savedSignatures[0].data)
      } else {
        setCurrentSignature(null)
      }
    } else if (signatureMode === 'draw') {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        setCurrentSignature(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
      } else {
        setCurrentSignature(null);
      }
    } else if (signatureMode === 'upload') {
      setCurrentSignature(null);
    }
  }, [signatureMode, savedSignatures]);

  const handleDeleteSignature = (e, idToDelete) => {
    e.preventDefault()
    e.stopPropagation()
    Swal.fire({
      title: 'ลบลายเซ็นนี้?', text: "คุณจะไม่สามารถกู้คืนได้", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ลบทิ้ง', cancelButtonText: 'ยกเลิก',
      returnFocus: false, allowEscapeKey: false, allowOutsideClick: false, backdrop: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return
      try {
        document.body.style.pointerEvents = 'auto'
        const updatedSignatures = savedSignatures.filter(sig => sig.id !== idToDelete)
        const success = await onUpdateSignatures(updatedSignatures)
        if (!success) { Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถลบลายเซ็นได้' }); return }
        const deletedSig = savedSignatures.find(sig => sig.id === idToDelete)
        if (deletedSig && deletedSig.data === currentSignature) {
          if (updatedSignatures.length > 0) { setCurrentSignature(updatedSignatures[0].data) }
          else { setCurrentSignature(null); setSignatureMode('draw') }
        }
        Swal.fire({ icon: 'success', title: 'ลบลายเซ็นแล้ว', timer: 1200, showConfirmButton: false })
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ลบลายเซ็นไม่สำเร็จ' })
      }
    })
  }

  const handleInstantSave = async () => {
    if (!currentSignature) return;
    Swal.fire({ title: 'กำลังบันทึกลงคลัง...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
    const newSignatureObj = { id: Date.now().toString(), data: currentSignature };
    const updatedSignatures = [...savedSignatures, newSignatureObj];
    const success = await onUpdateSignatures(updatedSignatures);
    if (success) {
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', text: 'เพิ่มรูปลงในคลังลายเซ็นเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
      setSignatureMode('saved');
    } else {
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'อาจเกิดข้อผิดพลาดในการเชื่อมต่อ' });
    }
  }

  const handleApproveClick = () => {
    if (!currentSignature) {
      Swal.fire({ icon: 'warning', title: 'กรุณาระบุลายมือชื่อ', confirmButtonColor: '#0f172a' })
      return
    }
    onApprove(booking.id, booking.vehicle_id, selectedDriverId, currentSignature, null)
  }

  const selectedDriverName = availableDrivers.find(d => d.id === selectedDriverId)?.name || "";
  const vehiclePlate = booking.vehicles?.license_plate || "";

  // ── Approval panel (shared between mobile/desktop) ──
  const ApprovalPanel = (
    <div className="space-y-5 pb-6">
      {/* User Info */}
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
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เริ่มเดินทาง</p>
          <p className="text-sm font-bold text-black">{formatThaiDate(booking.start_date)}</p>
          <p className="text-xs text-blue-600 font-bold bg-blue-50 w-fit px-2 py-0.5 rounded-lg">{formatThaiTime(booking.start_time)}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เดินทางกลับ</p>
          <p className="text-sm font-bold text-black">{formatThaiDate(booking.end_date)}</p>
          <p className="text-xs text-rose-600 font-bold bg-rose-50 w-fit px-2 py-0.5 rounded-lg ml-auto">{formatThaiTime(booking.end_time)}</p>
        </div>
      </div>

      {/* Driver selector */}
      <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
        <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
          <div className="h-3.5 w-1 bg-blue-600 rounded-full" />
          <UserPlus className="size-4" /> 1. มอบหมายพนักงานขับรถ <span className="text-red-500">*</span>
        </h4>
        <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
          <SelectTrigger className="w-full h-11 rounded-xl bg-white border-blue-200 focus:ring-blue-500 font-bold text-slate-700">
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

      {/* Signature */}
      <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <PenTool className="size-4" /> 2. ลงลายมือชื่อผู้อนุมัติ <span className="text-red-500">*</span>
          </h4>
          <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1">
            {[
              { key: 'saved', icon: <ImageIcon className="size-3" />, label: `คลัง (${savedSignatures.length}/5)` },
              { key: 'draw', icon: <PenTool className="size-3" />, label: 'วาดใหม่' },
              { key: 'upload', icon: <Upload className="size-3" />, label: 'รูปภาพ' },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSignatureMode(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap ${signatureMode === tab.key ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Saved mode */}
        {signatureMode === 'saved' && (
          <div>
            {savedSignatures.length === 0 ? (
              <div className="text-center py-8 bg-white border border-dashed border-slate-300 rounded-xl text-slate-400">
                <p className="text-sm font-medium">ยังไม่มีลายเซ็นในคลัง</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-52 overflow-y-auto pr-1">
                {savedSignatures.map((sig, index) => (
                  <div
                    key={sig.id}
                    onClick={() => setCurrentSignature(sig.data)}
                    className={`relative border-2 rounded-xl p-2 cursor-pointer transition-all ${currentSignature === sig.data ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                  >
                    {currentSignature === sig.data && (
                      <div className="absolute top-2 left-2 text-emerald-600 z-10 pointer-events-none">
                        <CheckCircle2 className="size-4" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSignature(e, sig.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50 bg-white shadow-sm border border-slate-100 rounded-full p-1 transition-colors z-20"
                    >
                      <Trash2 className="size-3" />
                    </button>
                    <div className="h-14 flex items-center justify-center mt-4 mb-1 pointer-events-none">
                      <img src={sig.data} alt="signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                    <p className="text-center text-[10px] font-semibold text-slate-500 pointer-events-none">ลายเซ็น {index + 1}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Draw mode */}
        {signatureMode === 'draw' && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden cursor-crosshair relative">
              <Button variant="ghost" size="sm" onClick={clearSignature} className="absolute top-2 right-2 text-slate-400 hover:text-red-600 h-7 text-xs bg-white/80 z-10">
                <Eraser className="size-3 mr-1" /> ล้าง
              </Button>
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#1e3a8a"
                canvasProps={{ className: 'sigCanvas w-full h-32' }}
                onEnd={handleSignatureEnd}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">ใช้นิ้วหรือเมาส์วาดลายเซ็นลงในกรอบด้านบน</p>
            <div className="flex justify-center pt-1 border-t border-slate-100">
              {canSaveMore ? (
                <Button type="button" variant="outline" size="sm"
                  className="text-blue-700 border-blue-200 hover:bg-blue-50 bg-blue-50/50 rounded-xl h-9 px-4"
                  onClick={handleInstantSave} disabled={!hasDrawn}
                >
                  <Save className="size-3.5 mr-1.5" /> บันทึกลายเซ็นนี้ลงคลัง
                </Button>
              ) : (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <Info className="size-3" /> คลังเต็มแล้ว (สูงสุด 5 รายการ)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upload mode */}
        {signatureMode === 'upload' && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden flex flex-col items-center justify-center h-32 relative group">
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer rounded-xl relative">
                {currentSignature ? (
                  <>
                    <img src={currentSignature} alt="Uploaded" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-sm">
                      <span className="text-white text-sm font-bold flex items-center gap-1"><Upload className="size-4" /> เปลี่ยนรูป</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 w-full h-full bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors">
                    <Upload className="size-7 mb-1.5" />
                    <span className="text-sm font-bold">คลิกเพื่ออัปโหลดรูปลายเซ็น</span>
                    <span className="text-[10px] mt-0.5">(รองรับ .PNG, .JPG)</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleSignatureUpload} />
              </label>
            </div>
            <div className="flex justify-center pt-1 border-t border-slate-100">
              {canSaveMore ? (
                <Button type="button" variant="outline" size="sm"
                  className="text-blue-700 border-blue-200 hover:bg-blue-50 bg-blue-50/50 rounded-xl h-9 px-4"
                  onClick={handleInstantSave} disabled={!currentSignature}
                >
                  <Save className="size-3.5 mr-1.5" /> บันทึกรูปนี้ลงคลัง
                </Button>
              ) : (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                  <Info className="size-3" /> คลังเต็มแล้ว (สูงสุด 5 รายการ)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          className="flex-1 text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold h-12 rounded-2xl transition-all"
          onClick={() => onReject(booking.id)}
        >
          <X className="size-4 mr-2" /> ปฏิเสธ
        </Button>
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold h-12 rounded-2xl text-white shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          onClick={handleApproveClick}
          disabled={!selectedDriverId || !currentSignature}
        >
          <Check className="size-4 mr-2" /> อนุมัติ
        </Button>
      </div>
    </div>
  )

  // ── Document preview panel (shared) ──
  const PreviewPanel = (
    <div className="flex-1 min-h-0 bg-slate-100 rounded-2xl p-4 overflow-y-auto border border-slate-200">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-100/95 backdrop-blur-sm z-10 py-1">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
          <Info className="size-4 text-blue-500" /> พรีวิวเอกสาร (แบบ ๓)
        </h3>
        <Button onClick={handlePrint} variant="outline" size="sm" className="bg-white hover:bg-slate-50 text-blue-700 border-blue-200 font-bold shadow-sm rounded-xl h-8">
          <Printer className="size-3.5 mr-1.5" /> พิมพ์
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
  )

  return (
    <div className="font-sarabun text-black bg-white h-full">

      {/* ════ MOBILE layout: tab switcher ════ */}
      <div className="flex flex-col h-full lg:hidden">
        {/* Tab bar */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("approve")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${mobileTab === "approve" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            <Settings className="size-4" /> พิจารณา
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${mobileTab === "preview" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
          >
            <FileText className="size-4" /> พรีวิวเอกสาร
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {mobileTab === "approve" ? ApprovalPanel : PreviewPanel}
        </div>
      </div>

      {/* ════ DESKTOP layout: side by side ════ */}
      <div className="hidden lg:flex gap-8 py-4 h-full overflow-hidden">
        <div className="w-[400px] shrink-0 h-full overflow-y-auto pr-2 scrollbar-hide">
          {ApprovalPanel}
        </div>
        <div className="flex-1 h-full bg-slate-100 rounded-2xl p-4 md:p-6 overflow-y-auto border border-slate-200 shadow-inner">
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAllData()
    const channel = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadAllData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setUserProfile(data)
    }
    fetchUserProfile()
  }, [user])

  async function loadAllData() {
    setIsLoading(true);
    try {
      const [bRes, dRes] = await Promise.all([
        supabase.from("bookings").select("*, vehicles(license_plate, brand, model, last_mileage)").eq("status", "pending").order("created_at", { ascending: true }),
        supabase.from("drivers").select("*").in("status", ["ว่าง", "available"])
      ]);
      setBookings(bRes.data || []);
      setAvailableDrivers(dRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateSignatures(updatedSignatures) {
    if (!user?.id) return false;
    try {
      const sigString = JSON.stringify(updatedSignatures);
      const { error } = await supabase.from("profiles").update({ saved_signature: sigString }).eq("id", user.id);
      if (error) throw error;
      setUserProfile(prev => ({ ...prev, saved_signature: sigString }));
      return true;
    } catch (e) {
      console.error("Save Signature Error:", e);
      return false;
    }
  }

  async function approveBooking(id, vehicleId, driverId, signatureBase64, newSignatureObj) {
    if (!driverId) { Swal.fire({ icon: 'warning', title: 'กรุณาเลือกพนักงานขับรถ', confirmButtonColor: '#0f172a' }); return; }
    try {
      const { error: bookingError } = await supabase.from("bookings").update({
        status: "approved", approved_at: new Date().toISOString(), driver_id: driverId, approver_signature: signatureBase64
      }).eq("id", id)
      if (bookingError) throw bookingError;
      if (user) {
        await supabase.from('audit_logs').insert([{ user_id: user.id, user_name: userProfile?.full_name || user.email, action: 'APPROVE', entity_type: 'bookings', entity_id: String(id), old_data: { status: 'pending' }, new_data: { status: 'approved', driver_id: driverId, vehicle_id: vehicleId } }]);
      }
      if (vehicleId) await supabase.from("vehicles").update({ status: "in-use" }).eq("id", vehicleId);
      if (driverId) await supabase.from("drivers").update({ status: "busy" }).eq("id", driverId);
      Swal.fire({ icon: 'success', title: 'อนุมัติสำเร็จ!', text: 'พิจารณาอนุมัติและมอบหมายงานเรียบร้อย', confirmButtonColor: '#0f172a' });
      loadAllData(); setSelectedBooking(null); setSelectedDriverId("");
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message });
    }
  }

  async function rejectBooking(id) {
    const { error } = await supabase.from("bookings").update({ status: "rejected" }).eq("id", id)
    if (!error) {
      if (user) {
        await supabase.from('audit_logs').insert([{ user_id: user.id, user_name: userProfile?.full_name || user.email, action: 'REJECT', entity_type: 'bookings', entity_id: String(id), old_data: { status: 'pending' }, new_data: { status: 'rejected' } }]);
      }
      Swal.fire({ icon: 'info', title: 'ดำเนินการแล้ว', text: 'ปฏิเสธคำขอจองเรียบร้อย', confirmButtonColor: '#0f172a' });
      loadAllData(); setSelectedBooking(null);
    }
  }

  const handleOpenChange = (open) => {
    if (!open) { setSelectedBooking(null); setSelectedDriverId(""); }
  }

  return (
    <div className="font-sarabun text-black min-h-screen relative bg-slate-900">
      <Image src="/images/image.png" alt="Background" fill priority className="object-cover z-0 opacity-40" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="การพิจารณาอนุมัติ" />
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">พิจารณาคำขอใช้รถยนต์</h1>
          <Button variant="outline" size="icon" onClick={loadAllData} disabled={isLoading}
            className="h-8 w-8 rounded-full border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin text-blue-600")} />
          </Button>
        </div>
        <p className="text-sm text-white/80 font-medium -mt-4">
          รายการรอตรวจเอกสาร: <span className="text-blue-400 font-bold">{bookings.length} รายการ</span>
        </p>

        {isLoading ? (
          <Card className="h-96 flex flex-col items-center justify-center border-none rounded-2xl bg-white/90 backdrop-blur-sm shadow-sm text-black">
            <Loader2 className="size-10 animate-spin text-blue-500 mb-4" />
            <p className="font-bold text-slate-500 text-lg">กำลังโหลดข้อมูลคำขอ...</p>
          </Card>
        ) : bookings.length === 0 ? (
          <Card className="h-96 flex flex-col items-center justify-center border-none rounded-2xl bg-white/95 backdrop-blur-sm shadow-sm text-black">
            <div className="p-6 rounded-full bg-slate-50 mb-4 text-slate-200"><Clock className="size-16" /></div>
            <p className="font-bold text-slate-400 text-lg">ยังไม่มีคำขอใหม่รอการพิจารณา</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {bookings.map(booking => (
              <BookingApprovalCard key={booking.id} booking={booking} onClick={() => setSelectedBooking(booking)} />
            ))}
          </div>
        )}
      </div>

      <Dialog
        modal={true}
        open={!!selectedBooking}
        onOpenChange={(open) => {
          if (Swal.isVisible()) return
          handleOpenChange(open)
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-[98vw] lg:max-w-[1400px] p-0 overflow-hidden border-none rounded-2xl lg:rounded-3xl shadow-2xl bg-white max-h-[95vh] lg:max-h-[92vh] flex flex-col"
        >
          <DialogHeader className="p-4 lg:p-6 bg-[#0f172a] text-white shrink-0 relative flex flex-row items-center justify-center">
            <DialogTitle className="text-lg lg:text-2xl font-bold font-sarabun tracking-tight mx-auto">
              แบบฟอร์มตรวจสอบและพิจารณาอนุมัติ
            </DialogTitle>
            <DialogDescription className="hidden">รายละเอียดการตรวจสอบและอนุมัติคำขอใช้รถยนต์</DialogDescription>
            <button
              onClick={() => handleOpenChange(false)}
              className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-all font-bold"
            >
              <span className="text-sm hidden sm:inline">ปิด</span>
              <X className="size-4" />
            </button>
          </DialogHeader>

          <div className="px-4 lg:px-6 pb-4 lg:pb-6 pt-3 overflow-y-auto flex-1 bg-white scrollbar-hide">
            {selectedBooking && (
              <ApprovalDialogContent
                booking={selectedBooking}
                onApprove={approveBooking}
                onReject={rejectBooking}
                availableDrivers={availableDrivers}
                selectedDriverId={selectedDriverId}
                setSelectedDriverId={setSelectedDriverId}
                userProfile={userProfile}
                onUpdateSignatures={handleUpdateSignatures}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}