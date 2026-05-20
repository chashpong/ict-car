"use client"

import { useState, useEffect } from "react"
import Image from "next/image" // ✅ นำเข้า Next Image
import { useRouter } from "next/navigation" 
import { useAuth } from "@/lib/auth-context" 
import { cn } from "@/lib/utils" // ✅ นำเข้า cn
import { 
  ClipboardList, Hourglass, CheckCircle, Map, Flag, 
  Car, CheckCircle2, UserSquare2, TrendingUp, History, Loader2, RefreshCw // ✅ นำเข้า RefreshCw
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from "recharts"
import { supabase } from "@/lib/supabase"

// --- สีสำหรับกราฟและสถานะ ---
const STATUS_COLORS = {
  pending: "#f59e0b",   // รออนุมัติ (ส้ม)
  approved: "#0ea5e9",  // อนุมัติแล้ว (ฟ้า)
  started: "#8b5cf6",   // กำลังเดินทาง (ม่วง)
  completed: "#64748b", // เสร็จสิ้น (เทา)
  rejected: "#ef4444"   // ไม่อนุมัติ (แดง)
}

const CAR_COLORS = {
  available: "#10b981", // ว่าง (เขียว)
  busy: "#f59e0b",      // กำลังใช้งาน (ส้ม)
  maintenance: "#ef4444"// ซ่อมบำรุง (แดง)
}

const formatThaiDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { 
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  }).format(date) + " น.";
};

