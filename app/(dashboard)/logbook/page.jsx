"use client"

import { useState, useEffect } from "react"
import { Search, FileImage, MapPin, Camera, Play, Square } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table"
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { supabase } from "@/lib/supabase"



function DriverTodayJobs({ bookings, startTrip }) {

return(

<div className="flex flex-col gap-4">

<div>
<h2 className="text-lg font-semibold text-foreground">
งานวันนี้
</h2>
<p className="text-sm text-muted-foreground">
รายการเดินทางที่ได้รับมอบหมาย
</p>
</div>

{bookings.length === 0 ?(

<Card>
<CardContent className="flex flex-col items-center justify-center py-12">
<p className="text-muted-foreground">
ไม่มีงานวันนี้
</p>
</CardContent>
</Card>

):(


<div className="grid gap-4 md:grid-cols-2">

{bookings.map((booking)=>(

<Card key={booking.id} className="transition-colors hover:border-primary/30">

<CardHeader className="pb-3">

<div className="flex items-center justify-between">

<CardTitle className="text-sm font-medium">
{booking.user_name}
</CardTitle>

<Badge
variant="outline"
className="bg-success/15 text-success border-success/30"
>
อนุมัติแล้ว
</Badge>

</div>

<CardDescription>
{booking.department}
</CardDescription>

</CardHeader>


<CardContent className="flex flex-col gap-3">

<div className="flex items-center gap-2 text-sm">

<MapPin className="size-4 text-muted-foreground"/>

<span className="text-foreground">
{booking.destination}
</span>

</div>


<div className="flex items-center justify-between text-sm">

<span className="text-muted-foreground">
{booking.start_date}
</span>

<span className="font-medium text-foreground">
{booking.start_time} - {booking.end_time}
</span>

</div>


<Separator/>


<div className="flex items-center justify-between">

<div className="text-xs text-muted-foreground">

รถ: {booking.vehicles?.license_plate} <br/>
คนขับ: {booking.drivers?.name}

</div>

<Button
size="sm"
onClick={()=>startTrip(booking)}
>
<Play className="mr-1 size-3"/>
เริ่มงาน
</Button>

</div>

</CardContent>

</Card>

))}

</div>

)}

</div>

)

}



function TripRecordForm({ booking }){

const [isStarted,setIsStarted] = useState(false)

const [startMileage,setStartMileage] = useState("")
const [endMileage,setEndMileage] = useState("")

const [fuelLiters,setFuelLiters] = useState("")
const [fuelCost,setFuelCost] = useState("")

const [distance,setDistance] = useState(0)

const [mileageImage,setMileageImage] = useState(null)
const [receiptImage,setReceiptImage] = useState(null)

const [logbookId,setLogbookId] = useState(null)



async function uploadImage(file){

if(!file) return null

const fileName = Date.now()+"-"+file.name

const {data,error} = await supabase.storage
.from("logbook-images")
.upload(fileName,file)

if(error){
console.log(error)
return null
}

const {data:publicUrl} = supabase.storage
.from("logbook-images")
.getPublicUrl(fileName)

return publicUrl.publicUrl
}



async function startTrip(){

const mileageUrl = await uploadImage(mileageImage)

const {data,error} = await supabase
.from("logbooks")
.insert({

booking_id: booking.id,
vehicle_id: booking.vehicle_id,
driver_id: booking.driver_id,

start_mileage: startMileage,
mileage_image: mileageUrl,
status:"started"

})
.select()
.single()

if(error){
console.log(error)
alert("เกิดข้อผิดพลาด")
return
}

await supabase
.from("bookings")
.update({
status:"started"
})
.eq("id",booking.id)

setLogbookId(data.id)

setIsStarted(true)

}



async function finishTrip(){

const receiptUrl = await uploadImage(receiptImage)

const distanceCalc = Number(endMileage) - Number(startMileage)

setDistance(distanceCalc)

const {error} = await supabase
.from("logbooks")
.update({

end_mileage:endMileage,
distance:distanceCalc,

fuel_liter:fuelLiters,
fuel_cost:fuelCost,

receipt_image:receiptUrl,

status:"completed",
end_time:new Date()

})
.eq("id",logbookId)

if(error){
console.log(error)
alert("บันทึกไม่สำเร็จ")
return
}

await supabase
.from("bookings")
.update({
status:"completed"
})
.eq("id",booking.id)

alert("จบการเดินทางเรียบร้อย")

setIsStarted(false)

window.location.reload()

}



return(

<div className="flex flex-col gap-4">

<h2 className="text-lg font-semibold">
บันทึกการเดินทาง
</h2>


<Card>

<CardContent className="flex flex-col gap-4 pt-6">

{!isStarted && (

<>

<div className="grid grid-cols-2 gap-4">

<div>

<Label>รถ</Label>

<Input
value={booking?.vehicles?.license_plate || ""}
disabled
/>

</div>


<div>

<Label>เลขไมล์เริ่มต้น</Label>

<Input
type="number"
value={startMileage}
onChange={(e)=>setStartMileage(e.target.value)}
/>

</div>

</div>


<div>

<Label>รูปเลขไมล์</Label>

<Input
type="file"
onChange={(e)=>setMileageImage(e.target.files[0])}
/>

</div>


<Button onClick={startTrip}>

<Play className="mr-2 size-4"/>

เริ่มเดินทาง

</Button>

</>

)}



{isStarted && (

<>

<div className="p-3 rounded-lg bg-green-100">
กำลังเดินทาง
</div>


<Separator/>


<h4>เติมน้ำมัน</h4>

<div className="grid grid-cols-2 gap-4">

<Input
placeholder="ลิตร"
value={fuelLiters}
onChange={(e)=>setFuelLiters(e.target.value)}
/>

<Input
placeholder="จำนวนเงิน"
value={fuelCost}
onChange={(e)=>setFuelCost(e.target.value)}
/>

</div>


<div>

<Label>รูปใบเสร็จ</Label>

<Input
type="file"
onChange={(e)=>setReceiptImage(e.target.files[0])}
/>

</div>


<Separator/>


<div className="grid grid-cols-2 gap-4">

<Input
placeholder="เลขไมล์ปลายทาง"
value={endMileage}
onChange={(e)=>setEndMileage(e.target.value)}
/>

<Input
placeholder="ระยะทาง"
value={distance}
disabled
/>

</div>


<Button
variant="destructive"
onClick={finishTrip}
>

<Square className="mr-2 size-4"/>

จบการเดินทาง

</Button>

</>

)}

</CardContent>

</Card>

</div>

)
}



