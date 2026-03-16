"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, FileSpreadsheet, Fuel, Route, Car, TrendingDown } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

function getVehiclePlate(vehicle) {
  return vehicle?.license_plate || vehicle?.licensePlate || "-"
}

function getVehicleName(vehicle) {
  const brand = vehicle?.brand || ""
  const model = vehicle?.model || ""
  return `${brand} ${model}`.trim() || "-"
}

function getLogVehicleId(log) {
  return String(log?.vehicle_id || "")
}

function getLogDate(log) {
  return log?.start_time || log?.created_at || ""
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
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
  })
}

function formatDateThai(dateString) {
  if (!dateString) return "-"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("th-TH")
}

function MonthlyExpenseReport({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">ค่าใช้จ่ายน้ำมันรายเดือน</CardTitle>
        <CardDescription>แสดงแนวโน้มค่าใช้จ่ายน้ำมันตามข้อมูลจริง</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-foreground)",
                }}
                formatter={(value) => [`${Number(value).toLocaleString()} บาท`, "ค่าน้ำมัน"]}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={{ fill: "var(--color-chart-1)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function DistanceReport({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">ระยะทางรวมแยกตามคัน</CardTitle>
        <CardDescription>เปรียบเทียบระยะทางสะสมของแต่ละคัน</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-foreground)",
                }}
                formatter={(value) => [`${Number(value).toLocaleString()} กม.`, "ระยะทาง"]}
              />
              <Bar dataKey="distance" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function VehicleSummaryTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">สรุปข้อมูลรายคัน</CardTitle>
        <CardDescription>รายงานสรุปการใช้งานและค่าใช้จ่ายรายคัน</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ทะเบียนรถ</TableHead>
              <TableHead>รุ่น</TableHead>
              <TableHead className="text-right">จำนวนเที่ยว</TableHead>
              <TableHead className="text-right">ระยะทาง (กม.)</TableHead>
              <TableHead className="text-right hidden sm:table-cell">น้ำมัน (ลิตร)</TableHead>
              <TableHead className="text-right hidden md:table-cell">ค่าน้ำมัน (บาท)</TableHead>
              <TableHead className="text-right hidden lg:table-cell">อัตราสิ้นเปลือง (กม./ลิตร)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.licensePlate}</TableCell>
                  <TableCell>{v.brand} {v.model}</TableCell>
                  <TableCell className="text-right">{v.trips}</TableCell>
                  <TableCell className="text-right">{v.totalDistance.toLocaleString()}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{v.totalFuel.toLocaleString()}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{v.totalFuelCost.toLocaleString()}</TableCell>
                  <TableCell className="text-right hidden lg:table-cell">{v.efficiency}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const [vehicles, setVehicles] = useState([])
  const [logEntries, setLogEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const firstDayOfYear = `${today.getFullYear()}-01-01`
  const todayString = today.toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(firstDayOfYear)
  const [endDate, setEndDate] = useState(todayString)
  const [selectedVehicle, setSelectedVehicle] = useState("all")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false })

    const { data: logsData, error: logsError } = await supabase
      .from("logbooks")
      .select("*")
      .order("start_time", { ascending: true })

    if (vehiclesError) {
      console.error("vehicles error:", vehiclesError)
    }

    if (logsError) {
      console.error("logbooks error:", logsError)
    }

    setVehicles(vehiclesData || [])
    setLogEntries(logsData || [])
    setLoading(false)
  }

  const filteredLogs = useMemo(() => {
    return logEntries.filter((log) => {
      const logDate = getLogDate(log)
      const logDateOnly = logDate ? logDate.slice(0, 10) : ""
      const logVehicleId = getLogVehicleId(log)

      const matchVehicle =
        selectedVehicle === "all" || logVehicleId === String(selectedVehicle)

      const matchStart = !startDate || logDateOnly >= startDate
      const matchEnd = !endDate || logDateOnly <= endDate

      return matchVehicle && matchStart && matchEnd
    })
  }, [logEntries, selectedVehicle, startDate, endDate])

  const vehicleSummary = useMemo(() => {
    return vehicles
      .map((v) => {
        const vehicleId = String(v.id)
        const logs = filteredLogs.filter((l) => getLogVehicleId(l) === vehicleId)

        const totalDistance = logs.reduce((sum, l) => sum + getDistance(l), 0)
        const totalFuel = logs.reduce((sum, l) => sum + getFuelLiters(l), 0)
        const totalFuelCost = logs.reduce((sum, l) => sum + getFuelCost(l), 0)
        const efficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(1) : "-"

        return {
          id: v.id,
          licensePlate: getVehiclePlate(v),
          brand: v.brand || "",
          model: v.model || "",
          totalDistance,
          totalFuel,
          totalFuelCost,
          efficiency,
          trips: logs.length,
        }
      })
      .filter((v) => v.trips > 0)
  }, [vehicles, filteredLogs])

  const totalDistance = useMemo(
    () => filteredLogs.reduce((sum, l) => sum + getDistance(l), 0),
    [filteredLogs]
  )

  const totalFuelCost = useMemo(
    () => filteredLogs.reduce((sum, l) => sum + getFuelCost(l), 0),
    [filteredLogs]
  )

  const totalFuelLiters = useMemo(
    () => filteredLogs.reduce((sum, l) => sum + getFuelLiters(l), 0),
    [filteredLogs]
  )

  const avgEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(1) : "-"

  const distanceChartData = useMemo(() => {
    return vehicleSummary.map((v) => ({
      name: v.licensePlate,
      distance: v.totalDistance,
    }))
  }, [vehicleSummary])

  const fuelExpenseData = useMemo(() => {
    const grouped = {}

    filteredLogs.forEach((log) => {
      const date = getLogDate(log)
      if (!date) return

      const monthKey = date.slice(0, 7)

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          monthKey,
          month: getMonthLabel(date),
          cost: 0,
        }
      }

      grouped[monthKey].cost += getFuelCost(log)
    })

    return Object.values(grouped).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }, [filteredLogs])

  function handleResetFilter() {
    setStartDate(firstDayOfYear)
    setEndDate(todayString)
    setSelectedVehicle("all")
  }

  function exportToExcel() {
    const selectedVehicleData = vehicles.find((v) => String(v.id) === String(selectedVehicle))

    const summarySheetData = [
      { รายการ: "วันที่เริ่มต้น", ค่า: startDate || "-" },
      { รายการ: "วันที่สิ้นสุด", ค่า: endDate || "-" },
      {
        รายการ: "รถที่เลือก",
        ค่า: selectedVehicle === "all" ? "ทุกคัน" : getVehiclePlate(selectedVehicleData),
      },
      { รายการ: "ระยะทางรวม (กม.)", ค่า: totalDistance },
      { รายการ: "ค่าน้ำมันรวม (บาท)", ค่า: totalFuelCost },
      { รายการ: "อัตราสิ้นเปลืองเฉลี่ย (กม./ลิตร)", ค่า: avgEfficiency },
      { รายการ: "จำนวนเที่ยว", ค่า: filteredLogs.length },
    ]

    const vehicleSheetData = vehicleSummary.map((v) => ({
      ทะเบียนรถ: v.licensePlate,
      รุ่น: `${v.brand} ${v.model}`.trim(),
      จำนวนเที่ยว: v.trips,
      ระยะทางรวม_กม: v.totalDistance,
      น้ำมัน_ลิตร: v.totalFuel,
      ค่าน้ำมัน_บาท: v.totalFuelCost,
      อัตราสิ้นเปลือง_กม_ลิตร: v.efficiency,
    }))

    const tripSheetData = filteredLogs.map((log, index) => {
      const vehicle = vehicles.find((v) => String(v.id) === getLogVehicleId(log))
      return {
        ลำดับ: index + 1,
        วันที่: formatDateThai(getLogDate(log)),
        ทะเบียนรถ: vehicle ? getVehiclePlate(vehicle) : "-",
        ระยะทาง_กม: getDistance(log),
        น้ำมัน_ลิตร: getFuelLiters(log),
        ค่าน้ำมัน_บาท: getFuelCost(log),
      }
    })

    const workbook = XLSX.utils.book_new()

    const summarySheet = XLSX.utils.json_to_sheet(summarySheetData)
    const vehicleSheet = XLSX.utils.json_to_sheet(vehicleSheetData)
    const tripSheet = XLSX.utils.json_to_sheet(tripSheetData)

    XLSX.utils.book_append_sheet(workbook, summarySheet, "สรุปภาพรวม")
    XLSX.utils.book_append_sheet(workbook, vehicleSheet, "สรุปรายคัน")
    XLSX.utils.book_append_sheet(workbook, tripSheet, "รายการเที่ยว")

    XLSX.writeFile(workbook, `reports_${startDate}_to_${endDate}.xlsx`)
  }

  function exportToPDF() {
    const selectedVehicleData = vehicles.find((v) => String(v.id) === String(selectedVehicle))
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("Vehicle Report", 14, 18)

    doc.setFontSize(10)
    doc.text(`Start Date: ${startDate || "-"}`, 14, 26)
    doc.text(`End Date: ${endDate || "-"}`, 14, 32)
    doc.text(
      `Vehicle: ${selectedVehicle === "all" ? "All" : getVehiclePlate(selectedVehicleData)}`,
      14,
      38
    )

    autoTable(doc, {
      startY: 46,
      head: [["Metric", "Value"]],
      body: [
        ["Total Distance (km)", totalDistance.toLocaleString()],
        ["Total Fuel Cost (THB)", totalFuelCost.toLocaleString()],
        ["Average Efficiency (km/l)", String(avgEfficiency)],
        ["Trips", filteredLogs.length.toLocaleString()],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Plate", "Model", "Trips", "Distance", "Fuel", "Fuel Cost", "Efficiency"]],
      body:
        vehicleSummary.length > 0
          ? vehicleSummary.map((v) => [
              v.licensePlate,
              `${v.brand} ${v.model}`.trim(),
              v.trips,
              v.totalDistance.toLocaleString(),
              v.totalFuel.toLocaleString(),
              v.totalFuelCost.toLocaleString(),
              String(v.efficiency),
            ])
          : [["-", "-", "0", "0", "0", "0", "-"]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 174, 96] },
    })

    doc.addPage()

    autoTable(doc, {
      startY: 16,
      head: [["#", "Date", "Plate", "Distance (km)", "Fuel (L)", "Fuel Cost"]],
      body:
        filteredLogs.length > 0
          ? filteredLogs.map((log, index) => {
              const vehicle = vehicles.find((v) => String(v.id) === getLogVehicleId(log))
              return [
                index + 1,
                formatDateThai(getLogDate(log)),
                vehicle ? getVehiclePlate(vehicle) : "-",
                getDistance(log).toLocaleString(),
                getFuelLiters(log).toLocaleString(),
                getFuelCost(log).toLocaleString(),
              ]
            })
          : [["-", "-", "-", "0", "0", "0"]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [142, 68, 173] },
    })

    doc.save(`reports_${startDate}_to_${endDate}.pdf`)
  }

  return (
    <>
      <PageHeader title="รายงาน" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">รายงานและสถิติ</h1>
            <p className="text-sm text-muted-foreground">สรุปข้อมูลการใช้รถและค่าใช้จ่าย</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToPDF} disabled={loading}>
              <FileText className="mr-2 size-4" />
              Export PDF
            </Button>

            <Button variant="outline" onClick={exportToExcel} disabled={loading}>
              <FileSpreadsheet className="mr-2 size-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <Card className="py-4">
          <CardContent className="px-4 pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-2">
                <Label className="text-xs">วันที่เริ่มต้น</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs">วันที่สิ้นสุด</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs">รถ</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกคัน</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {getVehiclePlate(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" type="button" onClick={handleResetFilter}>
                รีเซ็ต
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Route className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ระยะทางรวม</p>
                  <p className="text-xl font-bold text-foreground">
                    {totalDistance.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-muted-foreground">กม.</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                  <Fuel className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ค่าน้ำมันรวม</p>
                  <p className="text-xl font-bold text-foreground">
                    {totalFuelCost.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-muted-foreground">บาท</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                  <TrendingDown className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">อัตราสิ้นเปลือง</p>
                  <p className="text-xl font-bold text-foreground">
                    {avgEfficiency}{" "}
                    <span className="text-sm font-normal text-muted-foreground">กม./ลิตร</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Car className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">จำนวนเที่ยว</p>
                  <p className="text-xl font-bold text-foreground">
                    {filteredLogs.length}{" "}
                    <span className="text-sm font-normal text-muted-foreground">เที่ยว</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expense">
          <TabsList>
            <TabsTrigger value="expense">ค่าใช้จ่ายรายเดือน</TabsTrigger>
            <TabsTrigger value="distance">ระยะทาง</TabsTrigger>
            <TabsTrigger value="summary">สรุปต่อคัน</TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="mt-4">
            <MonthlyExpenseReport data={fuelExpenseData} />
          </TabsContent>

          <TabsContent value="distance" className="mt-4">
            <DistanceReport data={distanceChartData} />
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <VehicleSummaryTable data={vehicleSummary} />
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">รายการเที่ยวที่ใช้ในรายงาน</CardTitle>
            <CardDescription>
              ช่วงวันที่ {formatDateThai(startDate)} ถึง {formatDateThai(endDate)}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ทะเบียนรถ</TableHead>
                  <TableHead className="text-right">ระยะทาง</TableHead>
                  <TableHead className="text-right">น้ำมัน</TableHead>
                  <TableHead className="text-right">ค่าน้ำมัน</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    const vehicle = vehicles.find((v) => String(v.id) === getLogVehicleId(log))
                    return (
                      <TableRow key={log.id || index}>
                        <TableCell>{formatDateThai(getLogDate(log))}</TableCell>
                        <TableCell>{vehicle ? getVehiclePlate(vehicle) : "-"}</TableCell>
                        <TableCell className="text-right">{getDistance(log).toLocaleString()} กม.</TableCell>
                        <TableCell className="text-right">{getFuelLiters(log).toLocaleString()} ลิตร</TableCell>
                        <TableCell className="text-right">{getFuelCost(log).toLocaleString()} บาท</TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      ไม่มีข้อมูลในช่วงที่เลือก
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {loading && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>}
      </div>
    </>
  )
}