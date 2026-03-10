"use client"

import { useState } from "react"
import { FileText, FileSpreadsheet, Fuel, Route, Car, TrendingDown } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { logEntries, vehicles, monthlyUsageData, fuelExpenseData } from "@/lib/data"

// Per-vehicle summary
const vehicleSummary = vehicles.map((v) => {
  const logs = logEntries.filter((l) => l.vehicleId === v.id)
  const totalDistance = logs.reduce((sum, l) => sum + l.distance, 0)
  const totalFuel = logs.reduce((sum, l) => sum + l.fuelLiters, 0)
  const totalFuelCost = logs.reduce((sum, l) => sum + l.fuelCost, 0)
  const efficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(1) : "-"
  return {
    ...v,
    totalDistance,
    totalFuel,
    totalFuelCost,
    efficiency,
    trips: logs.length,
  }
}).filter((v) => v.trips > 0)

const totalDistance = logEntries.reduce((sum, l) => sum + l.distance, 0)
const totalFuelCost = logEntries.reduce((sum, l) => sum + l.fuelCost, 0)
const totalFuelLiters = logEntries.reduce((sum, l) => sum + l.fuelLiters, 0)
const avgEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(1) : "-"

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

function MonthlyExpenseReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">ค่าใช้จ่ายน้ำมันรายเดือน</CardTitle>
        <CardDescription>แสดงแนวโน้มค่าใช้จ่ายน้ำมัน 6 เดือนล่าสุด</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fuelExpenseData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-foreground)",
                }}
                formatter={(value) => [`${value.toLocaleString()} บาท`, "ค่าน้ำมัน"]}
              />
              <Line type="monotone" dataKey="cost" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ fill: "var(--color-chart-1)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function DistanceReport() {
  const data = vehicleSummary.map((v) => ({
    name: v.licensePlate,
    distance: v.totalDistance,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">ระยะทางรวมแยกตามคัน</CardTitle>
        <CardDescription>เปรียบเทียบระยะทางสะสมของแต่ละคัน</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-foreground)",
                }}
                formatter={(value) => [`${value.toLocaleString()} กม.`, "ระยะทาง"]}
              />
              <Bar dataKey="distance" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function VehicleSummaryTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">สรุปข้อมูลรายคัน</CardTitle>
        <CardDescription>รายงานสรุปการใช้งานและค่าใช้จ่ายรายคัน</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ทะเบียนรถ</TableHead>
              <TableHead>รุ่น</TableHead>
              <TableHead className="text-right">จำนวนเที่ยว</TableHead>
              <TableHead className="text-right">ระยะทาง (กม.)</TableHead>
              <TableHead className="text-right hidden sm:table-cell">น้ำมัน (ลิตร)</TableHead>
              <TableHead className="text-right hidden md:table-cell">ค่าน้ำมัน (บาท)</TableHead>
              <TableHead className="text-right hidden lg:table-cell">อัตราสิ้นเปลือง (กม./ลิตร)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicleSummary.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.licensePlate}</TableCell>
                <TableCell>{v.brand} {v.model}</TableCell>
                <TableCell className="text-right">{v.trips}</TableCell>
                <TableCell className="text-right">{v.totalDistance.toLocaleString()}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">{v.totalFuel}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{v.totalFuelCost.toLocaleString()}</TableCell>
                <TableCell className="text-right hidden lg:table-cell">{v.efficiency}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="รายงาน" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">รายงานและสถิติ</h1>
            <p className="text-sm text-muted-foreground">สรุปข้อมูลการใช้รถและค่าใช้จ่าย</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="mr-2 size-4" />
              Export PDF
            </Button>
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 size-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="py-4">
          <CardContent className="px-4 pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-2">
                <Label className="text-xs">วันที่เริ่มต้น</Label>
                <Input type="date" defaultValue="2026-01-01" className="w-full sm:w-auto" />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">วันที่สิ้นสุด</Label>
                <Input type="date" defaultValue="2026-02-17" className="w-full sm:w-auto" />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">รถ</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกคัน</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.licensePlate}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="sm:ml-2">ดูรายงาน</Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Route className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ระยะทางรวม</p>
                  <p className="text-xl font-bold text-foreground">{totalDistance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">กม.</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                  <Fuel className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ค่าน้ำมันรวม</p>
                  <p className="text-xl font-bold text-foreground">{totalFuelCost.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">บาท</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                  <TrendingDown className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">อัตราสิ้นเปลือง</p>
                  <p className="text-xl font-bold text-foreground">{avgEfficiency} <span className="text-sm font-normal text-muted-foreground">กม./ลิตร</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-0 py-4">
            <CardContent className="px-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Car className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">จำนวนเที่ยว</p>
                  <p className="text-xl font-bold text-foreground">{logEntries.length} <span className="text-sm font-normal text-muted-foreground">เที่ยว</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="expense">
          <TabsList>
            <TabsTrigger value="expense">ค่าใช้จ่ายรายเดือน</TabsTrigger>
            <TabsTrigger value="distance">ระยะทาง</TabsTrigger>
            <TabsTrigger value="summary">สรุปต่อคัน</TabsTrigger>
          </TabsList>
          <TabsContent value="expense" className="mt-4">
            <MonthlyExpenseReport />
          </TabsContent>
          <TabsContent value="distance" className="mt-4">
            <DistanceReport />
          </TabsContent>
          <TabsContent value="summary" className="mt-4">
            <VehicleSummaryTable />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
