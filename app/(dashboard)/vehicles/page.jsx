"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Eye, Pencil } from "lucide-react"
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

import { supabase } from "@/lib/supabase"

const statusMap = {
  available: { label: "ว่าง", className: "bg-success/15 text-success border-success/30" },
  "in-use": { label: "กำลังใช้งาน", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  maintenance: { label: "ซ่อมบำรุง", className: "bg-destructive/15 text-destructive border-destructive/30" },
}

function VehicleForm({ vehicle, onClose, onSave }) {

  const [formData, setFormData] = useState({
    license_plate: vehicle?.license_plate || "",
    brand: vehicle?.brand || "",
    model: vehicle?.model || "",
    year: vehicle?.year || "",
    type: vehicle?.type || "",
    status: vehicle?.status || "available"
  })

  return (
    
    <div className="flex flex-col gap-4">

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>ทะเบียนรถ</Label>
          <Input
            value={formData.license_plate}
            onChange={(e)=>setFormData({...formData,license_plate:e.target.value})}
            placeholder="กข 1234"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>ยี่ห้อ</Label>
          <Input
            value={formData.brand}
            onChange={(e)=>setFormData({...formData,brand:e.target.value})}
            placeholder="Toyota"
          />
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">

        <div className="flex flex-col gap-2">
          <Label>รุ่น</Label>
          <Input
            value={formData.model}
            onChange={(e)=>setFormData({...formData,model:e.target.value})}
            placeholder="Hilux Revo"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>ปี</Label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e)=>setFormData({...formData,year:e.target.value})}
            placeholder="2024"
          />
        </div>

      </div>


      {/* ADD START */}

      <div className="grid grid-cols-2 gap-4">

        <div className="flex flex-col gap-2">
          <Label>ประเภท</Label>

          <Select
            value={formData.type}
            onValueChange={(value)=>setFormData({...formData,type:value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="กระบะ">กระบะ</SelectItem>
              <SelectItem value="เก๋ง">เก๋ง</SelectItem>
              <SelectItem value="อเนกประสงค์">อเนกประสงค์</SelectItem>
              <SelectItem value="ตู้">ตู้</SelectItem>
            </SelectContent>

          </Select>
        </div>


        <div className="flex flex-col gap-2">
          <Label>สถานะ</Label>

          <Select
            value={formData.status}
            onValueChange={(value)=>setFormData({...formData,status:value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกสถานะ" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="available">ว่าง</SelectItem>
              <SelectItem value="in-use">กำลังใช้งาน</SelectItem>
              <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
            </SelectContent>

          </Select>
        </div>

      </div>

      {/* ADD END */}


      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>

        <Button onClick={()=>onSave(formData)}>
          {vehicle ? "บันทึก" : "เพิ่มรถ"}
        </Button>

      </div>

    </div>
  )
}

export default function VehiclesPage() {

  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState(undefined)

  useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")

    if (!error) {
      setVehicles(data)
    }

  }

  // ADD START
  async function saveVehicle(data) {

    if(editVehicle){

      await supabase
      .from("vehicles")
      .update(data)
      .eq("id",editVehicle.id)

    }else{

      await supabase
      .from("vehicles")
      .insert([data])

    }

    fetchVehicles()
    setDialogOpen(false)

  }
  // ADD END


  const filtered = vehicles.filter((v) => {

    const matchesSearch =
      v.license_plate?.includes(search) ||
      v.brand?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || v.status === statusFilter

    return matchesSearch && matchesStatus

  })

  return (
    <>
      <PageHeader title="จัดการยานพาหนะ" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-foreground">จัดการยานพาหนะ</h1>
            <p className="text-sm text-muted-foreground">
              รายการรถทั้งหมด {vehicles.length} คัน
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditVehicle(undefined)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                เพิ่มรถ
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">

              <DialogHeader>
                <DialogTitle>
                  {editVehicle ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่"}
                </DialogTitle>
              </DialogHeader>

              <VehicleForm
                vehicle={editVehicle}
                onClose={() => setDialogOpen(false)}
                onSave={saveVehicle} // ADD
              />

            </DialogContent>
          </Dialog>

        </div>

        <Card>

          <CardHeader className="pb-3">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่น..."
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
                  <SelectItem value="available">ว่าง</SelectItem>
                  <SelectItem value="in-use">กำลังใช้งาน</SelectItem>
                  <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
                </SelectContent>

              </Select>

            </div>

          </CardHeader>

          <CardContent className="px-0">

            <Table>

              <TableHeader>
                <TableRow>
                  <TableHead>ทะเบียนรถ</TableHead>
                  <TableHead>ยี่ห้อ/รุ่น</TableHead>
                  <TableHead className="hidden md:table-cell">ประเภท</TableHead>
                  <TableHead className="hidden sm:table-cell">ปี</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="hidden lg:table-cell">เลขไมล์ล่าสุด</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>

                {filtered.map((vehicle) => {

                  const status = statusMap[vehicle.status]

                  return (

                    <TableRow key={vehicle.id}>

                      <TableCell className="font-medium">
                        {vehicle.license_plate}
                      </TableCell>

                      <TableCell>
                        {vehicle.brand} {vehicle.model}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        {vehicle.type}
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {vehicle.year}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={status?.className}>
                          {status?.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        {vehicle.last_mileage || 0} กม.
                      </TableCell>

                      <TableCell className="text-right">

                        <div className="flex items-center justify-end gap-1">

                          <Button variant="ghost" size="icon" className="size-8">
                            <Eye className="size-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                              setEditVehicle(vehicle)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>

                        </div>

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