function LogbookTable({ logs }){

const [search,setSearch] = useState("")

const filtered = logs.filter((l)=>

l.vehicle_plate?.includes(search) ||
l.driver_name?.includes(search)

)

return(

<div className="flex flex-col gap-4">

<div className="relative flex-1">

<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>

<Input
placeholder="ค้นหาทะเบียน, ชื่อคนขับ..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="pl-9"
/>

</div>


<Card>

<CardContent className="px-0 pt-0">

<Table>

<TableHeader>

<TableRow>

<TableHead>วันที่</TableHead>
<TableHead>รถ</TableHead>
<TableHead>คนขับ</TableHead>
<TableHead>ไมล์เริ่ม</TableHead>
<TableHead>ไมล์จบ</TableHead>
<TableHead>ระยะทาง</TableHead>
<TableHead>น้ำมัน</TableHead>
<TableHead>ค่าน้ำมัน</TableHead>
<TableHead>ใบเสร็จ</TableHead>

</TableRow>

</TableHeader>


<TableBody>

{filtered.map((log)=>(

<TableRow key={log.id}>

<TableCell>{log.date}</TableCell>

<TableCell className="font-medium">
{log.vehicle_plate}
</TableCell>

<TableCell>
{log.driver_name}
</TableCell>

<TableCell>
{log.start_mileage}
</TableCell>

<TableCell>
{log.end_mileage}
</TableCell>

<TableCell>
{log.distance} กม.
</TableCell>

<TableCell>
{log.fuel_liters} ลิตร
</TableCell>

<TableCell>
{log.fuel_cost} บาท
</TableCell>

<TableCell>

{log.receipt_url ?(

<Button variant="ghost" size="icon">
<FileImage className="size-4 text-primary"/>
</Button>

):(

<span className="text-xs text-muted-foreground">
-
</span>

)}

</TableCell>

</TableRow>

))}

</TableBody>

</Table>

</CardContent>

</Card>

</div>

)

}



export default function LogbookPage(){

const [bookings,setBookings] = useState([])
const [logs,setLogs] = useState([])
const [activeTab,setActiveTab] = useState("logbook")
const [selectedBooking,setSelectedBooking] = useState(null)

useEffect(()=>{

fetchBookings()
fetchLogs()

},[])



async function fetchBookings(){

const { data } = await supabase

.from("bookings")

.select(`
id,
user_name,
department,
destination,
start_date,
start_time,
end_time,
vehicle_id,
driver_id,
vehicles:vehicle_id (
license_plate
),
drivers:driver_id (
name
)
`)

.in("status",["approved","started"])

setBookings(data || [])

}



async function fetchLogs(){

const {data,error} = await supabase
.from("logbooks")
.select(`
id,
start_mileage,
end_mileage,
distance,
fuel_liter,
fuel_cost,
receipt_image,
created_at,
vehicles:vehicle_id (
license_plate
),
drivers:driver_id (
name
)
`)
.order("created_at",{ascending:false})

if(error){
console.log(error)
return
}

const formatted = data.map((l)=>({
id:l.id,
date:new Date(l.created_at).toLocaleDateString(),
vehicle_plate:l.vehicles?.license_plate,
driver_name:l.drivers?.name,
start_mileage:l.start_mileage,
end_mileage:l.end_mileage,
distance:l.distance,
fuel_liters:l.fuel_liter,
fuel_cost:l.fuel_cost,
receipt_url:l.receipt_image
}))

setLogs(formatted)

}

function startTrip(booking){

setSelectedBooking(booking)
setActiveTab("record")

}



return(

<>

<PageHeader title="สมุดบันทึกการใช้รถ"/>

<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

<div>

<h1 className="text-2xl font-bold text-foreground">
สมุดบันทึกการใช้รถ
</h1>

<p className="text-sm text-muted-foreground">
Digital Logbook - บันทึกข้อมูลการเดินทาง
</p>

</div>

<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

<TabsList>

<TabsTrigger value="logbook">
ประวัติบันทึก
</TabsTrigger>

<TabsTrigger value="today">
งานวันนี้
</TabsTrigger>



</TabsList>

<TabsContent value="logbook" className="mt-4">
<LogbookTable logs={logs}/>
</TabsContent>

<TabsContent value="today" className="mt-4">
<DriverTodayJobs bookings={bookings} startTrip={startTrip}/>
</TabsContent>

<TabsContent value="record" className="mt-4">
<TripRecordForm booking={selectedBooking}/>
</TabsContent>

</Tabs>

</div>

</>

)

}