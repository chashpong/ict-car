"use client"

import { useState } from "react"
import { Plus, Search, Wrench, CalendarClock, Camera } from "lucide-react"
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
import { maintenanceRecords, vehicles } from "@/lib/data"

function AddMaintenanceForm({ onClose }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>เลือกรถ</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="เลือกรถ" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.licensePlate} - {v.brand} {v.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>ประเภทการซ่อม</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oil">เปลี่ยนถ่ายน้ำมันเครื่อง</SelectItem>
              <SelectItem value="brake">ซ่อมระบบเบรก</SelectItem>
              <SelectItem value="tire">เปลี่ยนยาง</SelectItem>
              <SelectItem value="check">ตรวจเช็คระยะ</SelectItem>
              <SelectItem value="air">ซ่อมแอร์</SelectItem>
              <SelectItem value="other">อื่นๆ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>วันที่</Label>
          <Input type="date" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>ค่าใช้จ่าย (บาท)</Label>
          <Input type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>กำหนดครั้งถัดไป</Label>
          <Input type="date" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>รายละเอียด</Label>
        <Textarea placeholder="รายละเอียดการซ่อมบำรุง" rows={3} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>แนบใบเสร็จ</Label>
        <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/30">
          <Button variant="ghost" size="sm">
            <Camera className="mr-2 size-4" />
            อัพโหลดไฟล์
          </Button>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button onClick={onClose}>บันทึก</Button>
      </div>
    </div>
  )
}

export default function MaintenancePage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = maintenanceRecords.filter(
    (m) => m.vehiclePlate.includes(search) || m.type.includes(search)
  )

  const totalCost = maintenanceRecords.reduce((sum, m) => sum + m.cost, 0)

  return (
    <>
      <PageHeader title="ซ่อมบำรุง" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ระบบซ่อมบำรุง</h1>
            <p className="text-sm text-muted-foreground">บันทึกประวัติการซ่อมบำรุงยานพาหนะ</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 size-4" />เพิ่มรายการซ่อม</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>บันทึกการซ่อมบำรุง</DialogTitle>
              </DialogHeader>
              <AddMaintenanceForm onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wrench className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">รายการซ่อมทั้งหมด</p>
                  <p className="text-xl font-bold text-foreground">{maintenanceRecords.length} <span className="text-sm font-normal text-muted-foreground">รายการ</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">รถรอซ่อม</p>
                  <p className="text-xl font-bold text-foreground">{vehicles.filter(v => v.status === "maintenance").length} <span className="text-sm font-normal text-muted-foreground">คัน</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                  <span className="text-sm font-bold">฿</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ค่าใช้จ่ายรวม</p>
                  <p className="text-xl font-bold text-foreground">{totalCost.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">บาท</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาทะเบียน, ประเภทซ่อม..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รถ</TableHead>
                  <TableHead>ประเภทซ่อม</TableHead>
                  <TableHead className="hidden sm:table-cell">วันที่</TableHead>
                  <TableHead>ค่าใช้จ่าย</TableHead>
                  <TableHead className="hidden md:table-cell">รายละเอียด</TableHead>
                  <TableHead className="hidden lg:table-cell">ครบกำหนดถัดไป</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.vehiclePlate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{record.date}</TableCell>
                    <TableCell>{record.cost.toLocaleString()} บาท</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">{record.description}</TableCell>
                    <TableCell className="hidden lg:table-cell">{record.nextDue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
