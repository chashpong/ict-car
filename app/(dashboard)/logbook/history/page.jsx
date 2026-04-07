"use client"

import { useState, useEffect } from "react"
import { Search, FileImage } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function LogHistoryPage() {
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    const { data } = await supabase
      .from("logbooks")
      .select(`
        id, start_mileage, end_mileage, distance, fuel_liter, fuel_cost, receipt_image, created_at,
        vehicles:vehicle_id (license_plate),
        drivers:driver_id (name)
      `)
      .order("created_at", { ascending: false })

    const formatted = data?.map((l) => ({
      id: l.id,
      date: new Date(l.created_at).toLocaleDateString(),
      vehicle_plate: l.vehicles?.license_plate,
      driver_name: l.drivers?.name,
      start_mileage: l.start_mileage,
      end_mileage: l.end_mileage,
      distance: l.distance,
      fuel_liters: l.fuel_liter,
      fuel_cost: l.fuel_cost,
      receipt_url: l.receipt_image
    }))
    setLogs(formatted || [])
  }

  const filteredLogs = logs.filter(l => 
    l.vehicle_plate?.toLowerCase().includes(search.toLowerCase()) ||
    l.driver_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 font-sarabun">
      <PageHeader title="ประวัติการใช้รถ" description="ตรวจสอบข้อมูลการใช้รถย้อนหลังทั้งหมด" />

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input 
          placeholder="ค้นหาทะเบียน หรือชื่อคนขับ..." 
          className="pl-9 border-slate-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="rounded-md border-none overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-bold">วันที่</TableHead>
                  <TableHead className="font-bold">รถ</TableHead>
                  <TableHead className="font-bold">คนขับ</TableHead>
                  <TableHead className="font-bold text-center">ไมล์เริ่ม</TableHead>
                  <TableHead className="font-bold text-center">ไมล์จบ</TableHead>
                  <TableHead className="font-bold text-center">ระยะทาง</TableHead>
                  <TableHead className="font-bold text-center">น้ำมัน (ลิตร)</TableHead>
                  <TableHead className="font-bold text-center">ค่าน้ำมัน</TableHead>
                  <TableHead className="font-bold text-center">ใบเสร็จ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50">
                    <TableCell>{log.date}</TableCell>
                    <TableCell className="font-medium text-slate-900">{log.vehicle_plate}</TableCell>
                    <TableCell>{log.driver_name}</TableCell>
                    <TableCell className="text-center">{log.start_mileage}</TableCell>
                    <TableCell className="text-center">{log.end_mileage}</TableCell>
                    <TableCell className="text-center font-bold text-slate-700">{log.distance} กม.</TableCell>
                    <TableCell className="text-center">{log.fuel_liters}</TableCell>
                    <TableCell className="text-center">{log.fuel_cost} บ.</TableCell>
                    <TableCell className="text-center">
                      {log.receipt_url ? (
                        <Button variant="ghost" size="icon"><FileImage className="size-4 text-blue-600" /></Button>
                      ) : <span className="text-xs text-muted-foreground">-</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}