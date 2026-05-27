"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image" 
import { cn } from "@/lib/utils" 
import { 
  FileText, FileSpreadsheet, Fuel, Route, 
  Car, Calendar, Search, Droplet, Milestone, 
  Loader2, Info, RefreshCw, Printer
} from "lucide-react"
import { 
  Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell
} from "recharts"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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

function getVehiclePlate(vehicle) {
  return vehicle?.license_plate || "-"
}

function getLogDate(log) {
  return log?.log_date || log?.created_at || ""
}

function getDistance(log) {
  return Number(log?.distance || 0)
}

function getFuelLiters(log) {
  return Number(log?.fuel_liter || 0)
}

function getFuelCost(log) {
  return Number(log?.fuel_cost || 0)
}

function getMonthLabel(dateString) {
  const date = new Date(dateString)
  if (isNaN(date)) return "-"
  return date.toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
  })
}

function formatDateThai(dateString) {
  if (!dateString) return "-"
  const date = new Date(dateString)
  if (isNaN(date)) return dateString
  return date.toLocaleDateString("th-TH", {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatNumber = (num) => Number(num).toLocaleString('th-TH', { maximumFractionDigits: 2 });

/* ===================== COMPONENT ===================== */

export default function ReportsPage() {
  const [vehicles, setVehicles] = useState([])
  const [logEntries, setLogEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const firstDay = `${today.getFullYear()}-01-01`
  const todayStr = today.toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(todayStr)
  const [selectedVehicle, setSelectedVehicle] = useState("all")

  /* ===================== FETCH ===================== */

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(false)
    try {
      // ✅ เพิ่มการดึงข้อมูลจากตาราง fuel_expenses มาประมวลผลร่วมกัน
      const [vRes, lRes, fRes] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("logbooks").select("*").order("log_date", { ascending: true }),
        supabase.from("fuel_expenses").select("*") 
      ]);

      const logbooksData = lRes.data || []
      const fuelExpensesData = fRes.data || []

      // ✅ Map ข้อมูลเพื่อรวมยอดน้ำมัน (ลิตร และ บาท) จากตาราง fuel_expenses ที่เกิดขึ้นในวันนั้นๆ
      const mappedLogs = logbooksData.map((log) => {
        const matchingFuels = fuelExpensesData.filter(
          (f) => String(f.booking_id) === String(log.booking_id) && f.log_date === log.log_date
        )

        // รวมยอดลิตรและค่าน้ำมัน (รองรับกรณีเติมมากกว่า 1 ครั้งต่อวัน)
        const dayFuelLiter = matchingFuels.reduce((sum, f) => sum + Number(f.fuel_liter || 0), 0)
        const dayFuelCost = matchingFuels.reduce((sum, f) => sum + Number(f.fuel_cost || 0), 0)

        return {
          ...log,
          fuel_liter: dayFuelLiter, // ฝังค่ากลับเข้าไปใน Object ของ logbook เดิม
          fuel_cost: dayFuelCost
        }
      })

      setVehicles(vRes.data || [])
      setLogEntries(mappedLogs) // เซ็ตข้อมูลเวอร์ชันอัปเดตลง State หลัก
    } catch (error) {
      console.error("Error loading reports data:", error)
    } finally {
      setLoading(false)
    }
  }

  /* ===================== FILTER ===================== */

  const filteredLogs = useMemo(() => {
    return logEntries.filter((log) => {
      const date = getLogDate(log)
      if (!date) return false

      const d = date.slice(0, 10)

      const matchVehicle =
        selectedVehicle === "all" ||
        String(log.vehicle_id) === String(selectedVehicle)

      return d >= startDate && d <= endDate && matchVehicle
    })
  }, [logEntries, startDate, endDate, selectedVehicle])

  /* ===================== SUMMARY ===================== */

  const totalDistance = filteredLogs.reduce((s, l) => s + getDistance(l), 0)
  const totalFuelCost = filteredLogs.reduce((s, l) => s + getFuelCost(l), 0)
  const totalFuelLiters = filteredLogs.reduce((s, l) => s + getFuelLiters(l), 0)

  /* ===================== CHART ===================== */

  const fuelChart = useMemo(() => {
    const grouped = {}

    filteredLogs.forEach((log) => {
      const d = getLogDate(log)
      if (!d) return

      const key = d.slice(0, 7)

      if (!grouped[key]) {
        grouped[key] = {
          month: getMonthLabel(d),
          cost: 0,
        }
      }

      grouped[key].cost += getFuelCost(log)
    })

    return Object.values(grouped)
  }, [filteredLogs])

  /* ===================== EXPORT ===================== */

  function exportExcel() {
    if (filteredLogs.length === 0) {
      Swal.fire({ icon: 'warning', title: 'ไม่มีข้อมูล', text: 'ไม่พบข้อมูลในช่วงเวลาที่เลือก', confirmButtonColor: '#0f172a' });
      return;
    }

    const exportData = filteredLogs.map(l => {
      const v = vehicles.find((x) => String(x.id) === String(l.vehicle_id))
      return {
        "วันที่": formatDateThai(getLogDate(l)),
        "ทะเบียนรถ": getVehiclePlate(v),
        "เลขไมล์เริ่มต้น": l.start_mileage || 0,
        "เลขไมล์สิ้นสุด": l.end_mileage || 0,
        "ระยะทาง (กม.)": getDistance(l),
        "ปริมาณน้ำมัน (ลิตร)": getFuelLiters(l),
        "ค่าน้ำมัน (บาท)": getFuelCost(l),
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
    const wb = XLSX.utils.book_new()
    Xxlsx.utils.book_append_sheet(wb, ws, "รายงานการใช้รถ")
    XXLSX.writeFile(wb, `Vehicle_Report_${startDate}_to_${endDate}.xlsx`)
  }

  function exportPDF() {
    if (filteredLogs.length === 0) {
      Swal.fire({ icon: 'warning', title: 'ไม่มีข้อมูล', text: 'ไม่พบข้อมูลในช่วงเวลาที่เลือก', confirmButtonColor: '#0f172a' });
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); 
    doc.text("Vehicle Usage Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);
    doc.text(`Total Distance: ${formatNumber(totalDistance)} km | Total Cost: ${formatNumber(totalFuelCost)} THB`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [["Date", "License Plate", "Start Mil.", "End Mil.", "Distance", "Fuel (L)", "Cost (THB)"]],
      body: filteredLogs.map((l) => {
        const v = vehicles.find((x) => String(x.id) === String(l.vehicle_id))
        return [
          getLogDate(l).slice(0,10), getVehiclePlate(v), formatNumber(l.start_mileage || 0),
          formatNumber(l.end_mileage || 0), formatNumber(getDistance(l)), formatNumber(getFuelLiters(l)), formatNumber(getFuelCost(l))
        ]
      }),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 9, cellPadding: 4, textColor: [51, 65, 85] },
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] } }
    });

    doc.save(`Vehicle_Report_${startDate}_to_${endDate}.pdf`)
  }

  function handlePrintWebPage() {
    window.print();
  }

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen font-sarabun text-black relative bg-slate-900 print:bg-white print:text-black">
      <Image 
        src="/images/image.png" 
        alt="Background" 
        fill 
        priority 
        className="object-cover z-0 opacity-40 print:hidden" 
      />
      <div className="absolute inset-0 bg-black/60 z-0 print:hidden"></div>

      <div className="relative z-10 border-b border-white/10 print:hidden">
        <PageHeader title="รายงานและสถิติ" />
      </div>

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 relative z-10 print:p-0 print:space-y-4">
        
        <div className="hidden print:block text-center border-b border-slate-300 pb-4 mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">สรุปรายงานการใช้ยานพาหนะส่วนกลาง</h1>
          <p className="text-sm text-slate-600 mt-1">ข้อมูลตั้งแต่วันที่ {formatDateThai(startDate)} ถึง {formatDateThai(endDate)}</p>
          {selectedVehicle !== "all" && <p className="text-sm font-bold mt-1 text-blue-600">กรองเฉพาะรถรหัส: {selectedVehicle}</p>}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">รายงานและสถิติ</h1>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchData} 
                disabled={loading}
                className="h-8 w-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
            </div>
            <p className="text-white/90 text-sm mt-1 font-medium drop-shadow-sm">สรุปข้อมูลการใช้รถ ค่าใช้จ่าย และสถิติต่างๆ ในระบบ</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/95 backdrop-blur-sm p-6 rounded-[2rem] shadow-sm border border-slate-200 print:hidden">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">ตั้งแต่พ.ศ.</Label>
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
                      {getVehiclePlate(v)} {v.brand ? `(${v.brand})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pt-4 md:pt-0">
            <Button onClick={handlePrintWebPage} variant="outline" className="flex-1 md:flex-none border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-11 rounded-xl font-bold shadow-sm">
              <Printer className="mr-2 size-4" /> พิมพ์ (Print)
            </Button>
            <Button onClick={exportPDF} variant="outline" className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 rounded-xl font-bold shadow-sm">
              <FileText className="mr-2 size-4" /> ออก PDF
            </Button>
            <Button onClick={exportExcel} variant="outline" className="flex-1 md:flex-none border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 h-11 rounded-xl font-bold shadow-sm">
              <FileSpreadsheet className="mr-2 size-4" /> ออก Excel
            </Button>
          </div>
        </div>

        {/* SUMMARY KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 print:grid-cols-4 print:gap-2">
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-400 to-blue-600 text-white overflow-hidden relative rounded-[2rem] print:bg-none print:shadow-none print:border print:border-slate-300 print:text-black print:rounded-xl">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20 print:hidden"><Route className="size-32" /></div>
            <CardContent className="p-8 relative z-10 print:p-4">
              <p className="text-blue-100 font-bold text-xs uppercase tracking-wider mb-2 print:text-slate-500">ระยะทางรวม</p>
              <h3 className="text-4xl font-extrabold tracking-tight print:text-2xl print:text-black">{formatNumber(totalDistance)} <span className="text-lg font-medium opacity-90 print:text-sm">กม.</span></h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-orange-400 to-orange-600 text-white overflow-hidden relative rounded-[2rem] print:bg-none print:shadow-none print:border print:border-slate-300 print:text-black print:rounded-xl">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20 print:hidden"><Fuel className="size-32" /></div>
            <CardContent className="p-8 relative z-10 print:p-4">
              <p className="text-orange-100 font-bold text-xs uppercase tracking-wider mb-2 print:text-slate-500">ค่าน้ำมันรวม</p>
              <h3 className="text-4xl font-extrabold tracking-tight print:text-2xl print:text-black">{formatNumber(totalFuelCost)} <span className="text-lg font-medium opacity-90 print:text-sm">บาท</span></h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-emerald-400 to-emerald-600 text-white overflow-hidden relative rounded-[2rem] print:bg-none print:shadow-none print:border print:border-slate-300 print:text-black print:rounded-xl">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20 print:hidden"><Droplet className="size-32" /></div>
            <CardContent className="p-8 relative z-10 print:p-4">
              <p className="text-emerald-100 font-bold text-xs uppercase tracking-wider mb-2 print:text-slate-500">ปริมาณน้ำมัน</p>
              <h3 className="text-4xl font-extrabold tracking-tight print:text-2xl print:text-black">{formatNumber(totalFuelLiters)} <span className="text-lg font-medium opacity-90 print:text-sm">ลิตร</span></h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-indigo-400 to-indigo-600 text-white overflow-hidden relative rounded-[2rem] print:bg-none print:shadow-none print:border print:border-slate-300 print:text-black print:rounded-xl">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20 print:hidden"><Car className="size-32" /></div>
            <CardContent className="p-8 relative z-10 print:p-4">
              <p className="text-indigo-100 font-bold text-xs uppercase tracking-wider mb-2 print:text-slate-500">จำนวนเที่ยวรถ</p>
              <h3 className="text-4xl font-extrabold tracking-tight print:text-2xl print:text-black">{formatNumber(filteredLogs.length)} <span className="text-lg font-medium opacity-90 print:text-sm">เที่ยว</span></h3>
            </CardContent>
          </Card>
        </div>

        {/* CHART SECTION */}
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
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                      tickFormatter={(value) => `${formatNumber(value)} ฿`}
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      formatter={(value) => [`${formatNumber(value)} บาท`, 'ค่าน้ำมัน']}
                    />
                    <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {fuelChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#3b82f6" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-slate-400">
                <div className="p-6 rounded-full bg-slate-50 mb-4">
                  <Search className="size-10 opacity-30" />
                </div>
                <p className="font-bold">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TABLE SECTION */}
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
                      <TableCell colSpan={7} className="text-center py-16 text-slate-500 print:hidden">
                        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="font-medium">กำลังโหลดข้อมูล...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-slate-400 print:border print:border-slate-800">
                        ไม่พบข้อมูลการเดินทาง
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const v = vehicles.find((x) => String(x.id) === String(log.vehicle_id))
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 print:border-slate-800">
                          <TableCell className="pl-6 font-bold text-slate-800 text-sm py-4 print:p-2 print:border-r print:border-slate-800 print:text-xs">
                            {formatDateThai(getLogDate(log))}
                          </TableCell>
                          <TableCell className="text-center print:p-2 print:border-r print:border-slate-800">
                            <Badge variant="outline" className="font-bold bg-slate-50 text-slate-700 border-slate-200 px-3 py-1 print:border-none print:p-0">
                              {getVehiclePlate(v)}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-center font-mono font-bold text-slate-500 text-xs print:p-2 print:border-r print:border-slate-800 print:text-black">
                            {formatNumber(log.start_mileage || 0)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-500 text-xs print:p-2 print:border-r print:border-slate-800 print:text-black">
                            {formatNumber(log.end_mileage || 0)}
                          </TableCell>

                          <TableCell className="text-right font-bold text-slate-700 text-sm print:p-2 print:border-r print:border-slate-800">
                            {formatNumber(getDistance(log))}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-700 text-sm print:p-2 print:border-r print:border-slate-800">
                            {formatNumber(getFuelLiters(log))}
                          </TableCell>
                          <TableCell className="pr-6 text-right font-bold text-orange-600 text-sm print:p-2 print:text-black">
                            {formatNumber(getFuelCost(log))}
                          </TableCell>
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
    </div>
  )
}