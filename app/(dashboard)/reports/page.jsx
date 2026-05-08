"use client"

import { useEffect, useMemo, useState } from "react"
import { 
  FileText, FileSpreadsheet, Fuel, Route, 
  Car, TrendingUp, Calendar, Download, Search 
} from "lucide-react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
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
  const totalFuel = filteredLogs.reduce((s, l) => s + getFuelLiters(l), 0)

  const avgEfficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(2) : "0.00"

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
    const ws = XLSX.utils.json_to_sheet(filteredLogs)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "report")
    XLSX.writeFile(wb, "vehicle_report.xlsx")
  }

  function exportPDF() {
    const doc = new jsPDF()

    autoTable(doc, {
      head: [["Date", "Plate", "Distance (km)", "Fuel (L)", "Cost (THB)"]],
      body: filteredLogs.map((l) => {
        const v = vehicles.find(
          (x) => String(x.id) === String(l.vehicle_id)
        )
        return [
          formatDateThai(getLogDate(l)),
          getVehiclePlate(v),
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
    <div className="min-h-screen bg-slate-50/50 pb-10">
      <PageHeader title="รายงานและสถิติ" />

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER & FILTER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">ตั้งแต่พ.ศ.</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">ถึงวันที่</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">เลือกรถ</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
          
          <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0">
            <Button onClick={exportPDF} variant="outline" className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              <FileText className="mr-2 size-4" /> PDF
            </Button>
            <Button onClick={exportExcel} variant="outline" className="flex-1 md:flex-none border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700">
              <FileSpreadsheet className="mr-2 size-4" /> Excel
            </Button>
          </div>
        </div>

        {/* SUMMARY KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-none shadow-sm bg-blue-500 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 p-4"><Route className="size-24" /></div>
            <CardContent className="p-6 relative z-10">
              <p className="text-blue-100 font-medium text-sm mb-1">ระยะทางรวม</p>
              <h3 className="text-3xl font-bold tracking-tight">{formatNumber(totalDistance)} <span className="text-base font-normal opacity-80">กม.</span></h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-orange-500 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 p-4"><Fuel className="size-24" /></div>
            <CardContent className="p-6 relative z-10">
              <p className="text-orange-100 font-medium text-sm mb-1">ค่าน้ำมันรวม</p>
              <h3 className="text-3xl font-bold tracking-tight">{formatNumber(totalFuelCost)} <span className="text-base font-normal opacity-80">บาท</span></h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-emerald-500 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 p-4"><TrendingUp className="size-24" /></div>
            <CardContent className="p-6 relative z-10">
              <p className="text-emerald-100 font-medium text-sm mb-1">อัตราสิ้นเปลืองเฉลี่ย</p>
              <h3 className="text-3xl font-bold tracking-tight">{formatNumber(avgEfficiency)} <span className="text-base font-normal opacity-80">กม./ลิตร</span></h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-indigo-500 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 p-4"><Car className="size-24" /></div>
            <CardContent className="p-6 relative z-10">
              <p className="text-indigo-100 font-medium text-sm mb-1">จำนวนเที่ยวรถ</p>
              <h3 className="text-3xl font-bold tracking-tight">{formatNumber(filteredLogs.length)} <span className="text-base font-normal opacity-80">เที่ยว</span></h3>
            </CardContent>
          </Card>
        </div>

        {/* CHART SECTION */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-white">
            <CardTitle className="text-lg font-bold text-slate-800">สถิติค่าน้ำมันรายเดือน</CardTitle>
            <CardDescription>กราฟแสดงแนวโน้มค่าใช้จ่ายน้ำมันตามช่วงเวลาที่เลือก</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {fuelChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={fuelChart} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `${formatNumber(value)} ฿`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${formatNumber(value)} บาท`, 'ค่าน้ำมัน']}
                  />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-slate-400">
                <Search className="size-12 mb-3 opacity-20" />
                <p>ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TABLE SECTION */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-white">
            <CardTitle className="text-lg font-bold text-slate-800">รายละเอียดการเดินทาง</CardTitle>
            <CardDescription>ข้อมูลบันทึกการใช้รถ (Logbook) ทั้งหมด</CardDescription>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="py-4 font-semibold text-slate-600">วันที่</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-600">ทะเบียนรถ</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-600 text-right">ระยะทาง (กม.)</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-600 text-right">น้ำมัน (ลิตร)</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-600 text-right">ค่าใช้จ่าย (บาท)</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                        กำลังโหลดข้อมูล...
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                        ไม่พบข้อมูล
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const v = vehicles.find((x) => String(x.id) === String(log.vehicle_id))
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-700">
                            {formatDateThai(getLogDate(log))}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
                              {getVehiclePlate(v)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {formatNumber(getDistance(log))}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {formatNumber(getFuelLiters(log))}
                          </TableCell>
                          <TableCell className="text-right font-bold text-orange-600">
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