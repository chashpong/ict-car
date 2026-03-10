"use client"

import { useState } from "react"
import { Search, FileImage, MapPin, Camera, Play, Square } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { logEntries, bookings } from "@/lib/data"

const approvedBookings = bookings.filter((b) => b.status === "approved")

function DriverTodayJobs() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">งานวันนี้</h2>
        <p className="text-sm text-muted-foreground">รายการเดินทางที่ได้รับมอบหมาย</p>
      </div>
      {approvedBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">ไม่มีงานวันนี้</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {approvedBookings.map((booking) => (
            <Card key={booking.id} className="transition-colors hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{booking.userName}</CardTitle>
                  <Badge variant="outline" className="bg-success/15 text-success border-success/30">อนุมัติแล้ว</Badge>
                </div>
                <CardDescription>{booking.department}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span className="text-foreground">{booking.destination}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{booking.date}</span>
                  <span className="font-medium text-foreground">{booking.startTime} - {booking.endTime}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">รถ: {booking.vehiclePlate}</span>
                  <Button size="sm">
                    <Play className="mr-1 size-3" />
                    เริ่มงาน
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function TripRecordForm() {
  const [isStarted, setIsStarted] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">บันทึกการเดินทาง</h2>
        <p className="text-sm text-muted-foreground">บันทึกเลขไมล์และข้อมูลน้ำมัน</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {isStarted ? "กำลังเดินทาง..." : "เริ่มต้นเดินทาง"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!isStarted ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>เลือกรถ</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกรถ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v2">คง 5678 - Toyota Camry</SelectItem>
                      <SelectItem value="v6">ฎฏ 2345 - Nissan Navara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>เลขไมล์เริ่มต้น</Label>
                  <Input type="number" placeholder="กรอกเลขไมล์" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>ถ่ายรูปเลขไมล์</Label>
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/30">
                  <Button variant="ghost" size="sm">
                    <Camera className="mr-2 size-4" />
                    ถ่ายรูป / อัพโหลด
                  </Button>
                </div>
              </div>
              <Button onClick={() => setIsStarted(true)}>
                <Play className="mr-2 size-4" />
                เริ่มเดินทาง
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                <p className="text-sm font-medium text-success">กำลังเดินทาง</p>
                <p className="text-xs text-muted-foreground">เริ่มต้น: 08:00 | เลขไมล์: 67,500</p>
              </div>

              <Separator />
              <h4 className="text-sm font-medium text-foreground">เติมน้ำมัน (ถ้ามี)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>จำนวนลิตร</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>จำนวนเงิน (บาท)</Label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>ถ่ายรูปใบเสร็จ</Label>
                <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                  <Button variant="ghost" size="sm">
                    <Camera className="mr-2 size-4" />
                    ถ่ายรูป / อัพโหลด
                  </Button>
                </div>
              </div>

              <Separator />
              <h4 className="text-sm font-medium text-foreground">จบการเดินทาง</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>เลขไมล์ปลายทาง</Label>
                  <Input type="number" placeholder="กรอกเลขไมล์" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>ระยะทาง (กม.)</Label>
                  <Input type="number" placeholder="คำนวณอัตโนมัติ" disabled />
                </div>
              </div>
              <Button variant="destructive" onClick={() => setIsStarted(false)}>
                <Square className="mr-2 size-4" />
                จบการเดินทาง
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LogbookTable() {
  const [search, setSearch] = useState("")

  const filtered = logEntries.filter(
    (l) => l.vehiclePlate.includes(search) || l.driverName.includes(search)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาทะเบียน, ชื่อคนขับ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>รถ</TableHead>
                <TableHead className="hidden sm:table-cell">คนขับ</TableHead>
                <TableHead className="hidden md:table-cell">ไมล์เริ่ม</TableHead>
                <TableHead className="hidden md:table-cell">ไมล์จบ</TableHead>
                <TableHead>ระยะทาง</TableHead>
                <TableHead className="hidden lg:table-cell">น้ำมัน</TableHead>
                <TableHead className="hidden lg:table-cell">ค่าน้ำมัน</TableHead>
                <TableHead>ใบเสร็จ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.date}</TableCell>
                  <TableCell className="font-medium">{log.vehiclePlate}</TableCell>
                  <TableCell className="hidden sm:table-cell">{log.driverName}</TableCell>
                  <TableCell className="hidden md:table-cell">{log.startMileage.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">{log.endMileage.toLocaleString()}</TableCell>
                  <TableCell>{log.distance} กม.</TableCell>
                  <TableCell className="hidden lg:table-cell">{log.fuelLiters} ลิตร</TableCell>
                  <TableCell className="hidden lg:table-cell">{log.fuelCost.toLocaleString()} บาท</TableCell>
                  <TableCell>
                    {log.hasReceipt ? (
                      <Button variant="ghost" size="icon" className="size-8">
                        <FileImage className="size-4 text-primary" />
                        <span className="sr-only">ดูใบเสร็จ</span>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LogbookPage() {
  return (
    <>
      <PageHeader title="สมุดบันทึกการใช้รถ" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">สมุดบันทึกการใช้รถ</h1>
          <p className="text-sm text-muted-foreground">Digital Logbook - บันทึกข้อมูลการเดินทาง</p>
        </div>

        <Tabs defaultValue="logbook" className="w-full">
          <TabsList>
            <TabsTrigger value="logbook">ประวัติบันทึก</TabsTrigger>
            <TabsTrigger value="today">งานวันนี้</TabsTrigger>
            <TabsTrigger value="record">บันทึกเดินทาง</TabsTrigger>
          </TabsList>
          <TabsContent value="logbook" className="mt-4">
            <LogbookTable />
          </TabsContent>
          <TabsContent value="today" className="mt-4">
            <DriverTodayJobs />
          </TabsContent>
          <TabsContent value="record" className="mt-4">
            <TripRecordForm />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
