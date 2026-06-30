"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  FileText, FileSpreadsheet, Fuel, Route,
  Car, Calendar, Search, Droplet, Milestone,
  Loader2, RefreshCw, Printer
} from "lucide-react"
import {
  Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell
} from "recharts"
import * as XLSX from "xlsx"
import Swal from "sweetalert2"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"

/* ===================== UTIL ===================== */

function getVehiclePlate(vehicle) { return vehicle?.license_plate || "-" }
function getLogDate(log)          { return log?.log_date || log?.created_at || "" }
function getDistance(log)         { return Number(log?.distance    || 0) }
function getFuelLiters(log)       { return Number(log?.fuel_liter  || 0) }
function getFuelCost(log)         { return Number(log?.fuel_cost   || 0) }

function getMonthLabel(dateString) {
  const date = new Date(dateString)
  if (isNaN(date)) return "-"
  return date.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })
}

function formatDateThai(dateString) {
  if (!dateString) return "-"
  const date = new Date(dateString)
  if (isNaN(date)) return dateString
  return date.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })
}

const formatNumber = (num) =>
  Number(num).toLocaleString("th-TH", { maximumFractionDigits: 2 })

/* ===================== COMPONENT ===================== */

export default function ReportsPage() {
  const [vehicles,   setVehicles]   = useState([])
  const [logEntries, setLogEntries] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [exporting,  setExporting]  = useState(false)

  const today    = new Date()
  const firstDay = `${today.getFullYear()}-01-01`
  const todayStr = today.toISOString().slice(0, 10)

  const [startDate,       setStartDate]       = useState(firstDay)
  const [endDate,         setEndDate]         = useState(todayStr)
  const [selectedVehicle, setSelectedVehicle] = useState("all")

  // ref ที่ชี้ไปยัง hidden div ที่จะ render เป็น PDF
  const pdfContentRef = useRef(null)

 /* ===================== FETCH ===================== */

  // ✅ 1. ห่อฟังก์ชันด้วย useCallback และดักจับ Error หน้าจอแดง (Strict Mode)
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, lRes, fRes] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("logbooks").select("*").order("log_date", { ascending: true }),
        supabase.from("fuel_expenses").select("*"),
      ])

      const logbooksData    = lRes.data || []
      const fuelExpensesData = fRes.data || []

      const mappedLogs = logbooksData.map((log) => {
        const matchingFuels = fuelExpensesData.filter(
          (f) => String(f.booking_id) === String(log.booking_id) && f.log_date === log.log_date
        )
        const dayFuelLiter = matchingFuels.reduce((s, f) => s + Number(f.fuel_liter || 0), 0)
        const dayFuelCost  = matchingFuels.reduce((s, f) => s + Number(f.fuel_cost  || 0), 0)
        return { ...log, fuel_liter: dayFuelLiter, fuel_cost: dayFuelCost }
      })

      setVehicles(vRes.data || [])
      setLogEntries(mappedLogs)
    } catch (error) {
      // ✅ 2. ดักข้าม Error ที่เกิดจาก React Strict Mode แย่งกันดึงข้อมูล
      if (error.name === 'AbortError' || error.message?.includes('Lock') || error.message?.includes('steal')) {
        return; 
      }
      console.error("Error loading reports data:", error)
    } finally {
      setLoading(false)
    }
  }, []);

  // ✅ 3. โหลดตอนเปิดหน้าเว็บ + รีเฟรชเมื่อสลับแท็บ + อัปเดต Real-time
  useEffect(() => { 
    fetchData(); 

    // -- ดักจับการสลับแท็บเบราว์เซอร์ (Visibility API) --
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // -- ดักจับเมื่อมีการบันทึกเลขไมล์ (logbooks) หรือบิลน้ำมัน (fuel_expenses) ใหม่ๆ เข้ามาแบบ Real-time --
    const channel = supabase
      .channel('public:reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logbooks' }, () => {
         fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_expenses' }, () => {
         fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
         fetchData(); // เผื่อมีการแก้ไขทะเบียนรถ
      })
      .subscribe();

    // Cleanup ระบบเมื่อออกจากหน้านี้
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [fetchData])

  /* ===================== FILTER ===================== */

  const filteredLogs = useMemo(() => {
    return logEntries.filter((log) => {
      const date = getLogDate(log)
      if (!date) return false
      const d = date.slice(0, 10)
      const matchVehicle =
        selectedVehicle === "all" || String(log.vehicle_id) === String(selectedVehicle)
      return d >= startDate && d <= endDate && matchVehicle
    })
  }, [logEntries, startDate, endDate, selectedVehicle])

  /* ===================== SUMMARY ===================== */

  const totalDistance   = filteredLogs.reduce((s, l) => s + getDistance(l),   0)
  const totalFuelCost   = filteredLogs.reduce((s, l) => s + getFuelCost(l),   0)
  const totalFuelLiters = filteredLogs.reduce((s, l) => s + getFuelLiters(l), 0)

  /* ===================== CHART ===================== */

  const fuelChart = useMemo(() => {
    const grouped = {}
    filteredLogs.forEach((log) => {
      const d = getLogDate(log)
      if (!d) return
      const key = d.slice(0, 7)
      if (!grouped[key]) grouped[key] = { month: getMonthLabel(d), cost: 0 }
      grouped[key].cost += getFuelCost(log)
    })
    return Object.values(grouped)
  }, [filteredLogs])

  /* ===================== EXPORT — PDF (html2canvas) ===================== */

  async function exportPDF() {
    if (filteredLogs.length === 0) {
      Swal.fire({ icon: "warning", title: "ไม่มีข้อมูล", text: "ไม่พบข้อมูลในช่วงเวลาที่เลือก", confirmButtonColor: "#0f172a" })
      return
    }

    setExporting(true)
    try {
      // dynamic import เพื่อลด bundle size
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ])

      const element = pdfContentRef.current
      if (!element) return

      // แสดง hidden element ชั่วคราว
      element.style.display = "block"
      await new Promise((r) => setTimeout(r, 100)) // รอ render

      // ── แก้ปัญหา Tailwind v4 ใช้ CSS color function "lab()" ──────────────
      // html2canvas ไม่รองรับ lab() จึงต้อง override CSS variables ด้วยค่า hex
      // ก่อน capture แล้วลบออกหลังเสร็จ
      const styleOverride = document.createElement("style")
      styleOverride.id = "html2canvas-color-fix"
      styleOverride.textContent = `
        #pdf-export-root, #pdf-export-root * {
          --tw-prose-body: #1e293b !important;
          color-scheme: light !important;
        }
        /* force ทุก element ใน PDF template ใช้สีที่ html2canvas รองรับ */
        #pdf-export-root { color: #1e293b !important; background-color: #ffffff !important; }
      `
      document.head.appendChild(styleOverride)

      // กำหนด id ให้ root element ชั่วคราว
      element.id = "pdf-export-root"

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          // ลบ stylesheet ที่มี lab() color ออกจาก cloned document
          // เพื่อป้องกัน html2canvas parse สีที่ไม่รองรับ
          const sheets = Array.from(clonedDoc.styleSheets)
          sheets.forEach((sheet) => {
            try {
              const rules = Array.from(sheet.cssRules || [])
              rules.forEach((rule) => {
                if (rule.cssText && rule.cssText.includes("lab(")) {
                  try { sheet.deleteRule(Array.from(sheet.cssRules).indexOf(rule)) } catch (_) {}
                }
              })
            } catch (_) {
              // cross-origin stylesheet — ข้ามได้
            }
          })

          // inject fallback colors ที่รองรับ html2canvas ใน cloned doc
          const fallback = clonedDoc.createElement("style")
          fallback.textContent = `
            * {
              --color-background-primary: #ffffff;
              --color-background-secondary: #f8fafc;
              --color-text-primary: #0f172a;
              --color-text-secondary: #475569;
              --color-border-tertiary: #e2e8f0;
              color-scheme: light;
            }
          `
          clonedDoc.head.appendChild(fallback)
        },
      })

      // cleanup
      element.removeAttribute("id")
      document.head.removeChild(styleOverride)

      element.style.display = "none"

      const imgData  = canvas.toDataURL("image/png")
      const doc      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageW    = doc.internal.pageSize.getWidth()
      const pageH    = doc.internal.pageSize.getHeight()
      const margin   = 10
      const imgW     = pageW - margin * 2
      const imgH     = (canvas.height * imgW) / canvas.width

      // ถ้าเนื้อหายาวกว่า 1 หน้า ให้ตัดแบ่งหน้า
      let heightLeft = imgH
      let position   = margin

      doc.addImage(imgData, "PNG", margin, position, imgW, imgH)
      heightLeft -= pageH - margin * 2

      while (heightLeft > 0) {
        position = heightLeft - imgH + margin
        doc.addPage()
        doc.addImage(imgData, "PNG", margin, position, imgW, imgH)
        heightLeft -= pageH - margin * 2
      }

      doc.save(`Vehicle_Report_${startDate}_to_${endDate}.pdf`)
    } catch (err) {
      console.error("PDF export error:", err)
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่", confirmButtonColor: "#0f172a" })
    } finally {
      setExporting(false)
    }
  }

  /* ===================== EXPORT — EXCEL ===================== */

  function exportExcel() {
    if (filteredLogs.length === 0) {
      Swal.fire({ icon: "warning", title: "ไม่มีข้อมูล", text: "ไม่พบข้อมูลในช่วงเวลาที่เลือก", confirmButtonColor: "#0f172a" })
      return
    }

    const vLabel =
      selectedVehicle === "all"
        ? "รถทุกคันในระบบ"
        : `ทะเบียนรถ: ${getVehiclePlate(vehicles.find((v) => String(v.id) === selectedVehicle))}`

    const wsData = [
      ["สรุปรายงานการใช้ยานพาหนะส่วนกลาง"],
      [`ข้อมูลตั้งแต่วันที่ ${formatDateThai(startDate)} ถึง ${formatDateThai(endDate)}`],
      [vLabel],
      [""],
      ["สรุปภาพรวม", "", "", ""],
      ["ระยะทางรวม (กม.)",   formatNumber(totalDistance),  "ปริมาณน้ำมัน (ลิตร)", formatNumber(totalFuelLiters)],
      ["ค่าน้ำมันรวม (บาท)", formatNumber(totalFuelCost),  "จำนวนเที่ยวรถ",        formatNumber(filteredLogs.length)],
      [""],
      ["วันที่", "ทะเบียนรถ", "เลขไมล์เริ่มต้น", "เลขไมล์สิ้นสุด", "ระยะทาง (กม.)", "ปริมาณน้ำมัน (ลิตร)", "ค่าน้ำมัน (บาท)"],
      ...filteredLogs.map((l) => {
        const v = vehicles.find((x) => String(x.id) === String(l.vehicle_id))
        return [
          formatDateThai(getLogDate(l)),
          getVehiclePlate(v),
          l.start_mileage || 0,
          l.end_mileage   || 0,
          getDistance(l),
          getFuelLiters(l),
          getFuelCost(l),
        ]
      }),
      ["รวมทั้งหมด", "", "", "", totalDistance, totalFuelLiters, totalFuelCost],
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws["!cols"] = [
      { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
      { wch: 16 }, { wch: 20 }, { wch: 18 },
    ]
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "รายงานการใช้รถ")
    XLSX.writeFile(wb, `Vehicle_Report_${startDate}_to_${endDate}.xlsx`)
  }

  /* ===================== PRINT ===================== */

  function handlePrintWebPage() { window.print() }

  /* ===================== UI ===================== */

  const vehicleLabel =
    selectedVehicle === "all"
      ? "รถทุกคันในระบบ"
      : getVehiclePlate(vehicles.find((v) => String(v.id) === selectedVehicle))

  return (
    <div className="min-h-screen font-sarabun text-black relative bg-slate-900 print:bg-white print:text-black">
      <Image src="/images/image.png" alt="Background" fill priority className="object-cover z-0 opacity-40 print:hidden" />
      <div className="absolute inset-0 bg-black/60 z-0 print:hidden" />

      <div className="relative z-10 border-b border-white/10 print:hidden">
        <PageHeader title="รายงานและสถิติ" />
      </div>

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 relative z-10 print:p-0 print:space-y-4">

        {/* ── Print header ── */}
        <div className="hidden print:block text-center border-b border-slate-300 pb-4 mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">สรุปรายงานการใช้ยานพาหนะส่วนกลาง</h1>
          <p className="text-sm text-slate-600 mt-1">
            ข้อมูลตั้งแต่วันที่ {formatDateThai(startDate)} ถึง {formatDateThai(endDate)}
          </p>
          {selectedVehicle !== "all" && (
            <p className="text-sm font-bold mt-1 text-blue-600">ทะเบียนรถ: {vehicleLabel}</p>
          )}
        </div>

        {/* ── Page heading ── */}
        <div className="flex items-center gap-3 print:hidden">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">รายงานและสถิติ</h1>
          <Button
            variant="outline" size="icon"
            onClick={fetchData} disabled={loading}
            className="h-8 w-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/95 backdrop-blur-sm p-6 rounded-[2rem] shadow-sm border border-slate-200 print:hidden">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">ตั้งแต่วันที่</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10 h-11 rounded-xl bg-white text-black" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">ถึงวันที่</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10 h-11 rounded-xl bg-white text-black" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">เลือกรถ</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="h-11 rounded-xl font-bold text-slate-700 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-sarabun text-black bg-white border-slate-200">
                  <SelectItem value="all">รถทุกคันในระบบ</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {getVehiclePlate(v)} {v.brand ? `(${v.brand})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pt-4 md:pt-0">
            <Button onClick={handlePrintWebPage} variant="outline" className="flex-1 md:flex-none border-blue-200 text-blue-600 hover:bg-blue-50 h-11 rounded-xl font-bold shadow-sm">
              <Printer className="mr-2 size-4" /> พิมพ์ (Print)
            </Button>
            <Button onClick={exportPDF} disabled={exporting} variant="outline" className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 h-11 rounded-xl font-bold shadow-sm">
              {exporting
                ? <><Loader2 className="mr-2 size-4 animate-spin" /> กำลังสร้าง PDF...</>
                : <><FileText className="mr-2 size-4" /> ออก PDF</>
              }
            </Button>
            <Button onClick={exportExcel} variant="outline" className="flex-1 md:flex-none border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-11 rounded-xl font-bold shadow-sm">
              <FileSpreadsheet className="mr-2 size-4" /> ออก Excel
            </Button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 print:grid-cols-4 print:gap-2">
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-400 to-blue-600 text-white overflow-hidden relative rounded-[2rem] print:bg-none print:shadow-none print:border print:border-slate-300 print:text-black print:rounded-xl">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20 print:hidden"><Route className="size-32" /></div>
            <CardContent className="p-8 relative z-10 print:p-4">
              <p className="text-blue-100 font-bold text-xs uppercase tracking-wider mb-2 print:text-slate-500">ระยะทางรวม</p>
              <h3 className="text-4xl font-extrabold tracking-tight print:text-2xl print:text-black">
                {formatNumber(totalDistance)} <span className="text-lg font-medium opacity-90 print:text-sm">กม.</span>
              </h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-orange-400 to-orange-600 text-white overflow-hidden relative rounded-[2rem] print:bg-none print:shadow-none print:border print:border-slate-300 print:text-black print:rounded-xl">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20 print:hidden"><Fuel className="size-32" /></div>
            <CardContent className="p-8 relative z-10 print:p-4">
              <p className="text-orange-100 font-bold text-xs uppercase tracking-wider mb-2 print:text-slate-500">ค่าน้ำมันรวม</p>
              <h3 className="text-4xl font-extrabold tracking-tight print:text-2xl print:text-black">
                {formatNumber(totalFuelCost)} <span className="text-lg font-medium opacity-90 print:text-sm">บาท</span>
              </h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-emerald-400 to-emerald-600 text-white overflow-hidden relative rounded-[2rem] print:bg-none print:shadow-none print:border print:border-slate-300 print:text-black print:rounded-xl">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20 print:hidden"><Droplet className="size-32" /></div>
            <CardContent className="p-8 relative z-10 print:p-4">
              <p className="text-emerald-100 font-bold text-xs uppercase tracking-wider mb-2 print:text-slate-500">ปริมาณน้ำมัน</p>
              <h3 className="text-4xl font-extrabold tracking-tight print:text-2xl print:text-black">
                {formatNumber(totalFuelLiters)} <span className="text-lg font-medium opacity-90 print:text-sm">ลิตร</span>
              </h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-indigo-400 to-indigo-600 text-white overflow-hidden relative rounded-[2rem] print:bg-none print:shadow-none print:border print:border-slate-300 print:text-black print:rounded-xl">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20 print:hidden"><Car className="size-32" /></div>
            <CardContent className="p-8 relative z-10 print:p-4">
              <p className="text-indigo-100 font-bold text-xs uppercase tracking-wider mb-2 print:text-slate-500">จำนวนเที่ยวรถ</p>
              <h3 className="text-4xl font-extrabold tracking-tight print:text-2xl print:text-black">
                {formatNumber(filteredLogs.length)} <span className="text-lg font-medium opacity-90 print:text-sm">เที่ยว</span>
              </h3>
            </CardContent>
          </Card>
        </div>

        {/* ── Chart ── */}
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white/95 backdrop-blur-sm print:shadow-none print:border-none print:rounded-none">
          <CardHeader className="border-b border-slate-100 bg-white/80 p-6 print:p-0 print:border-none print:mt-4">
            <CardTitle className="text-xl font-extrabold text-slate-800">สถิติค่าน้ำมันรายเดือน</CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500 print:hidden">กราฟแสดงแนวโน้มค่าใช้จ่ายน้ำมันตามช่วงเวลาที่เลือก</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white/95 print:p-0 print:mt-2">
            {loading ? (
              <div className="h-[350px] flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="size-10 animate-spin text-blue-500 mb-4" />
                <p className="font-bold">กำลังประมวลผลข้อมูล...</p>
              </div>
            ) : fuelChart.length > 0 ? (
              <div className="h-[350px] w-full print:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelChart} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} tickFormatter={(v) => `${formatNumber(v)} ฿`} dx={-10} />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
                      formatter={(v) => [`${formatNumber(v)} บาท`, "ค่าน้ำมัน"]}
                    />
                    <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {fuelChart.map((_, i) => <Cell key={i} fill="#3b82f6" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-slate-400">
                <div className="p-6 rounded-full bg-slate-50 mb-4"><Search className="size-10 opacity-30" /></div>
                <p className="font-bold">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Table ── */}
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white/95 backdrop-blur-sm print:shadow-none print:border-none print:rounded-none">
          <CardHeader className="border-b border-slate-100 bg-white/80 p-6 print:p-0 print:border-none print:mt-6">
            <CardTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Milestone className="size-6 text-emerald-500 print:hidden" /> รายละเอียดการเดินทาง (สมุดบันทึกการใช้รถ)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-white/95 print:mt-2">
            <div className="overflow-x-auto">
              <Table className="print:border-collapse print:border print:border-slate-800">
                <TableHeader className="bg-slate-50/50 print:bg-slate-100">
                  <TableRow className="border-b border-slate-100 print:border-slate-800">
                    <TableHead className="pl-6 py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest print:text-black print:border-r print:border-slate-800 print:p-2">วันที่</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-center print:text-black print:border-r print:border-slate-800 print:p-2">ทะเบียนรถ</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-center print:text-black print:border-r print:border-slate-800 print:p-2">เลขไมล์เริ่ม</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-center print:text-black print:border-r print:border-slate-800 print:p-2">เลขไมล์สิ้นสุด</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right print:text-black print:border-r print:border-slate-800 print:p-2">ระยะทาง (กม.)</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right print:text-black print:border-r print:border-slate-800 print:p-2">น้ำมัน (ลิตร)</TableHead>
                    <TableHead className="pr-6 py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right print:text-black print:p-2">ค่าใช้จ่าย (บาท)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-slate-500">
                        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="font-medium">กำลังโหลดข้อมูล...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-slate-400">ไม่พบข้อมูลการเดินทาง</TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const v = vehicles.find((x) => String(x.id) === String(log.vehicle_id))
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 print:border-slate-800">
                          <TableCell className="pl-6 font-bold text-slate-800 text-sm py-4 print:p-2 print:border-r print:border-slate-800 print:text-xs">{formatDateThai(getLogDate(log))}</TableCell>
                          <TableCell className="text-center print:p-2 print:border-r print:border-slate-800">
                            <Badge variant="outline" className="font-bold bg-slate-50 text-slate-700 border-slate-200 px-3 py-1 print:border-none print:p-0">{getVehiclePlate(v)}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-500 text-xs print:p-2 print:border-r print:border-slate-800 print:text-black">{formatNumber(log.start_mileage || 0)}</TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-500 text-xs print:p-2 print:border-r print:border-slate-800 print:text-black">{formatNumber(log.end_mileage   || 0)}</TableCell>
                          <TableCell className="text-right font-bold text-slate-700 text-sm print:p-2 print:border-r print:border-slate-800">{formatNumber(getDistance(log))}</TableCell>
                          <TableCell className="text-right font-bold text-slate-700 text-sm print:p-2 print:border-r print:border-slate-800">{formatNumber(getFuelLiters(log))}</TableCell>
                          <TableCell className="pr-6 text-right font-bold text-orange-600 text-sm print:p-2 print:text-black">{formatNumber(getFuelCost(log))}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ══════════════════════════════════════════════════════
          HIDDEN PDF TEMPLATE — สไตล์เอกสารราชการไทย
      ══════════════════════════════════════════════════════ */}
      <div ref={pdfContentRef} style={{ display: "none" }}>
        <div style={{
          fontFamily: "'Sarabun', 'TH Sarabun New', 'Noto Sans Thai', sans-serif",
          width: "1050px",         /* ≈ A4 portrait 210mm @ 125dpi */
          backgroundColor: "#ffffff",
          color: "#000000",
          padding: "60px 72px",   /* margin ราชการ ~2.5cm */
          boxSizing: "border-box",
          lineHeight: 1.7,
        }}>

          {/* ── ส่วนหัว: ชื่อหน่วยงาน ── */}
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#000000" }}>
              รายงานสรุปการใช้ยานพาหนะส่วนกลาง
            </div>
            <div style={{ fontSize: "15px", color: "#000000", marginTop: "2px" }}>
              ประจำช่วง {formatDateThai(startDate)} ถึง {formatDateThai(endDate)}
            </div>
            {selectedVehicle !== "all" && (
              <div style={{ fontSize: "14px", color: "#000000" }}>
                ยานพาหนะ: {vehicleLabel}
              </div>
            )}
          </div>

          {/* เส้นคั่นหัว */}
          <div style={{ borderTop: "2px solid #000000", borderBottom: "1px solid #000000", margin: "10px 0 0", height: "4px" }} />

          {/* ── ข้อมูลเอกสาร (มุมขวาบน style ราชการ) ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", color: "#000000", textAlign: "right", lineHeight: 1.8 }}>
              <div>วันที่พิมพ์ : {formatDateThai(todayStr)}</div>
              <div>จำนวนเที่ยวรถ : {formatNumber(filteredLogs.length)} เที่ยว</div>
            </div>
          </div>

          {/* ── ตารางสรุปภาพรวม ── */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              fontSize: "14px", fontWeight: "700", color: "#000000",
              borderLeft: "4px solid #000000", paddingLeft: "10px",
              marginBottom: "10px",
            }}>
              ๑. สรุปภาพรวม
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <tbody>
                <tr>
                  {[
                    { label: "ระยะทางรวมทั้งหมด",    value: formatNumber(totalDistance),         unit: "กิโลเมตร" },
                    { label: "ปริมาณน้ำมันที่ใช้",   value: formatNumber(totalFuelLiters),       unit: "ลิตร"     },
                    { label: "ค่าใช้จ่ายน้ำมันรวม",  value: formatNumber(totalFuelCost),         unit: "บาท"      },
                    { label: "จำนวนเที่ยวการเดินทาง", value: formatNumber(filteredLogs.length),  unit: "เที่ยว"   },
                  ].map((item, i) => (
                    <td key={i} style={{
                      border: "1px solid #000000",
                      padding: "10px 14px",
                      width: "25%",
                      verticalAlign: "middle",
                    }}>
                      <div style={{ fontSize: "12px", color: "#444444", marginBottom: "4px" }}>{item.label}</div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: "#000000" }}>
                        {item.value}
                        <span style={{ fontSize: "13px", fontWeight: "400", marginLeft: "4px" }}>{item.unit}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── ตารางรายละเอียด ── */}
          <div>
            <div style={{
              fontSize: "14px", fontWeight: "700", color: "#000000",
              borderLeft: "4px solid #000000", paddingLeft: "10px",
              marginBottom: "10px",
            }}>
              ๒. รายละเอียดการเดินทาง
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                {/* แถวหัวตาราง */}
                <tr style={{ backgroundColor: "#1a1a1a" }}>
                  {[
                    { label: "ลำดับ",           align: "center", w: "5%"  },
                    { label: "วันที่",           align: "center", w: "13%" },
                    { label: "ทะเบียนรถ",       align: "center", w: "12%" },
                    { label: "เลขไมล์เริ่มต้น", align: "right",  w: "12%" },
                    { label: "เลขไมล์สิ้นสุด",  align: "right",  w: "12%" },
                    { label: "ระยะทาง\n(กม.)",  align: "right",  w: "12%" },
                    { label: "น้ำมัน\n(ลิตร)",  align: "right",  w: "12%" },
                    { label: "ค่าน้ำมัน\n(บาท)", align: "right", w: "12%" },
                    { label: "หมายเหตุ",         align: "center", w: "10%" },
                  ].map((col, i) => (
                    <th key={i} style={{
                      border: "1px solid #555555",
                      padding: "9px 8px",
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "12px",
                      textAlign: col.align,
                      width: col.w,
                      whiteSpace: "pre-line",
                      lineHeight: 1.4,
                    }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const v = vehicles.find((x) => String(x.id) === String(log.vehicle_id))
                  const isEven = idx % 2 === 0
                  const tdBase = {
                    border: "1px solid #bbbbbb",
                    padding: "8px",
                    color: "#000000",
                    backgroundColor: isEven ? "#ffffff" : "#f5f5f5",
                    fontSize: "13px",
                  }
                  return (
                    <tr key={log.id}>
                      <td style={{ ...tdBase, textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ ...tdBase, textAlign: "center" }}>{formatDateThai(getLogDate(log))}</td>
                      <td style={{ ...tdBase, textAlign: "center", fontWeight: "700" }}>{getVehiclePlate(v)}</td>
                      <td style={{ ...tdBase, textAlign: "right" }}>{formatNumber(log.start_mileage || 0)}</td>
                      <td style={{ ...tdBase, textAlign: "right" }}>{formatNumber(log.end_mileage   || 0)}</td>
                      <td style={{ ...tdBase, textAlign: "right", fontWeight: "700" }}>{formatNumber(getDistance(log))}</td>
                      <td style={{ ...tdBase, textAlign: "right" }}>{formatNumber(getFuelLiters(log))}</td>
                      <td style={{ ...tdBase, textAlign: "right", fontWeight: "700" }}>{formatNumber(getFuelCost(log))}</td>
                      <td style={{ ...tdBase, textAlign: "center" }}></td>
                    </tr>
                  )
                })}

                {/* แถวรวม */}
                <tr style={{ backgroundColor: "#e8e8e8" }}>
                  <td colSpan={5} style={{ border: "1px solid #888888", padding: "9px 8px", textAlign: "center", fontWeight: "700", fontSize: "13px", color: "#000000" }}>
                    รวมทั้งหมด
                  </td>
                  <td style={{ border: "1px solid #888888", padding: "9px 8px", textAlign: "right", fontWeight: "700", fontSize: "14px", color: "#000000" }}>
                    {formatNumber(totalDistance)}
                  </td>
                  <td style={{ border: "1px solid #888888", padding: "9px 8px", textAlign: "right", fontWeight: "700", fontSize: "14px", color: "#000000" }}>
                    {formatNumber(totalFuelLiters)}
                  </td>
                  <td style={{ border: "1px solid #888888", padding: "9px 8px", textAlign: "right", fontWeight: "700", fontSize: "14px", color: "#000000" }}>
                    {formatNumber(totalFuelCost)}
                  </td>
                  <td style={{ border: "1px solid #888888" }} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── ส่วนลงนาม ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "48px", gap: "0" }}>
            <div style={{ width: "280px", textAlign: "center", fontSize: "14px", color: "#000000" }}>
              <div style={{ marginBottom: "48px" }}>ผู้จัดทำรายงาน</div>
              <div style={{ borderTop: "1px solid #000000", paddingTop: "6px" }}>
                <div>( ........................................... )</div>
                <div style={{ marginTop: "4px" }}>ตำแหน่ง .....................................</div>
                <div style={{ marginTop: "4px" }}>วันที่ {formatDateThai(todayStr)}</div>
              </div>
            </div>
          </div>

          {/* ── เส้นคั่นท้าย + หมายเหตุ ── */}
          <div style={{ borderTop: "1px solid #888888", marginTop: "32px", paddingTop: "8px" }}>
            <div style={{ fontSize: "11px", color: "#555555" }}>
              * เอกสารนี้ออกโดยระบบบริหารจัดการยานพาหนะส่วนกลาง &nbsp;|&nbsp; พิมพ์เมื่อ {formatDateThai(todayStr)} &nbsp;|&nbsp; ข้อมูลตั้งแต่ {formatDateThai(startDate)} – {formatDateThai(endDate)}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}