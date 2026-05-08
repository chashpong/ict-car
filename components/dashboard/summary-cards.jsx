"use client"

import { Car, CheckCircle2, AlertCircle, Fuel, Wrench } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function SummaryCards({ vehicles = [], maintenanceRecords = [], logEntries = [] }) {

  const totalVehicles = vehicles.length
  const availableVehicles = vehicles.filter((v) => v.status === "available").length
  const inUseVehicles = vehicles.filter((v) => v.status === "in-use").length
  const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length

  const monthlyFuelCost = logEntries.reduce((sum, l) => sum + (l.fuel_cost || 0), 0)

  const cards = [
    {
      title: "รถทั้งหมด",
      value: totalVehicles,
      unit: "คัน",
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "รถว่าง",
      value: availableVehicles,
      unit: "คัน",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "กำลังใช้งาน",
      value: inUseVehicles,
      unit: "คัน",
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "ค่าน้ำมันเดือนนี้",
      value: monthlyFuelCost.toLocaleString('th-TH'),
      unit: "บาท",
      icon: Fuel,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
    {
      title: "รอซ่อมบำรุง",
      value: maintenanceVehicles,
      unit: "คัน",
      icon: Wrench,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-slate-500">{card.title}</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {card.value}
                  <span className="ml-1.5 text-sm font-medium text-slate-500">
                    {card.unit}
                  </span>
                </p>
              </div>
              <div className={`flex size-12 items-center justify-center rounded-xl ${card.bgColor} ${card.color}`}>
                <card.icon className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}