import { PageHeader } from "@/components/page-header"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { MonthlyUsageChart, FuelExpenseChart, VehicleUsageChart } from "@/components/dashboard/dashboard-charts"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="แดชบอร์ด" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-sm text-muted-foreground">ภาพรวมระบบบริหารจัดการยานพาหนะ</p>
        </div>
        <SummaryCards />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MonthlyUsageChart />
          <FuelExpenseChart />
          <VehicleUsageChart />
        </div>
        <div className="grid gap-6 lg:grid-cols-1">
          <RecentActivity />
        </div>
      </div>
    </>
  )
}
