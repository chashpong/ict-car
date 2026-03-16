"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Wrench, CalendarClock, Camera } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogDescription,
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
import { supabase } from "@/lib/supabase"

const repairTypeOptions = [
  "เปลี่ยนถ่ายน้ำมันเครื่อง",
  "ซ่อมระบบเบรก",
  "เปลี่ยนยาง",
  "ตรวจเช็คระยะ",
  "ซ่อมแอร์",
  "อื่นๆ",
]

function AddMaintenanceForm({ onClose, onSave, vehicles }) {
  const [formData, setFormData] = useState({
    vehicle_id: "",
    vehicle_plate: "",
    type: "",
    customType: "",
    date: "",
    cost: "",
    next_due: "",
    description: "",
    receiptFile: null,
  })

  const handleSubmit = () => {
    const finalType =
      formData.type === "other" ? formData.customType.trim() : formData.type

    if (!formData.vehicle_id) {
      alert("กรุณาเลือกรถ")
      return
    }

    if (!finalType) {
      alert("กรุณาระบุประเภทการซ่อม")
      return
    }

    if (!formData.date) {
      alert("กรุณาเลือกวันที่")
      return
    }

    onSave({
      vehicle_id: formData.vehicle_id,
      vehicle_plate: formData.vehicle_plate,
      type: finalType,
      date: formData.date,
      cost: Number(formData.cost || 0),
      next_due: formData.next_due || null,
      description: formData.description,
      receiptFile: formData.receiptFile,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>เลือกรถ</Label>
        <Select
          value={formData.vehicle_id}
          onValueChange={(value) => {
            const selectedVehicle = vehicles.find((v) => String(v.id) === String(value))
            setFormData({
              ...formData,
              vehicle_id: value,
              vehicle_plate: selectedVehicle?.license_plate || selectedVehicle?.licensePlate || "",
            })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกรถ" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {(v.license_plate || v.licensePlate)} - {v.brand} {v.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>ประเภทการซ่อม</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                type: value,
                customType: value === "other" ? formData.customType : "",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="เปลี่ยนถ่ายน้ำมันเครื่อง">เปลี่ยนถ่ายน้ำมันเครื่อง</SelectItem>
              <SelectItem value="ซ่อมระบบเบรก">ซ่อมระบบเบรก</SelectItem>
              <SelectItem value="เปลี่ยนยาง">เปลี่ยนยาง</SelectItem>
              <SelectItem value="ตรวจเช็คระยะ">ตรวจเช็คระยะ</SelectItem>
              <SelectItem value="ซ่อมแอร์">ซ่อมแอร์</SelectItem>
              <SelectItem value="other">อื่นๆ</SelectItem>
            </SelectContent>
          </Select>

          {formData.type === "other" && (
            <Input
              className="mt-2"
              placeholder="ระบุประเภทการซ่อม"
              value={formData.customType}
              onChange={(e) =>
                setFormData({ ...formData, customType: e.target.value })
              }
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>วันที่</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>ค่าใช้จ่าย (บาท)</Label>
          <Input
            type="number"
            placeholder="0"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>กำหนดครั้งถัดไป</Label>
          <Input
            type="date"
            value={formData.next_due}
            onChange={(e) => setFormData({ ...formData, next_due: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>รายละเอียด</Label>
        <Textarea
          placeholder="รายละเอียดการซ่อมบำรุง"
          rows={3}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>แนบใบเสร็จ</Label>
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) =>
            setFormData({
              ...formData,
              receiptFile: e.target.files?.[0] || null,
            })
          }
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit}>บันทึก</Button>
      </div>
    </div>
  )
}
export default function MaintenancePage() {
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      const [{ data: maintenanceData, error: maintenanceError }, { data: vehiclesData, error: vehiclesError }] =
        await Promise.all([
          supabase.from("maintenance").select("*").order("date", { ascending: false }),
          supabase.from("vehicles").select("*").order("license_plate", { ascending: true }),
        ])

      if (maintenanceError) {
        console.error(maintenanceError)
      }

      if (vehiclesError) {
        console.error(vehiclesError)
      }

      setMaintenanceRecords(maintenanceData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return maintenanceRecords.filter((m) => {
      const plate = m.vehicle_plate || ""
      const type = m.type || ""
      const description = m.description || ""

      return (
        plate.toLowerCase().includes(search.toLowerCase()) ||
        type.toLowerCase().includes(search.toLowerCase()) ||
        description.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [maintenanceRecords, search])

  const totalCost = useMemo(() => {
    return maintenanceRecords.reduce((sum, m) => sum + Number(m.cost || 0), 0)
  }, [maintenanceRecords])

  const maintenanceVehicleCount = useMemo(() => {
    return vehicles.filter((v) => v.status === "maintenance").length
  }, [vehicles])

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
              <Button>
                <Plus className="mr-2 size-4" />
                เพิ่มรายการซ่อม
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>บันทึกการซ่อมบำรุง</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลการซ่อมบำรุงและแนบใบเสร็จ
                </DialogDescription>
              </DialogHeader>

              <AddMaintenanceForm
                vehicles={vehicles}
                onClose={() => setDialogOpen(false)}
                onSaved={fetchData}
              />
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
                  <p className="text-xl font-bold text-foreground">
                    {maintenanceRecords.length}{" "}
                    <span className="text-sm font-normal text-muted-foreground">รายการ</span>
                  </p>
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
                  <p className="text-xl font-bold text-foreground">
                    {maintenanceVehicleCount}{" "}
                    <span className="text-sm font-normal text-muted-foreground">คัน</span>
                  </p>
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
                  <p className="text-xl font-bold text-foreground">
                    {totalCost.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-muted-foreground">บาท</span>
                  </p>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      ไม่พบข้อมูลการซ่อมบำรุง
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.vehicle_plate || "-"}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{record.type || "-"}</Badge>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {record.date || "-"}
                      </TableCell>

                      <TableCell>
                        {Number(record.cost || 0).toLocaleString()} บาท
                      </TableCell>

                      <TableCell className="hidden max-w-[220px] truncate text-muted-foreground md:table-cell">
                        {record.description || "-"}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        {record.next_due || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}