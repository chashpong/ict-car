"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { bookings } from "@/lib/data"

const statusMap = {
  pending: { label: "รอดำเนินการ", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  approved: { label: "อนุมัติ", className: "bg-success/15 text-success border-success/30" },
  rejected: { label: "ไม่อนุมัติ", className: "bg-destructive/15 text-destructive border-destructive/30" },
}

export function RecentActivity() {
  const recent = bookings.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">คำขอล่าสุด</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-3">
          {recent.map((booking) => {
            const status = statusMap[booking.status]
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">{booking.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.destination} - {booking.date}
                  </p>
                </div>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
