"use client"

import { useState, useEffect } from "react"
import { Check, X, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog"
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { supabase } from "@/lib/supabase"



function ApprovalDialog({ booking, vehicles, drivers, onClose, onApprove, onReject }) {

const [selectedVehicle,setSelectedVehicle] = useState("")
const [selectedDriver,setSelectedDriver] = useState("")

return(

<div className="flex flex-col gap-5">

<div className="rounded-lg border p-4">

<h4 className="mb-3 text-sm font-semibold">
ข้อมูลผู้ขอ
</h4>

<div className="grid grid-cols-2 gap-3">

<div>
<p className="text-xs text-muted-foreground">ผู้ขอ</p>
<p className="text-sm font-medium">{booking.user_name}</p>
</div>

<div>
<p className="text-xs text-muted-foreground">หน่วยงาน</p>
<p className="text-sm font-medium">{booking.department}</p>
</div>

<div>
<p className="text-xs text-muted-foreground">วันที่</p>
<p className="text-sm font-medium">
{booking.start_date} - {booking.end_date}
</p>
</div>

<div>
<p className="text-xs text-muted-foreground">เวลา</p>
<p className="text-sm font-medium">
{booking.start_time} - {booking.end_time}
</p>
</div>

<div>
<p className="text-xs text-muted-foreground">สถานที่</p>
<p className="text-sm font-medium">{booking.destination}</p>
</div>

<div>
<p className="text-xs text-muted-foreground">ผู้โดยสาร</p>
<p className="text-sm font-medium">{booking.passengers} คน</p>
</div>

</div>

</div>

<Separator/>

<div className="flex flex-col gap-4">

<h4 className="text-sm font-semibold">
จัดสรรรถและพนักงานขับ
</h4>

<div className="flex flex-col gap-2">

<Label>เลือกรถ</Label>

<Select value={selectedVehicle} onValueChange={setSelectedVehicle}>

<SelectTrigger>
<SelectValue placeholder="เลือกรถ"/>
</SelectTrigger>

<SelectContent>

{vehicles.map(v=>(
<SelectItem key={v.id} value={v.id}>
{v.license_plate}
</SelectItem>
))}

</SelectContent>

</Select>

</div>


<div className="flex flex-col gap-2">

<Label>เลือกพนักงานขับรถ</Label>

<Select value={selectedDriver} onValueChange={setSelectedDriver}>

<SelectTrigger>
<SelectValue placeholder="เลือกพนักงานขับรถ"/>
</SelectTrigger>

<SelectContent>

{drivers.map(d=>(
<SelectItem key={d.id} value={d.id}>
{d.name}
</SelectItem>
))}

</SelectContent>

</Select>

</div>

</div>


<div className="flex justify-end gap-2 pt-2">

<Button
variant="outline"
onClick={()=>onReject(booking.id)}
>
<X className="mr-1 size-4"/>
ไม่อนุมัติ
</Button>

<Button
onClick={()=>{
if(!selectedVehicle || !selectedDriver){
alert("กรุณาเลือกรถและพนักงานขับรถ")
return
}

onApprove(booking.id,selectedVehicle,selectedDriver)
}}
>
<Check className="mr-1 size-4"/>
อนุมัติ
</Button>

</div>

</div>

)

}



export default function ApprovalsPage(){

const [bookings,setBookings] = useState([])
const [vehicles,setVehicles] = useState([])
const [drivers,setDrivers] = useState([])
const [selectedBooking,setSelectedBooking] = useState(null)


useEffect(()=>{
fetchData()
},[])


async function fetchData(){

const {data:bookingData,error:bookingError} = await supabase
.from("bookings")
.select("*")
.eq("status","pending")

const {data:vehicleData} = await supabase
.from("vehicles")
.select("*")
.eq("status","available")

const {data:driverData} = await supabase
.from("drivers")
.select("*")

if(bookingError){
console.log(bookingError)
}

setBookings(bookingData || [])
setVehicles(vehicleData || [])
setDrivers(driverData || [])

}



async function approveBooking(id,vehicleId,driverId){

const {error} = await supabase
.from("bookings")
.update({
status:"approved",
vehicle_id:vehicleId,
driver_id:driverId
})
.eq("id",id)

if(error){
console.log(error)
alert("เกิดข้อผิดพลาดในการอนุมัติ")
return
}

fetchData()
setSelectedBooking(null)

}



async function rejectBooking(id){

const {error} = await supabase
.from("bookings")
.update({status:"rejected"})
.eq("id",id)

if(error){
console.log(error)
}

fetchData()
setSelectedBooking(null)

}



return(

<>

<PageHeader title="อนุมัติคำขอ"/>

<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

<h1 className="text-2xl font-bold">
อนุมัติคำขอใช้รถ
</h1>

{bookings.length === 0 ?(

<Card>

<CardContent className="py-10 text-center">
ไม่มีคำขอที่รอดำเนินการ
</CardContent>

</Card>

):(


<div className="flex flex-col gap-4">

{bookings.map(booking=>(

<Card key={booking.id}>

<CardContent className="p-4">

<div className="flex items-center justify-between">

<div>

<div className="flex items-center gap-2">

<p className="font-semibold">
{booking.user_name}
</p>

<Badge
variant="outline"
className="bg-warning/15 text-warning-foreground border-warning/30"
>
รอการดำเนินการ
</Badge>

</div>

<p className="text-sm text-muted-foreground">
{booking.department}
</p>

</div>


<Button
variant="ghost"
size="icon"
onClick={()=>setSelectedBooking(booking)}
>

<ChevronRight className="size-4"/>

</Button>

</div>

</CardContent>

</Card>

))}

</div>

)}



<Dialog
open={!!selectedBooking}
onOpenChange={()=>setSelectedBooking(null)}
>

<DialogContent>

<DialogHeader>
<DialogTitle>พิจารณาคำขอใช้รถ</DialogTitle>
</DialogHeader>

{selectedBooking &&(

<ApprovalDialog
booking={selectedBooking}
vehicles={vehicles}
drivers={drivers}
onClose={()=>setSelectedBooking(null)}
onApprove={approveBooking}
onReject={rejectBooking}
/>

)}

</DialogContent>

</Dialog>

</div>

</>

)

}