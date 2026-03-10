"use client"

import { useState } from "react"
import { Plus, Search, Eye } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { bookings } from "@/lib/data"

const statusMap = {
  pending: { label: "รอดำเนินการ", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  approved: { label: "อนุมัติ", className: "bg-success/15 text-success border-success/30" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-destructive/15 text-destructive border-destructive/30" },
}

function BookingForm({ onClose }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>วันที่</Label>
          <Input type="date" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>จำนวนผู้โดยสาร</Label>
          <Input type="number" min={1} placeholder="1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>เวลาเริ่มต้น</Label>
          <Input type="time" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>เวลาสิ้นสุด</Label>
          <Input type="time" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>สถานที่ปลายทาง</Label>
        <Input placeholder="ระบุสถานที่ปลายทาง" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>วัตถุประสงค์</Label>
        <Textarea placeholder="ระบุวัตถุประสงค์การใช้รถ" rows={3} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button onClick={onClose}>ส่งคำขอ</Button>
      </div>
    </div>
  )
}

function BookingDetail({ bookingId, onClose }) {
  const booking = bookings.find((b) => b.id === bookingId)
  if (!booking) return null

  const status = statusMap[booking.status]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">รายละเอียดคำขอ</h3>
        <Badge variant="outline" className={status.className}>{status.label}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <div>
          <p className="text-xs text-muted-foreground">ผู้ขอใช้รถ</p>
          <p className="text-sm font-medium text-foreground">{booking.userName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">หน่วยงาน</p>
          <p className="text-sm font-medium text-foreground">{booking.department}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">วันที่</p>
          <p className="text-sm font-medium text-foreground">{booking.date}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">เวลา</p>
          <p className="text-sm font-medium text-foreground">{booking.startTime} - {booking.endTime}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">สถานที่</p>
          <p className="text-sm font-medium text-foreground">{booking.destination}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ผู้โดยสาร</p>
          <p className="text-sm font-medium text-foreground">{booking.passengers} คน</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">วัตถุประสงค์</p>
          <p className="text-sm font-medium text-foreground">{booking.purpose}</p>
        </div>
        {booking.vehiclePlate && (
          <div>
            <p className="text-xs text-muted-foreground">รถที่จัดสรร</p>
            <p className="text-sm font-medium text-foreground">{booking.vehiclePlate}</p>
          </div>
        )}
        {booking.driverName && (
          <div>
            <p className="text-xs text-muted-foreground">พนักงานขับรถ</p>
            <p className="text-sm font-medium text-foreground">{booking.driverName}</p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>ปิด</Button>
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.userName.includes(search) ||
      b.destination.includes(search) ||
      b.department.includes(search)
    const matchesStatus = statusFilter === "all" || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <PageHeader title="การจองรถ" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">การจองรถ</h1>
            <p className="text-sm text-muted-foreground">รายการคำขอใช้รถทั้งหมด</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 size-4" />จองรถ</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>แบบฟอร์มจองรถ</DialogTitle>
              </DialogHeader>
              <BookingForm onClose={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาผู้ขอ, สถานที่, หน่วยงาน..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="approved">อนุมัติ</SelectItem>
                  <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ขอ</TableHead>
                  <TableHead className="hidden sm:table-cell">หน่วยงาน</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead className="hidden md:table-cell">เวลา</TableHead>
                  <TableHead className="hidden lg:table-cell">สถานที่</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => {
                  const status = statusMap[booking.status]
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.userName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{booking.department}</TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell className="hidden md:table-cell">{booking.startTime} - {booking.endTime}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{booking.destination}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={detailId === booking.id} onOpenChange={(open) => setDetailId(open ? booking.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <Eye className="size-4" />
                              <span className="sr-only">ดูรายละเอียด</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[520px]">
                            <DialogHeader>
                              <DialogTitle>รายละเอียดการจอง</DialogTitle>
                            </DialogHeader>
                            <BookingDetail bookingId={booking.id} onClose={() => setDetailId(null)} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
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
