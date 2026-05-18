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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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
      label: d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }), // ใส่ปีให้ชัดเจนขึ้น
      year: d.getFullYear(),
      month: d.getMonth(),
      trips: 0,
      cost: 0,
    })
  }
  return months
}

/* =========================================
   1. กราฟการใช้รถรายเดือน (ปรับให้คลีน เน้นพื้นที่ว่าง)
========================================= */
export function MonthlyUsageChart({ logEntries = [] }) {
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
    <Card className="rounded-[1.5rem] border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
      <CardHeader className="pb-6 pt-6 px-6">
        <CardTitle className="text-lg font-extrabold text-slate-800">การใช้รถรายเดือน</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">
          สถิติจำนวนเที่ยวการเดินทางย้อนหลัง 6 เดือน
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <div className="h-[280px] w-full">
          {/* ปรับ Margin ให้มีพื้นที่ว่าง (White Space) รอบกราฟ */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} dx={-10} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
                formatter={(value) => [`${value} ครั้ง`, "จำนวนเที่ยวเดินทาง"]} // อธิบายหน่วยชัดเจน
              />
              {/* ใช้สี Solid สีเดียวให้ดูเป็นทางการและไม่รก */}
              <Bar dataKey="trips" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={45} name="จำนวนเที่ยว" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/* =========================================
   2. กราฟค่าใช้จ่ายน้ำมัน (Area Chart แบบสบายตา)
========================================= */
export function FuelExpenseChart({ logEntries = [] }) {
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
    <Card className="rounded-[1.5rem] border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
      <CardHeader className="pb-6 pt-6 px-6">
        <CardTitle className="text-lg font-extrabold text-slate-800">ค่าใช้จ่ายน้ำมันเชื้อเพลิง</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">
          สรุปยอดเบิกจ่ายค่าน้ำมันรายเดือน (หน่วย: บาท)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* เพิ่ม Left margin เพื่อไม่ให้ตัวเลขหลักพัน/หมื่น โดนตัดขอบ */}
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} dx={-10} tickFormatter={(val) => valueFormatter(val)} />
              <Tooltip
                contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
                formatter={(value) => [`฿ ${value.toLocaleString()}`, "ยอดค่าน้ำมัน"]} 
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
   3. กราฟรถที่ถูกใช้งานมากที่สุด (Top 5 - ปรับให้อ่านง่าย)
========================================= */
export function VehicleUsageChart({ logEntries = [], vehicles = [] }) {
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
      .slice(0, 5) 
  }, [logEntries, vehicles])

  return (
    <Card className="rounded-[1.5rem] border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
      <CardHeader className="pb-6 pt-6 px-6">
        <CardTitle className="text-lg font-extrabold text-slate-800">รถที่ถูกเรียกใช้งานบ่อย (Top 5)</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">
          จัดอันดับรถยนต์ส่วนกลางตามความถี่ที่ถูกจอง
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* ขยาย Left margin เพื่อรองรับทะเบียนรถยาวๆ ไม่ให้ล้นจอ */}
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={85} tick={{ fill: "#475569", fontSize: 13, fontWeight: 700 }} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }}
                formatter={(value) => [`${value} ครั้ง`, "ถูกเรียกใช้งาน"]} 
              />
              <Bar dataKey="trips" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={30} name="จำนวนเที่ยว" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}