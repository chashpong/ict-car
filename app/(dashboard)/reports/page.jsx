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

/* ===================== UTIL ===================== */

function getVehiclePlate(vehicle) {
  return vehicle?.license_plate || "-"
}

function getLogVehicleId(log) {
  return String(log?.vehicle_id || "")
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
  return date.toLocaleDateString("th-TH")
}

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

  const vehicleSummary = useMemo(() => {
    return vehicles.map((v) => {
      const logs = filteredLogs.filter(
        (l) => String(l.vehicle_id) === String(v.id)
      )

      const totalDistance = logs.reduce((s, l) => s + getDistance(l), 0)
      const totalFuel = logs.reduce((s, l) => s + getFuelLiters(l), 0)
      const totalCost = logs.reduce((s, l) => s + getFuelCost(l), 0)

      return {
        id: v.id,
        licensePlate: getVehiclePlate(v),
        totalDistance,
        totalFuel,
        totalCost,
        trips: logs.length,
        efficiency:
          totalFuel > 0 ? (totalDistance / totalFuel).toFixed(1) : "-",
      }
    })
  }, [vehicles, filteredLogs])

  const totalDistance = filteredLogs.reduce((s, l) => s + getDistance(l), 0)
  const totalFuelCost = filteredLogs.reduce((s, l) => s + getFuelCost(l), 0)
  const totalFuel = filteredLogs.reduce((s, l) => s + getFuelLiters(l), 0)

  const avgEfficiency =
    totalFuel > 0 ? (totalDistance / totalFuel).toFixed(1) : "-"

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
    XLSX.writeFile(wb, "report.xlsx")
  }

  function exportPDF() {
    const doc = new jsPDF()

    autoTable(doc, {
      head: [["Date", "Plate", "Distance", "Fuel", "Cost"]],
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

    doc.save("report.pdf")
  }

  /* ===================== UI ===================== */

  return (
    <>
      <PageHeader title="รายงาน" />

      <div className="p-6 space-y-6">

        {/* FILTER */}
        <Card>
          <CardContent className="flex gap-4 items-end p-4">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-[180px]">
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

            <Button onClick={exportPDF}>PDF</Button>
            <Button onClick={exportExcel}>Excel</Button>
          </CardContent>
        </Card>

        {/* SUMMARY */}
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent>ระยะทาง: {totalDistance}</CardContent></Card>
          <Card><CardContent>ค่าน้ำมัน: {totalFuelCost}</CardContent></Card>
          <Card><CardContent>เฉลี่ย: {avgEfficiency}</CardContent></Card>
          <Card><CardContent>เที่ยว: {filteredLogs.length}</CardContent></Card>
        </div>

        {/* CHART */}
        <Card>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fuelChart}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line dataKey="cost" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TABLE */}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ทะเบียน</TableHead>
                  <TableHead>ระยะทาง</TableHead>
                  <TableHead>น้ำมัน</TableHead>
                  <TableHead>ค่าใช้จ่าย</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLogs.map((log) => {
                  const v = vehicles.find(
                    (x) => String(x.id) === String(log.vehicle_id)
                  )

                  return (
                    <TableRow key={log.id}>
                      <TableCell>{formatDateThai(getLogDate(log))}</TableCell>
                      <TableCell>{getVehiclePlate(v)}</TableCell>
                      <TableCell>{getDistance(log)}</TableCell>
                      <TableCell>{getFuelLiters(log)}</TableCell>
                      <TableCell>{getFuelCost(log)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </>
  )
}