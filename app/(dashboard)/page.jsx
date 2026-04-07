import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/page-header"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { MonthlyUsageChart, FuelExpenseChart, VehicleUsageChart } from "@/components/dashboard/dashboard-charts"


export default async function DashboardPage() {

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*")

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")

  const { data: logEntries } = await supabase
    .from("logbooks")
    .select("*")

  const { data: maintenanceRecords } = await supabase
    .from("maintenance")
    .select("*")

  if (vehiclesError || bookingsError) {
    console.error(vehiclesError || bookingsError)
  }

  return (
    <>
      <PageHeader title="แดชบอร์ด" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-sm text-muted-foreground">ภาพรวมระบบบริหารจัดการยานพาหนะ</p>
        </div>

        <SummaryCards
          vehicles={vehicles || []}
          bookings={bookings || []}
          logEntries={logEntries || []}
          maintenanceRecords={maintenanceRecords || []}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MonthlyUsageChart />
          <FuelExpenseChart />
          <VehicleUsageChart />
        </div>

        
      </div>
    </>
  )
}