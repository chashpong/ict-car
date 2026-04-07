"use client"

import { useState, useEffect } from "react"
import { MapPin, Play, FileText, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"

export default function TodayJobsPage() {
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTodayBookings()
  }, [])

  // ดึงข้อมูลงานวันนี้
  async function fetchTodayBookings() {
    const { data } = await supabase
      .from("bookings")
      .select(`
        id, user_name, department, destination, start_date, end_date, 
        start_time, end_time, vehicle_id, driver_id,
        vehicles:vehicle_id (license_plate),
        drivers:driver_id (name)
      `)
      .in("status", ["approved", "started"])
    setBookings(data || [])
  }

  // เริ่มงาน
  async function handleStartTrip(booking) {
    setSelectedBooking(booking)
    setLoading(true)
    const start = new Date(booking.start_date)
    const end = booking.end_date ? new Date(booking.end_date) : new Date(booking.start_date)
    let current = new Date(start)
    let temp = []
    while (current <= end) {
      temp.push({
        date: current.toISOString().slice(0, 10),
        start_mileage: "", end_mileage: "", fuel_liter: "", fuel_cost: "", note: ""
      })
      current.setDate(current.getDate() + 1)
    }
    setDays(temp)
    setIsRecording(true)
    await supabase.from("bookings").update({ status: "started" }).eq("id", booking.id)
    setLoading(false)
  }

  // จบงาน
  async function handleFinishTrip() {
    setLoading(true)
    const inserts = days.map(d => ({
      booking_id: selectedBooking.id,
      vehicle_id: selectedBooking.vehicle_id,
      driver_id: selectedBooking.driver_id,
      start_mileage: d.start_mileage,
      end_mileage: d.end_mileage,
      distance: Number(d.end_mileage) - Number(d.start_mileage),
      fuel_liter: d.fuel_liter || 0,
      fuel_cost: d.fuel_cost || 0,
      note: d.note || null,
      status: "completed",
      created_at: new Date(d.date).toISOString()
    }))

    const { error } = await supabase.from("logbooks").insert(inserts)
    if (!error) {
      await supabase.from("bookings").update({ status: "completed" }).eq("id", selectedBooking.id)
      alert("บันทึกสำเร็จ")
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 font-sarabun">
      <PageHeader title="งานวันนี้" description="รายการภารกิจที่ได้รับมอบหมายประจำวันนี้" />

      {!isRecording ? (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.length === 0 ? (
            <Card className="col-span-full py-12 text-center text-muted-foreground">ไม่มีงานวันนี้</Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{booking.user_name}</CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">อนุมัติแล้ว</Badge>
                  </div>
                  <CardDescription>{booking.department}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="size-4" /> {booking.destination}
                  </div>
                  <div className="text-sm font-medium">{booking.start_date} | {booking.start_time} - {booking.end_time}</div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      รถ: {booking.vehicles?.license_plate} <br /> คนขับ: {booking.drivers?.name}
                    </div>
                    <Button size="sm" onClick={() => handleStartTrip(booking)}>
                      <Play className="mr-1 size-3" /> เริ่มงาน
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle>บันทึกการเดินทาง: {selectedBooking.destination}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {days.map((d, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3 bg-slate-50/50">
                <p className="font-bold text-blue-700">📅 วันที่ {d.date}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>ไมล์เริ่ม</Label><Input value={d.start_mileage} onChange={e => { const n = [...days]; n[i].start_mileage = e.target.value; setDays(n) }} /></div>
                  <div className="space-y-1"><Label>ไมล์จบ</Label><Input value={d.end_mileage} onChange={e => { const n = [...days]; n[i].end_mileage = e.target.value; setDays(n) }} /></div>
                  <div className="space-y-1"><Label>น้ำมัน (ลิตร)</Label><Input value={d.fuel_liter} onChange={e => { const n = [...days]; n[i].fuel_liter = e.target.value; setDays(n) }} /></div>
                  <div className="space-y-1"><Label>ค่าน้ำมัน (บาท)</Label><Input value={d.fuel_cost} onChange={e => { const n = [...days]; n[i].fuel_cost = e.target.value; setDays(n) }} /></div>
                </div>
                <Input placeholder="หมายเหตุ" value={d.note} onChange={e => { const n = [...days]; n[i].note = e.target.value; setDays(n) }} />
              </div>
            ))}
            <Button variant="destructive" className="w-full h-12 text-lg" onClick={handleFinishTrip} disabled={loading}>จบการเดินทางและบันทึกข้อมูล</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}