"use client"

import { useState } from "react"
import { Check, X, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { bookings, vehicles, drivers } from "@/lib/data"

const pendingBookings = bookings.filter((b) => b.status === "pending")
const availableVehicles = vehicles.filter((v) => v.status === "available")

function ApprovalDialog({ booking, onClose }) {
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [selectedDriver, setSelectedDriver] = useState("")

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h4 className="mb-3 text-sm font-semibold text-foreground">ข้อมูลผู้ขอ</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">ผู้ขอ</p>
            <p className="text-sm font-medium text-foreground">{booking.userName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">หน่วยงาน</p>
            <p className="text-sm font-medium text-foreground">{booking.department}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">วันที่/เวลา</p>
            <p className="text-sm font-medium text-foreground">{booking.date} ({booking.startTime}-{booking.endTime})</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ผู้โดยสาร</p>
            <p className="text-sm font-medium text-foreground">{booking.passengers} คน</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">สถานที่</p>
            <p className="text-sm font-medium text-foreground">{booking.destination}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">วัตถุประสงค์</p>
            <p className="text-sm font-medium text-foreground">{booking.purpose}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-semibold text-foreground">จัดสรรรถและพนักงานขับ</h4>
        <div className="flex flex-col gap-2">
          <Label>เลือกรถ</Label>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกรถที่จะจัดสรร" />
            </SelectTrigger>
            <SelectContent>
              {availableVehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.licensePlate} - {v.brand} {v.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>เลือกพนักงานขับรถ</Label>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกพนักงานขับรถ" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} ({d.phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={onClose}>
          <X className="mr-1 size-4" />
          ไม่อนุมัติ
        </Button>
        <Button className="bg-success text-success-foreground hover:bg-success/90" onClick={onClose}>
          <Check className="mr-1 size-4" />
          อนุมัติ
        </Button>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const [selectedBooking, setSelectedBooking] = useState(null)

  return (
    <>
      <PageHeader title="อนุมัติคำขอ" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">อนุมัติคำขอใช้รถ</h1>
          <p className="text-sm text-muted-foreground">
            คำขอที่รอดำเนินการ {pendingBookings.length} รายการ
          </p>
        </div>

        {pendingBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">ไม่มีคำขอที่รอดำเนินการ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingBookings.map((booking) => (
              <Card key={booking.id} className="transition-colors hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{booking.userName}</p>
                          <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/30">
                            รอดำเนินการ
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{booking.department}</p>
                      </div>
                      <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
                        <p className="text-foreground">{booking.destination}</p>
                        <p className="text-muted-foreground">{booking.date} | {booking.startTime}-{booking.endTime}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-4 size-8"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <ChevronRight className="size-4" />
                      <span className="sr-only">ดูรายละเอียด</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>พิจารณาคำขอใช้รถ</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <ApprovalDialog booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
