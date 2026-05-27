"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Car, User, MapPin, Clock, RefreshCw, Loader2, Info, Filter,
  ShieldCheck, AlertTriangle
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

/**
 * STATUS CONFIGURATION
 * กำหนดสีและชื่อสถานะให้เป็นมาตรฐานเดียวกันทั่วทั้งระบบ
 */
const STATUS_CONFIG = {
  pending: {
    label: "รออนุมัติ",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dot: "bg-amber-500"
  },
  approved: {
    label: "อนุมัติแล้ว",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dot: "bg-blue-500"
  },
  started: {
    label: "กำลังเดินทาง",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    dot: "bg-purple-500"
  },
  completed: {
    label: "เสร็จสิ้น",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dot: "bg-emerald-500"
  }
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDayBookings, setSelectedDayBookings] = useState([])
  const [activeDayStr, setActiveDayStr] = useState(new Date().toISOString().slice(0, 10))

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // ดึงข้อมูลการจองและรายชื่อรถทั้งหมด
  useEffect(() => {
    loadCalendarData()
  }, [])

  const loadCalendarData = async () => {
    setIsLoading(true)
    try {
      const [bRes, vRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*, vehicles(license_plate, brand, model)")
          .not("status", "eq", "rejected"), // ไม่เอาคิวที่ถูกปฏิเสธมาแสดง
        supabase.from("vehicles").select("id, license_plate, brand")
      ])

      setBookings(bRes.data || [])
      setVehicles(vRes.data || [])
      
      // อัปเดตรายการจองของวันที่ถูกเลือกอยู่
      updateActiveDayList(activeDayStr, bRes.data || [])
    } catch (error) {
      console.error("Error loading calendar data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // ตัวกรองข้อมูลคิวจองรถตามทะเบียนรถที่เลือก
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (selectedVehicle !== "all" && String(b.vehicle_id) !== String(selectedVehicle)) {
        return false
      }
      return true
    })
  }, [bookings, selectedVehicle])

  // คำนวณตาราง Grid ของปฏิทินแบบรายเดือน
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const grid = []
    
    // วันว่างของเดือนก่อนหน้า (Padding)
    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push({ isCurrentMonth: false, dateStr: null, dayNum: "" })
    }
    
    // วันในเดือนปัจจุบัน
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      grid.push({ isCurrentMonth: true, dateStr, dayNum: day })
    }
    return grid
  }, [currentYear, currentMonth])

  // ฟังก์ชันสกัดดึงข้อมูลการจองรายวัน (รองรับการจองยาวหลายวัน)
  const getBookingsForDate = (dateStr) => {
    if (!dateStr) return []
    return filteredBookings.filter(b => dateStr >= b.start_date && dateStr <= b.end_date)
  }

  const handleDayClick = (dateStr) => {
    if (!dateStr) return
    setActiveDayStr(dateStr)
    updateActiveDayList(dateStr, bookings)
  }

  const updateActiveDayList = (dateStr, allBookings) => {
    const dayJobs = allBookings.filter(b => dateStr >= b.start_date && dateStr <= b.end_date)
    setSelectedDayBookings(dayJobs)
  }

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))

  const monthNameThai = currentDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" })

  return (
    <div className="min-h-screen font-sarabun text-black relative bg-slate-900">
      {/* Background Section */}
      <Image 
        src="/images/image.png" 
        alt="Background" 
        fill 
        priority 
        className="object-cover z-0 opacity-40" 
      />
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Header Section */}
      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="ปฏิทินตารางการใช้รถ" />
      </div>

      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 relative z-10">
        
        {/* Page Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md flex items-center gap-3">
              <CalendarIcon className="size-8 text-blue-400" /> ปฏิทินตารางใช้รถยนต์ส่วนกลาง
            </h1>
            <p className="text-white/90 text-sm mt-1 font-medium drop-shadow-sm flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" /> 
              ข้อมูลปฏิทินกลางเพื่อป้องกันความผิดพลาดและการจองซ้ำ
            </p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/95 backdrop-blur-sm p-5 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="bg-slate-100 p-2 rounded-xl text-slate-500"><Filter className="size-4" /></div>
            <div className="w-full sm:w-64">
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="h-11 rounded-xl font-bold text-slate-700 bg-white">
                  <SelectValue placeholder="กรองตามทะเบียนรถ" />
                </SelectTrigger>
                <SelectContent className="font-sarabun text-black bg-white border-slate-200">
                  <SelectItem value="all">แสดงตารางรถทุกคันในระบบ</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.license_plate} {v.brand ? `(${v.brand})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={loadCalendarData} disabled={isLoading} className="h-11 w-11 rounded-xl bg-white shrink-0">
              <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Month Controller */}
          <div className="flex items-center gap-4 self-center lg:self-auto bg-slate-100/50 p-1 rounded-2xl border border-slate-200">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-xl hover:bg-white transition-all">
              <ChevronLeft className="size-5" />
            </Button>
            <h2 className="text-lg font-extrabold text-slate-800 min-w-[160px] text-center">{monthNameThai}</h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-xl hover:bg-white transition-all">
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>

        {/* Layout: Calendar Grid & Details */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* 📅 CALENDAR COMPONENT (3/4 Width) */}
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white/95 backdrop-blur-sm xl:col-span-3">
            <CardContent className="p-4 md:p-6">
              
              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center font-bold text-[11px] md:text-sm text-slate-400 uppercase tracking-widest mb-4 pb-3 border-b">
                <div className="text-rose-500">อา.</div>
                <div>จ.</div>
                <div>อ.</div>
                <div>พ.</div>
                <div>พฤ.</div>
                <div>ศ.</div>
                <div className="text-sky-500">ส.</div>
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-3">
                {calendarGrid.map((cell, idx) => {
                  const dayBookings = getBookingsForDate(cell.dateStr)
                  const isToday = cell.dateStr === new Date().toISOString().slice(0, 10)
                  const isSelected = cell.dateStr === activeDayStr

                  return (
                    <div
                      key={`day-${idx}`}
                      onClick={() => cell.dateStr && handleDayClick(cell.dateStr)}
                      className={cn(
                        "min-h-[90px] md:min-h-[120px] p-2 rounded-2xl border transition-all flex flex-col group relative",
                        cell.isCurrentMonth 
                          ? "bg-white border-slate-100 cursor-pointer hover:border-blue-400 hover:shadow-md" 
                          : "bg-slate-50/40 border-transparent pointer-events-none text-slate-300",
                        isToday && "bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/20",
                        isSelected && "border-blue-600 bg-blue-50 ring-2 ring-blue-600/10 shadow-inner"
                      )}
                    >
                      {/* Day Number */}
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn(
                          "text-xs md:text-sm font-bold size-6 md:size-8 flex items-center justify-center rounded-xl transition-colors",
                          cell.isCurrentMonth ? "text-slate-700" : "text-slate-300",
                          isToday && "bg-blue-600 text-white shadow-md shadow-blue-200"
                        )}>
                          {cell.dayNum}
                        </span>
                        {dayBookings.length > 0 && cell.isCurrentMonth && (
                          <span className="hidden sm:inline-flex text-[10px] font-extrabold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-lg border border-blue-200">
                            {dayBookings.length}
                          </span>
                        )}
                      </div>

                      {/* Desktop Job Labels */}
                      <div className="hidden md:flex flex-col gap-1.5 mt-1 overflow-hidden">
                        {cell.isCurrentMonth && dayBookings.slice(0, 2).map((b) => (
                          <div 
                            key={`job-${b.id}`} 
                            className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded-lg truncate border flex items-center gap-1.5",
                              STATUS_CONFIG[b.status]?.color || "bg-slate-100 text-slate-500"
                            )}
                          >
                            <div className={cn("size-1.5 rounded-full shrink-0", STATUS_CONFIG[b.status]?.dot)} />
                            {b.vehicles?.license_plate || "N/A"}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <p className="text-[10px] text-slate-400 text-center font-bold font-mono mt-0.5">
                            +{dayBookings.length - 2} เพิ่มเติม
                          </p>
                        )}
                      </div>
                      
                      {/* Mobile Indicator Dots */}
                      <div className="md:hidden flex justify-center gap-1 mt-auto">
                        {cell.isCurrentMonth && dayBookings.slice(0, 4).map((b) => (
                          <div key={`dot-${b.id}`} className={cn("size-1.5 rounded-full", STATUS_CONFIG[b.status]?.dot)} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 📝 SIDE DETAIL PANEL (1/4 Width) */}
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white/95 backdrop-blur-sm xl:col-span-1 flex flex-col h-max xl:h-full">
            <CardHeader className="bg-slate-50 border-b p-5">
              <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Info className="size-4 text-blue-500" /> ตารางการจองรถยนต์
              </CardTitle>
              <CardDescription className="font-bold text-blue-600 mt-1 flex items-center gap-2">
                <CalendarIcon className="size-3.5" />
                {formatDateThai(activeDayStr)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto max-h-[400px] xl:max-h-none space-y-3 custom-scrollbar">
              {isLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto mb-2 text-blue-500" />
                  กำลังดึงข้อมูล...
                </div>
              ) : selectedDayBookings.length === 0 ? (
                <div className="py-24 text-center text-slate-400 animate-in fade-in duration-500">
                  <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto mb-4 border border-slate-100">
                    <Car className="size-10 opacity-20" />
                  </div>
                  <p className="font-bold text-sm">รถว่างพร้อมใช้ทุกคัน</p>
                  <p className="text-xs mt-1">ยังไม่มีการจองในวันที่เลือก</p>
                </div>
              ) : (
                selectedDayBookings.map((b) => (
                  <div 
                    key={`detail-${b.id}`} 
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group animate-in slide-in-from-right-4 duration-300"
                  >
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <p className="font-extrabold text-slate-900 text-sm truncate">{b.user_name}</p>
                      <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0", STATUS_CONFIG[b.status]?.color)}>
                        {STATUS_CONFIG[b.status]?.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                        <MapPin className="size-3.5 text-slate-400" />
                        <span className="truncate"><b>ปลายทาง:</b> {b.destination}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                        <Car className="size-3.5 text-blue-500" />
                        <span><b>รถคันที่ใช้:</b> <span className="font-bold text-blue-600 font-mono">{b.vehicles?.license_plate || "รอจัดสรร"}</span></span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                        <Clock className="size-3.5 text-slate-400" />
                        <span><b>เวลา:</b> {b.start_time.slice(0,5)} - {b.end_time.slice(0,5)} น.</span>
                      </div>
                    </div>
                    
                    {/* Alert if cross-day */}
                    {b.start_date !== b.end_date && (
                      <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center gap-2 text-[10px] font-bold text-amber-600">
                        <AlertTriangle className="size-3" />
                        จองคร่อมวัน ({b.start_date} ถึง {b.end_date})
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

/**
 * HELPER: ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
 */
function formatDateThai(dateString) {
  if (!dateString) return "-"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("th-TH", {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}