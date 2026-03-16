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
      color: "bg-primary/10 text-primary",
    },
    {
      title: "รถว่าง",
      value: availableVehicles,
      unit: "คัน",
      icon: CheckCircle2,
      color: "bg-success/10 text-success",
    },
    {
      title: "กำลังใช้งาน",
      value: inUseVehicles,
      unit: "คัน",
      icon: AlertCircle,
      color: "bg-warning/10 text-warning",
    },
    {
      title: "ค่าน้ำมันเดือนนี้",
      value: monthlyFuelCost.toLocaleString(),
      unit: "บาท",
      icon: Fuel,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "รอซ่อมบำรุง",
      value: maintenanceVehicles,
      unit: "คัน",
      icon: Wrench,
      color: "bg-destructive/10 text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="gap-0 py-4">
          <CardContent className="px-4 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {card.value}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {card.unit}
                  </span>
                </p>
              </div>
              <div className={`flex size-10 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}