"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  Check, X, MapPin, Calendar, Users,
  Clock, UserCircle, Phone, Car, Info, UserPlus,
  PenTool, Eraser, Image as ImageIcon, Save, CheckCircle2,
  Printer, Trash2, Upload, RefreshCw, Loader2, FileText, Settings, AlertCircle, Search, Eye, CalendarIcon
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import Swal from 'sweetalert2'
import SignatureCanvas from 'react-signature-canvas'
import { Rnd } from "react-rnd"

import { Form3Document } from "@/components/form-3-document"
import { useReactToPrint } from "react-to-print"

const formatThaiDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatThaiTime = (timeString) => {
  if (!timeString) return "-";
  return `${timeString.substring(0, 5)} น.`;
};

// --- ส่วนที่ 1: ป๊อปอัปพิจารณาอนุมัติ ---
function ApprovalDialogContent({ booking, onApprove, onReject, userProfile, onUpdateSignatures }) {

  const sigCanvas = useRef(null)
  const documentRef = useRef(null)

  // ขนาด A4 จริงที่ 96dpi: 210mm x 297mm
  const A4_WIDTH_PX = 793.7
  const A4_HEIGHT_PX = 1122.5

  const [mobileTab, setMobileTab] = useState("approve") 
  const [isRejectMode, setIsRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

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

  const [sigPosition, setSigPosition] = useState({ 
    x: 360, 
    y: 880, 
    width: 180, 
    height: 90 
  });

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
    onApprove(booking.id, booking.vehicle_id, booking.driver_id, currentSignature)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกเหตุผล', text: 'ต้องระบุเหตุผลในการไม่อนุมัติคำขอครับ' });
      return;
    }
    onReject(booking.id, rejectReason.trim());
  }

  const assignedVehiclePlate = booking.vehicles?.license_plate || "ไม่ได้ระบุรถ";
  const assignedDriverName = booking.drivers?.name || "ไม่ได้ระบุคนขับ";

  const ApprovalPanel = (
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
        </div>
      </div>

      {isRejectMode ? (
        <div className="space-y-4 bg-rose-50 border border-rose-200 p-5 rounded-2xl animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertCircle className="size-5 shrink-0" />
            <h4 className="font-extrabold text-sm">กรุณาระบุเหตุผลที่ไม่พิจารณาอนุมัติ</h4>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500">ข้อความชี้แจงผู้ขอใช้รถ <span className="text-red-500">*</span></Label>
            <Textarea
              rows={5}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เช่น ยานพาหนะไม่เพียงพอ, ภารกิจทับซ้อน หรือ ข้อมูลไม่ครบถ้วน..."
              className="rounded-xl font-sarabun text-black bg-white border-rose-300 focus-visible:ring-rose-500 text-sm shadow-inner"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsRejectMode(false)} className="flex-1 text-slate-500 bg-slate-200/60 hover:bg-slate-200 font-bold h-11 rounded-xl">
              ย้อนกลับ
            </Button>
            <Button onClick={handleConfirmReject} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 rounded-xl shadow-md shadow-rose-200">
              ยืนยันไม่อนุมัติ
            </Button>
          </div>
        </div>
      ) : (
        <>
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

          <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <div className="h-3.5 w-1 bg-blue-600 rounded-full" />
              <UserPlus className="size-4" /> 1. ข้อมูลการจัดสรรรถ (โดยผู้ตรวจสอบ)
            </h4>
            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-blue-100/50">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">รถยนต์ที่จัดสรร</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{assignedVehiclePlate}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">พนักงานขับรถ</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{assignedDriverName}</p>
              </div>
            </div>
          </div>

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

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold h-12 rounded-2xl transition-all"
              onClick={() => setIsRejectMode(true)}
            >
              <X className="size-4 mr-2" /> ไม่อนุมัติ
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold h-12 rounded-2xl text-white shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
              onClick={handleApproveClick}
              disabled={!currentSignature}
            >
              <Check className="size-4 mr-2" /> อนุมัติ
            </Button>
          </div>
        </>
      )}
    </div>
  )

  const sigPrintStyle = {
    left: `${(sigPosition.x / A4_WIDTH_PX) * 210}mm`,
    top: `${(sigPosition.y / A4_HEIGHT_PX) * 297}mm`,
    width: `${(sigPosition.width / A4_WIDTH_PX) * 210}mm`,
    height: `${(sigPosition.height / A4_HEIGHT_PX) * 297}mm`,
  };

  const PreviewPanel = (
    <div className="flex-1 min-h-0 bg-slate-100 rounded-2xl p-4 overflow-y-auto overflow-x-auto border border-slate-200 custom-scrollbar relative">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .hide-on-print { display: none !important; }
          .show-on-print { display: block !important; }
        }
      `}} />
      <div className="flex items-center justify-between mb-4 sticky top-0 left-0 bg-slate-100/95 backdrop-blur-sm z-50 py-1 min-w-[210mm]">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
          <Info className="size-4 text-blue-500" /> พรีวิวเอกสาร (สามารถจับลายเซ็นลากและย่อขยายได้)
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
          }}
        >
          <Form3Document
            booking={booking}
            driverName={assignedDriverName}
            vehiclePlate={assignedVehiclePlate}
            signatureImage={null} 
            adminName={userProfile?.full_name || userProfile?.name}
            startMileage={booking.vehicles?.last_mileage}
          />

          {currentSignature && (
            <Rnd
              bounds="parent"
              position={{ x: sigPosition.x, y: sigPosition.y }}
              size={{ width: sigPosition.width, height: sigPosition.height }}
              onDragStop={(e, d) => setSigPosition({ ...sigPosition, x: d.x, y: d.y })}
              onResizeStop={(e, direction, ref, delta, position) => {
                setSigPosition({
                  width: parseFloat(ref.style.width),
                  height: parseFloat(ref.style.height),
                  ...position,
                });
              }}
              className="group absolute z-40 hover:bg-blue-50/30 transition-colors hide-on-print"
            >
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                ลากย้าย / ดึงมุมย่อขยาย
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 border-dashed pointer-events-none"></div>
              
              <img 
                src={currentSignature} 
                alt="Draggable Signature" 
                className="w-full h-full object-contain mix-blend-multiply pointer-events-none" 
              />
            </Rnd>
          )}

          {currentSignature && (
            <img
              src={currentSignature}
              alt="Print Signature"
              className="hidden show-on-print absolute z-50 mix-blend-multiply pointer-events-none"
              style={{
                left: `${sigPosition.x}px`,
                top: `${sigPosition.y}px`,
                width: `${sigPosition.width}px`,
                height: `${sigPosition.height}px`,
              }}
            />
          )}

        </div>
      </div>
    </div>
  )

  return (
    // ✅ เพิ่ม min-h-0 เพื่อป้องกัน Box ทะลุเกินขอบจอเวลาขยาย
    <div className="font-sarabun text-black bg-white h-full w-full flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-0">
      
      {/* Mobile View */}
      <div className="flex flex-col h-full lg:hidden w-full min-h-0">
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
        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar min-h-0">
          {mobileTab === "approve" ? ApprovalPanel : PreviewPanel}
        </div>
      </div>

      {/* Desktop View (แยก Scroll อิสระ) */}
      <div className="hidden lg:flex w-[400px] shrink-0 h-full overflow-y-auto pr-2 pb-4 custom-scrollbar flex-col">
        {ApprovalPanel}
      </div>
      <div className="hidden lg:flex flex-1 h-full min-w-0 flex-col">
        {PreviewPanel}
      </div>
    </div>
  );
}

// --- ส่วนที่ 3: หน้าหลัก (ApprovalsPage) ---
export default function ApprovalsPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null) 
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!user) return; 
    loadAllData();
    const channel = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
         loadAllData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel) };
  }, [user]);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setUserProfile(data)
    }
    fetchUserProfile()
  }, [user])

  async function loadAllData() {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const [bRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*, vehicles(license_plate, brand, model, last_mileage), drivers(name, phone)")
          .eq("status", "pending_approval")
          .order("created_at", { ascending: true })
      ]);
      if (bRes.error) throw bRes.error;
      setBookings(bRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setFetchError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ โปรดตรวจสอบอินเทอร์เน็ต หรือปิดส่วนขยายบล็อกโฆษณา (AdBlock)");
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

  async function approveBooking(id, vehicleId, driverId, signatureBase64) {
    try {
      const { error: bookingError } = await supabase.from("bookings").update({
        status: "approved", 
        approved_at: new Date().toISOString(), 
        approver_signature: signatureBase64
      }).eq("id", id)
      
      if (bookingError) throw bookingError;
      
      if (user) {
        await supabase.from('audit_logs').insert([{ 
          user_id: user.id, 
          user_name: userProfile?.full_name || user.email, 
          action: 'APPROVE', 
          entity_type: 'bookings', 
          entity_id: String(id), 
          old_data: { status: 'pending_approval' }, 
          new_data: { status: 'approved' } 
        }]);
      }
      
      Swal.fire({ icon: 'success', title: 'อนุมัติสำเร็จ!', text: 'พิจารณาอนุมัติคำขอเรียบร้อย', confirmButtonColor: '#0f172a' });
      loadAllData(); 
      setSelectedBooking(null);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message });
    }
  }

  async function rejectBooking(id, reason) {
    const { error } = await supabase.from("bookings").update({ 
      status: "rejected",
      reject_reason: reason 
    }).eq("id", id)

    if (!error) {
      if (user) {
        await supabase.from('audit_logs').insert([{ 
          user_id: user.id, 
          user_name: userProfile?.full_name || user.email, 
          action: 'REJECT', 
          entity_type: 'bookings', 
          entity_id: String(id), 
          old_data: { status: 'pending_approval' }, 
          new_data: { status: 'rejected', reject_reason: reason } 
        }]);
      }
      Swal.fire({ icon: 'info', title: 'ดำเนินการแล้ว', text: 'ไม่อนุมัติคำขอจองเรียบร้อย', confirmButtonColor: '#0f172a' });
      loadAllData(); setSelectedBooking(null);
    }
  }

  const handleOpenChange = (open) => {
    if (!open) { setSelectedBooking(null); }
  }

  const filteredBookings = bookings.filter((b) => {
    const term = search.toLowerCase();
    return b.user_name?.toLowerCase().includes(term) || b.department?.toLowerCase().includes(term);
  });

  return (
    <div className="font-sarabun text-black min-h-screen relative bg-slate-900 pb-12">
      <Image src="/images/image.png" alt="Background" fill priority className="object-cover z-0 opacity-40" />
      <div className="absolute inset-0 bg-black/60 z-0" />

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="การพิจารณาอนุมัติ" />
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-8 relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">พิจารณาคำขอใช้รถยนต์</h1>
            <p className="text-white/80 mt-1 drop-shadow-md">ตรวจสอบเอกสารและลงลายมือชื่ออนุมัติ</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-2 font-bold text-sm backdrop-blur-sm">
              รายการรอตรวจเอกสาร: {bookings.length} รายการ
            </Badge>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="ค้นหาชื่อผู้ขอ หรือ หน่วยงาน..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-11 rounded-xl border-none shadow-sm bg-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <Button variant="outline" size="icon" onClick={loadAllData} disabled={isLoading} className="h-11 w-11 rounded-xl bg-white border-none shadow-sm text-slate-600 hover:text-blue-600 shrink-0">
              <RefreshCw className={cn("size-4", isLoading && "animate-spin text-blue-600")} />
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md rounded-[2rem] overflow-hidden bg-white/95 backdrop-blur-sm">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200/50">
                  <TableHead className="pl-6 py-5 font-bold text-slate-500 uppercase text-[11px] tracking-widest">เลขที่</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">ผู้ขอ / หน่วยงาน</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">เดินทาง</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest">รถยนต์ที่จัดสรร</TableHead>
                  <TableHead className="font-bold text-slate-500 text-center uppercase text-[11px] tracking-widest">คนขับ</TableHead>
                  <TableHead className="pr-6 text-right font-bold text-slate-500 uppercase text-[11px] tracking-widest">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="animate-spin mx-auto mb-2 text-blue-600 size-6" />กำลังโหลดข้อมูล...</TableCell></TableRow>
                ) : fetchError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center bg-rose-50/50">
                      <div className="flex flex-col items-center justify-center p-4">
                        <AlertCircle className="mb-3 text-rose-500 size-10 animate-bounce" />
                        <p className="text-rose-800 font-extrabold text-lg mb-1">พบปัญหาการเชื่อมต่อฐานข้อมูล</p>
                        <p className="text-rose-600/80 text-sm max-w-md">{fetchError}</p>
                        <Button variant="outline" onClick={loadAllData} className="mt-5 border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-800 rounded-xl px-6 h-10 font-bold">
                          <RefreshCw className="mr-2 size-4" /> ลองโหลดใหม่อีกครั้ง
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-400">ยังไม่มีคำขอใหม่รอการพิจารณา</TableCell></TableRow>
                ) : filteredBookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50 group">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-slate-500 uppercase">REQ-{b.id.split('-')[0]}</TableCell>
                    <TableCell>
                      <p className="font-bold text-slate-900">{b.user_name}</p>
                      <p className="text-[10px] text-slate-500">{b.department}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CalendarIcon className="size-3 text-slate-400" />
                        {formatThaiDate(b.start_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                        <Car className="size-3 mr-1"/> {b.vehicles?.license_plate || "ไม่ได้ระบุ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-700 text-xs">
                      {b.drivers?.name || "ไม่ได้ระบุ"}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button onClick={() => setSelectedBooking(b)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-xs font-bold shadow-sm transition-transform hover:scale-[1.02]">
                        <Eye className="size-3.5 mr-1.5" /> พิจารณา
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
          onFocusOutside={(e) => e.preventDefault()}
          // ✅ ล็อกหน้าต่าง Pop-up ให้ขยายกว้าง ไม่ทะลุขอบ และมีขนาดตรงกับหน้าผู้ตรวจสอบ 100%
          className="max-w-[98vw] lg:max-w-[1400px] p-0 overflow-hidden border-none rounded-2xl lg:rounded-3xl shadow-2xl bg-white h-[95vh] lg:h-[90vh] flex flex-col"
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

          {/* ✅ ให้เนื้อหาด้านในเลื่อนแยกอิสระจากกัน ไม่ล้นหน้าจอ */}
          <div className="px-4 lg:px-6 pb-4 lg:pb-6 pt-3 overflow-hidden flex-1 bg-white flex flex-col min-h-0 rounded-b-2xl lg:rounded-b-3xl">
            {selectedBooking && (
              <ApprovalDialogContent
                booking={selectedBooking}
                onApprove={approveBooking}
                onReject={rejectBooking}
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