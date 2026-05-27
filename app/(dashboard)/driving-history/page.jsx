"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Loader2,
  History,
  Car,
  Fuel,
} from "lucide-react"

export default function MyTripsPage() {
  const { user } = useAuth()

  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // หา driver profile
        const { data: driverData, error: driverError } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (driverError) {
          throw driverError
        }

        // ถ้า user ไม่ใช่คนขับ
        if (!driverData) {
          setHistory([])
          return
        }

        // โหลดประวัติ
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            destination,
            start_date,
            end_date,
            status,
            vehicles (
              license_plate
            ),
            fuel_expenses (
              fuel_cost,
              fuel_liter,
              receipt_image
            )
          `)
          .eq("driver_id", driverData.id)
          .eq("status", "completed")
          .order("end_date", { ascending: false })

        if (error) {
          throw error
        }

        setHistory(data || [])

      } catch (err) {
        console.error("Load history error:", err)
        setError("ไม่สามารถโหลดข้อมูลได้")
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [user])

  // format วันที่
  const formatDate = (date) => {
    if (!date) return "-"

    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-8"
      style={{
        backgroundImage: "url('/images/image.png')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 drop-shadow-lg">
          <History className="size-7 text-blue-400" />
          ประวัติการขับรถของฉัน
        </h1>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="size-10 animate-spin text-white" />
          </div>
        ) : error ? (

          /* Error */
          <div className="text-center py-10 rounded-2xl bg-red-500/20 text-red-200 border border-red-400/30 backdrop-blur-md">
            {error}
          </div>

        ) : history.length === 0 ? (

          /* Empty */
          <div className="text-center py-20 text-white/80 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
            ยังไม่มีประวัติการขับรถที่เสร็จสิ้น
          </div>

        ) : (

          /* Data */
          <div className="grid gap-5">

            {history.map((trip) => {

              // กัน fuel_expenses ไม่ใช่ array
              const fuelExpenses = Array.isArray(trip.fuel_expenses)
                ? trip.fuel_expenses
                : []

              // รวมค่าน้ำมัน
              const totalCost = fuelExpenses.reduce((sum, item) => {
                return sum + Number(item?.fuel_cost || 0)
              }, 0)

              // relation vehicle
              const vehicle = Array.isArray(trip.vehicles)
                ? trip.vehicles[0]
                : trip.vehicles

              return (
                <Card
                  key={trip.id}
                  className="rounded-3xl border border-white/20 bg-white/85 backdrop-blur-xl shadow-2xl hover:scale-[1.01] transition-all duration-300"
                >
                  <CardContent className="p-6">

                    {/* Top */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          {trip.destination || "-"}
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                          {formatDate(trip.start_date)} -{" "}
                          {formatDate(trip.end_date)}
                        </p>
                      </div>

                      <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-1 text-sm">
                        สำเร็จ
                      </Badge>

                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Car */}
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100">

                        <div className="p-3 rounded-xl bg-blue-100">
                          <Car className="size-5 text-blue-600" />
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            ทะเบียนรถ
                          </p>

                          <p className="font-semibold text-slate-800">
                            {vehicle?.license_plate || "-"}
                          </p>
                        </div>

                      </div>

                      {/* Fuel */}
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100">

                        <div className="p-3 rounded-xl bg-amber-100">
                          <Fuel className="size-5 text-amber-600" />
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            ค่าน้ำมันรวม
                          </p>

                          <p className="font-semibold text-slate-800">
                            {totalCost.toLocaleString()} บาท
                          </p>
                        </div>

                      </div>

                    </div>

                  </CardContent>
                </Card>
              )
            })}

          </div>
        )}

      </div>
    </div>
  )
}