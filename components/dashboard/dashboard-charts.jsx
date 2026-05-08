"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Helper: ตัดเลขศูนย์ให้ดูง่ายขึ้นในแกน Y
const valueFormatter = (number) => {
  if (number >= 1000) return `${(number / 1000).toFixed(0)}k`
  return number
}

// Helper: สร้างโครงข้อมูล 6 เดือนย้อนหลังรอไว้
const generateLast6Months = () => {
  const months = []
  const today = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString("th-TH", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      trips: 0,
      cost: 0,
    })
  }
  return months
}

/* =========================================
   1. กราฟการใช้รถรายเดือน
========================================= */
export function MonthlyUsageChart({ logEntries = [] }) {
  // คำนวณจำนวนเที่ยวแยกตามเดือน
  const chartData = useMemo(() => {
    const data = generateLast6Months()
    logEntries.forEach((log) => {
      const d = new Date(log.log_date || log.created_at)
      if (isNaN(d)) return
      const target = data.find((m) => m.year === d.getFullYear() && m.month === d.getMonth())
      if (target) target.trips += 1
    })
    return data.map((d) => ({ month: d.label, trips: d.trips }))
  }, [logEntries])

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-800">การใช้รถรายเดือน (6 เดือนย้อนหลัง)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
              />
              <Bar dataKey="trips" fill="url(#colorTrips)" radius={[6, 6, 0, 0]} maxBarSize={50} name="จำนวนเที่ยว" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/* =========================================
   2. กราฟค่าใช้จ่ายน้ำมัน
========================================= */
export function FuelExpenseChart({ logEntries = [] }) {
  // คำนวณค่าน้ำมันแยกตามเดือน
  const chartData = useMemo(() => {
    const data = generateLast6Months()
    logEntries.forEach((log) => {
      const d = new Date(log.log_date || log.created_at)
      if (isNaN(d)) return
      const target = data.find((m) => m.year === d.getFullYear() && m.month === d.getMonth())
      if (target) target.cost += Number(log.fuel_cost || 0)
    })
    return data.map((d) => ({ month: d.label, cost: d.cost }))
  }, [logEntries])

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-800">ค่าใช้จ่ายน้ำมัน (บาท)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(val) => valueFormatter(val)} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
                formatter={(value) => [`${value.toLocaleString()} บาท`, "ค่าน้ำมัน"]}
              />
              <Area type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" name="ค่าน้ำมัน" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/* =========================================
   3. กราฟรถที่ถูกใช้งานมากที่สุด
========================================= */
export function VehicleUsageChart({ logEntries = [], vehicles = [] }) {
  // นับจำนวนเที่ยวของรถแต่ละคัน แล้วเอาเฉพาะ Top 5
  const chartData = useMemo(() => {
    const usage = {}
    logEntries.forEach((log) => {
      const vId = log.vehicle_id
      if (!vId) return
      if (!usage[vId]) usage[vId] = 0
      usage[vId] += 1
    })

    return Object.entries(usage)
      .map(([vId, trips]) => {
        const v = vehicles.find((x) => String(x.id) === String(vId))
        const name = v ? (v.license_plate || v.licensePlate || "ไม่ระบุ") : "ไม่ระบุ"
        return { name, trips }
      })
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5) // ตัดมาแค่ 5 คันที่ใช้งานเยอะสุด
  }, [logEntries, vehicles])

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-800">รถที่ใช้งานมากที่สุด (Top 5)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
               <defs>
                <linearGradient id="colorVehicle" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={85} tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
              />
              <Bar dataKey="trips" fill="url(#colorVehicle)" radius={[0, 6, 6, 0]} maxBarSize={30} name="จำนวนเที่ยว" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}