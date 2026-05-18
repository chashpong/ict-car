"use client"

import { useEffect, useMemo, useState } from "react"
import { 
  FileText, FileSpreadsheet, Fuel, Route, 
  Car, Calendar, Search, Droplet, Milestone, 
  Loader2, Info // ✅ เพิ่ม Loader2 และ Info เข้ามาตรงนี้ครับ
} from "lucide-react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell
} from "recharts"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
    setLoading(true)

    const { data: v } = await supabase.from("vehicles").select("*")
    const { data: l } = await supabase
      .from("logbooks")
      .select("*")
      .order("log_date", { ascending: true })

    setVehicles(v || [])
    setLogEntries(l || [])
    setLoading(false)
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
  const totalFuelLiters = filteredLogs.reduce((s, l) => s + getFuelLiters(l), 0) // ✅ เปลี่ยนมาใช้ปริมาณน้ำมันรวมแทน

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
    // ปรับ Data ให้เหมาะสมสำหรับออกรายงาน Excel
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
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "รายงานการใช้รถ")
    XLSX.writeFile(wb, "vehicle_report.xlsx")
  }

  function exportPDF() {
    const doc = new jsPDF()
    // รองรับภาษาไทยต้องมีฟอนต์ไทยใน jsPDF (ในส่วนนี้เป็นการ Export เบื้องต้น)
    autoTable(doc, {
      head: [["Date", "Plate", "Start Mil.", "End Mil.", "Distance", "Fuel(L)", "Cost(THB)"]],
      body: filteredLogs.map((l) => {
        const v = vehicles.find((x) => String(x.id) === String(l.vehicle_id))
        return [
          getLogDate(l).slice(0,10),
          getVehiclePlate(v),
          l.start_mileage || 0,
          l.end_mileage || 0,
          getDistance(l),
          getFuelLiters(l),
          getFuelCost(l),
        ]
      }),
    })

    doc.save("vehicle_report.pdf")
  }

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-slate-50/50 font-sarabun text-black bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/images/image.png')" }}>
      
      {/* Overlay โปร่งแสง */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="รายงานและสถิติ" />
      </div>

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 relative z-10">
        
        {/* HEADER & FILTER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">ตั้งแต่พ.ศ.</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10 h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">ถึงวันที่</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10 h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">เลือกรถ</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="h-11 rounded-xl font-bold text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-sarabun text-black bg-white">
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
          
          <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0">
            <Button onClick={exportPDF} variant="outline" className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 rounded-xl font-bold shadow-sm">
              <FileText className="mr-2 size-4" /> PDF
            </Button>
            <Button onClick={exportExcel} variant="outline" className="flex-1 md:flex-none border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 h-11 rounded-xl font-bold shadow-sm">
              <FileSpreadsheet className="mr-2 size-4" /> Excel
            </Button>
          </div>
        </div>

        {/* SUMMARY KPIs (ไล่เฉดสี สวยงาม) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* การ์ดระยะทางรวม (สีฟ้า) */}
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-400 to-blue-600 text-white overflow-hidden relative rounded-[2rem]">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20"><Route className="size-32" /></div>
            <CardContent className="p-8 relative z-10">
              <p className="text-blue-100 font-bold text-xs uppercase tracking-wider mb-2">ระยะทางรวม</p>
              <h3 className="text-4xl font-extrabold tracking-tight">{formatNumber(totalDistance)} <span className="text-lg font-medium opacity-90">กม.</span></h3>
            </CardContent>
          </Card>

          {/* การ์ดค่าน้ำมันรวม (สีส้ม) */}
          <Card className="border-none shadow-md bg-gradient-to-br from-orange-400 to-orange-600 text-white overflow-hidden relative rounded-[2rem]">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20"><Fuel className="size-32" /></div>
            <CardContent className="p-8 relative z-10">
              <p className="text-orange-100 font-bold text-xs uppercase tracking-wider mb-2">ค่าน้ำมันรวม</p>
              <h3 className="text-4xl font-extrabold tracking-tight">{formatNumber(totalFuelCost)} <span className="text-lg font-medium opacity-90">บาท</span></h3>
            </CardContent>
          </Card>

          {/* การ์ดปริมาณน้ำมันรวม (สีเขียว) แทนอัตราสิ้นเปลือง */}
          <Card className="border-none shadow-md bg-gradient-to-br from-emerald-400 to-emerald-600 text-white overflow-hidden relative rounded-[2rem]">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20"><Droplet className="size-32" /></div>
            <CardContent className="p-8 relative z-10">
              <p className="text-emerald-100 font-bold text-xs uppercase tracking-wider mb-2">ปริมาณน้ำมันที่เติมรวม</p>
              <h3 className="text-4xl font-extrabold tracking-tight">{formatNumber(totalFuelLiters)} <span className="text-lg font-medium opacity-90">ลิตร</span></h3>
            </CardContent>
          </Card>

          {/* การ์ดจำนวนเที่ยว (สีม่วง) */}
          <Card className="border-none shadow-md bg-gradient-to-br from-indigo-400 to-indigo-600 text-white overflow-hidden relative rounded-[2rem]">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-20"><Car className="size-32" /></div>
            <CardContent className="p-8 relative z-10">
              <p className="text-indigo-100 font-bold text-xs uppercase tracking-wider mb-2">จำนวนเที่ยวรถ</p>
              <h3 className="text-4xl font-extrabold tracking-tight">{formatNumber(filteredLogs.length)} <span className="text-lg font-medium opacity-90">เที่ยว</span></h3>
            </CardContent>
          </Card>
        </div>

        {/* CHART SECTION */}
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-white p-6">
            <CardTitle className="text-xl font-extrabold text-slate-800">สถิติค่าน้ำมันรายเดือน</CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500">กราฟแสดงแนวโน้มค่าใช้จ่ายน้ำมันตามช่วงเวลาที่เลือก</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {fuelChart.length > 0 ? (
              <div className="h-[350px] w-full">
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

        {/* TABLE SECTION (เพิ่มความละเอียด) */}
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-white p-6">
            <CardTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Milestone className="size-6 text-emerald-500" /> รายละเอียดการเดินทาง (สมุดบันทึกการใช้รถ)
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500">ข้อมูลรายละเอียดเลขไมล์และการเบิกจ่ายน้ำมัน</CardDescription>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="pl-6 py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest">วันที่</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-center">ทะเบียนรถ</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-center">เลขไมล์เริ่ม</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-center">เลขไมล์สิ้นสุด</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">ระยะทาง (กม.)</TableHead>
                    <TableHead className="py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">น้ำมัน (ลิตร)</TableHead>
                    <TableHead className="pr-6 py-5 font-bold text-slate-500 text-[11px] uppercase tracking-widest text-right">ค่าใช้จ่าย (บาท)</TableHead>
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
                      <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                        <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-3">
                          <Info className="size-6 text-slate-300" />
                        </div>
                        <p className="font-bold">ไม่พบข้อมูลการเดินทาง</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const v = vehicles.find((x) => String(x.id) === String(log.vehicle_id))
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                          <TableCell className="pl-6 font-bold text-slate-800 text-sm py-4">
                            {formatDateThai(getLogDate(log))}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-bold bg-slate-50 text-slate-700 border-slate-200 px-3 py-1">
                              {getVehiclePlate(v)}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                            {formatNumber(log.start_mileage || 0)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                            {formatNumber(log.end_mileage || 0)}
                          </TableCell>

                          <TableCell className="text-right font-bold text-slate-700 text-sm">
                            {formatNumber(getDistance(log))}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-700 text-sm">
                            {formatNumber(getFuelLiters(log))}
                          </TableCell>
                          <TableCell className="pr-6 text-right font-bold text-orange-600 text-sm">
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