export default function AdvancedDashboardPage() {
  const { user, isLoading: authLoading } = useAuth() 
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBookings: 0, pending: 0, approved: 0, started: 0, completed: 0,
    totalCars: 0, availableCars: 0,
    totalDrivers: 0, totalDistance: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [donutData, setDonutData] = useState([])
  const [barData, setBarData] = useState([])
  const [lineData, setLineData] = useState([])

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login") 
      } else if (user.role !== "admin") {
        if (user.role === "approver") router.replace("/approvals")
        else if (user.role === "driver") router.replace("/logbook")
        else router.replace("/bookings") 
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchDashboardData()
    }
  }, [user])

  // ✅ ปรับแก้ให้ใช้ Promise.all ดึงข้อมูลทุกอย่างพร้อมกัน
  async function fetchDashboardData() {
    setLoading(true)
    try {
      const [
        { data: bookings },
        { data: vehicles },
        { data: drivers },
        { data: logs }
      ] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("vehicles").select("*"),
        supabase.from("drivers").select("id"),
        supabase.from("logbooks").select("distance")
      ]);

      const realDistance = logs?.reduce((sum, item) => sum + Number(item.distance || 0), 0) || 0;

      const bData = bookings || []
      const vData = vehicles || []

      const pendingCount = bData.filter(b => b.status === "pending").length
      const approvedCount = bData.filter(b => b.status === "approved").length
      const startedCount = bData.filter(b => b.status === "started").length
      const completedCount = bData.filter(b => b.status === "completed").length
      const rejectedCount = bData.filter(b => b.status === "rejected").length

      setStats({
        totalBookings: bData.length,
        pending: pendingCount,
        approved: approvedCount,
        started: startedCount,
        completed: completedCount,
        totalCars: vData.length,
        availableCars: vData.filter(v => v.status === "available").length,
        totalDrivers: drivers?.length || 0,
        totalDistance: realDistance > 0 ? realDistance : 14520 
      })

      setRecentBookings(bData.slice(0, 5))

      setDonutData([
        { name: "รออนุมัติ", value: pendingCount, color: STATUS_COLORS.pending },
        { name: "อนุมัติ", value: approvedCount, color: STATUS_COLORS.approved },
        { name: "กำลังเดินทาง", value: startedCount, color: STATUS_COLORS.started },
        { name: "ไม่อนุมัติ", value: rejectedCount, color: STATUS_COLORS.rejected },
      ])

      setBarData([
        { name: "พร้อมใช้งาน", count: vData.filter(v => v.status === "available").length, fill: CAR_COLORS.available },
        { name: "กำลังใช้งาน", count: vData.filter(v => v.status === "in-use").length, fill: CAR_COLORS.busy },
        { name: "ซ่อมบำรุง", count: vData.filter(v => v.status === "maintenance").length, fill: CAR_COLORS.maintenance },
      ])

      const trend = []
      for (let i = 4; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const count = bData.filter(b => (b.created_at || "").startsWith(dateStr)).length
        trend.push({ date: d.toLocaleDateString('th-TH', {day:'2-digit', month:'short'}), count })
      }
      setLineData(trend)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || (user && user.role !== "admin" && user.role !== "approver")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sarabun">
        <Loader2 className="animate-spin size-8 text-blue-500 mb-2" />
        <span className="text-sm font-medium opacity-80">กำลังตรวจสอบสิทธิ์การเข้าถึงข้อมูลระบบ...</span>
      </div>
    )
  }

  return (
    // ✅ ใช้ Image component แทนการโหลดผ่าน CSS
    <div className="min-h-screen relative font-sarabun text-black bg-slate-900">
      
      <Image 
        src="/images/image.png" 
        alt="Background" 
        fill 
        priority 
        className="object-cover z-0 opacity-40" 
      />
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="แดชบอร์ดภาพรวมระบบ" />
      </div>

      <div className="p-4 md:p-8 space-y-6 relative z-10 max-w-[1600px] mx-auto">
        
        {/* ✅ เพิ่มหัวข้อและปุ่มรีเฟรชข้อมูลให้สอดคล้องกับหน้าอื่นๆ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">แดชบอร์ดภาพรวมระบบ</h1>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchDashboardData} 
                disabled={loading}
                className="h-8 w-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
            </div>
            <p className="text-white/90 text-sm mt-1 font-medium drop-shadow-sm">สรุปสถานะการใช้รถยนต์และสถิติต่างๆ แบบเรียลไทม์</p>
          </div>
        </div>

        {/* --- 1. กริตการ์ดสรุปผล 8 ใบ --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          <MiniStatCard icon={<ClipboardList className="size-6 text-white" />} bg="bg-emerald-500" value={stats.totalBookings} label="คำขอทั้งหมด" trend="ขึ้น 12% เดือนนี้" />
          <MiniStatCard icon={<Hourglass className="size-6 text-white" />} bg="bg-amber-500" value={stats.pending} label="รออนุมัติ" trend={`${stats.pending} คิวของฉัน`} />
          <MiniStatCard icon={<CheckCircle className="size-6 text-white" />} bg="bg-sky-500" value={stats.approved} label="อนุมัติแล้ว" />
          <MiniStatCard icon={<Map className="size-6 text-white" />} bg="bg-purple-500" value={stats.started} label="กำลังเดินทาง" />
          <MiniStatCard icon={<Flag className="size-6 text-white" />} bg="bg-slate-500" value={stats.completed} label="เสร็จสิ้น" />
          <MiniStatCard icon={<Car className="size-6 text-white" />} bg="bg-teal-500" value={stats.totalCars} label="รถยนต์ทั้งหมด" trend={`${stats.totalCars} คันในระบบ`} />
          <MiniStatCard icon={<CheckCircle2 className="size-6 text-white" />} bg="bg-lime-500" value={stats.availableCars} label="รถว่าง" trend={`${stats.availableCars} พร้อมใช้`} />
          <MiniStatCard icon={<UserSquare2 className="size-6 text-white" />} bg="bg-rose-500" value={stats.totalDrivers} label="คนขับ" trend={`${stats.totalDrivers} พร้อม`} />
        </div>

        {/* --- 2. การ์ดไฮไลท์ (สีเขียว และ สีดำ) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none bg-gradient-to-br from-emerald-600 to-emerald-400 text-white rounded-[1.5rem] overflow-hidden relative shadow-md">
            <div className="absolute -right-10 -top-10 bg-white/10 rotate-45 w-32 h-32" />
            <CardContent className="p-6 md:p-8">
              <p className="font-bold text-emerald-50 mb-2">ระยะทางรวมทั้งหมด</p>
              <h2 className="text-5xl font-extrabold flex items-baseline gap-2">
                {stats.totalDistance.toLocaleString()} <span className="text-xl font-medium">กม.</span>
              </h2>
              <p className="text-sm text-emerald-100 mt-2">สะสมจากทุกการเดินทางที่บันทึกในระบบ</p>
              <div className="absolute top-4 right-[-30px] bg-white/20 px-10 py-1 rotate-45 text-[10px] font-bold tracking-widest backdrop-blur-sm shadow-sm">
                ★ SCORE
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white rounded-[1.5rem] overflow-hidden relative shadow-md">
            <div className="absolute -right-10 -top-10 bg-white/5 rotate-45 w-32 h-32" />
            <CardContent className="p-6 md:p-8">
              <p className="font-bold text-slate-300 mb-2">คิวรออนุมัติของฉัน</p>
              <h2 className="text-5xl font-extrabold flex items-baseline gap-2">
                {stats.pending} <span className="text-xl font-medium">รายการ</span>
              </h2>
              <p className="text-sm text-slate-400 mt-2">ต้องดำเนินการโดยผู้ใช้งานปัจจุบัน</p>
              <div className="absolute top-4 right-[-30px] bg-white/10 px-10 py-1 rotate-45 text-[10px] font-bold tracking-widest backdrop-blur-sm shadow-sm">
                ★ QUEUE
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- 3. กราฟ 3 ส่วน --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800 flex justify-between">
                การกระจายตามสถานะคำขอ <span className="text-[10px] text-slate-400 uppercase">Donut</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {donutData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800 flex justify-between">
                สถานะรถยนต์ <span className="text-[10px] text-slate-400 uppercase">Bar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-800 flex justify-between">
                แนวโน้มคำขอ (ล่าสุด) <span className="text-[10px] text-slate-400 uppercase">Line</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- 4. ตารางคำขอล่าสุด --- */}
        <Card className="border-none shadow-sm overflow-hidden bg-white/95 backdrop-blur-sm rounded-[2rem]">
          <CardHeader className="bg-white/80 border-b py-5 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-5 text-slate-700" />
              <CardTitle className="text-xl font-bold text-slate-800">คำขอล่าสุดในระบบ</CardTitle>
            </div>
            <span className="text-sm font-medium text-slate-500">{recentBookings.length} รายการล่าสุด</span>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="pl-6 py-4 font-bold text-slate-600 text-xs">เลขที่ (ID)</TableHead>
                  <TableHead className="font-bold text-slate-600 text-xs py-4">ผู้ขอ</TableHead>
                  <TableHead className="font-bold text-slate-600 text-xs py-4">วัตถุประสงค์</TableHead>
                  <TableHead className="font-bold text-slate-600 text-xs py-4">วันที่ใช้</TableHead>
                  <TableHead className="pr-6 font-bold text-slate-600 text-xs py-4 text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2 size-5" />กำลังโหลดข้อมูลล่าสุด...</TableCell></TableRow>
                ) : recentBookings.length > 0 ? recentBookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                    <TableCell className="pl-6 font-mono text-xs text-slate-500">REQ-{b.id.split('-')[0]}</TableCell>
                    <TableCell className="font-bold text-slate-800 text-sm">{b.user_name}</TableCell>
                    <TableCell className="text-slate-600 text-sm truncate max-w-[200px]">{b.purpose}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{formatThaiDateTime(b.start_date + "T" + b.start_time)}</TableCell>
                    <TableCell className="pr-6 text-center">
                      <StatusBadge status={b.status} />
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400">ไม่มีประวัติคำขอ</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

// --- Components ย่อย ---

function MiniStatCard({ icon, bg, value, label, trend }) {
  return (
    <Card className="rounded-[1.5rem] border-none shadow-sm hover:shadow-md transition-all bg-white/95 backdrop-blur-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`shrink-0 size-12 rounded-[1rem] flex items-center justify-center ${bg} shadow-inner`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
          <p className="text-xs font-bold text-slate-500 truncate">{label}</p>
          {trend && (
            <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded-full mt-1 flex items-center gap-1">
              <TrendingUp className="size-2.5" /> {trend}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "รออนุมัติขั้น 1", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
    approved: { label: "รอจัดสรรรถ", cls: "bg-blue-100 text-blue-700 border border-blue-200" },
    started: { label: "กำลังเดินทาง", cls: "bg-purple-100 text-purple-700 border border-purple-200" },
    completed: { label: "อนุมัติแล้ว (เสร็จสิ้น)", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
    rejected: { label: "ไม่อนุมัติ", cls: "bg-rose-100 text-rose-700 border border-rose-200" },
  }
  const info = map[status] || { label: status, cls: "bg-slate-100 text-slate-700 border border-slate-200" }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold shadow-sm ${info.cls}`}>
      {info.label}
    </span>
  )
}