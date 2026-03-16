"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Eye } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

import { supabase } from "@/lib/supabase"


const statusMap = {
pending: {
label: "รอดำเนินการ",
className: "bg-yellow-100 text-yellow-700 border-yellow-200"
},
approved: {
label: "อนุมัติ",
className: "bg-green-100 text-green-700 border-green-200"
},
rejected: {
label: "ไม่อนุมัติ",
className: "bg-red-100 text-red-700 border-red-200"
},
started: {
label: "กำลังเดินทาง",
className: "bg-blue-100 text-blue-700 border-blue-200"
},
completed: {
label: "เสร็จสิ้น",
className: "bg-gray-100 text-gray-700 border-gray-200"
}
}



function BookingForm({ onClose, onSave }) {

const [formData,setFormData] = useState({
user_name:"",
department:"",
start_date:"",
end_date:"",
start_time:"",
end_time:"",
destination:"",
purpose:"",
passengers:1
})

return(

<div className="flex flex-col gap-4">

<div className="grid grid-cols-2 gap-4">

<div className="flex flex-col gap-2">
<Label>ผู้ขอใช้รถ</Label>
<Input
value={formData.user_name}
onChange={(e)=>setFormData({...formData,user_name:e.target.value})}
/>
</div>

<div className="flex flex-col gap-2">
<Label>หน่วยงาน</Label>
<Input
value={formData.department}
onChange={(e)=>setFormData({...formData,department:e.target.value})}
/>
</div>

</div>


<div className="grid grid-cols-2 gap-4">

<div className="grid grid-cols-2 gap-4">

<div className="flex flex-col gap-2">
<Label>วันที่เริ่มต้น</Label>
<Input
type="date"
value={formData.start_date}
onChange={(e)=>setFormData({...formData,start_date:e.target.value})}
/>
</div>

<div className="flex flex-col gap-2">
<Label>วันที่สิ้นสุด</Label>
<Input
type="date"
value={formData.end_date}
onChange={(e)=>setFormData({...formData,end_date:e.target.value})}
/>
</div>

</div>


<div className="flex flex-col gap-2">
<Label>จำนวนผู้โดยสาร</Label>
<Input
type="number"
min={1}
value={formData.passengers}
onChange={(e)=>setFormData({...formData,passengers:e.target.value})}
/>
</div>

</div>


<div className="grid grid-cols-2 gap-4">

<div className="flex flex-col gap-2">
<Label>เวลาเริ่มต้น</Label>
<Input
type="time"
value={formData.start_time}
onChange={(e)=>setFormData({...formData,start_time:e.target.value})}
/>
</div>

<div className="flex flex-col gap-2">
<Label>เวลาสิ้นสุด</Label>
<Input
type="time"
value={formData.end_time}
onChange={(e)=>setFormData({...formData,end_time:e.target.value})}
/>
</div>

</div>


<div className="flex flex-col gap-2">
<Label>สถานที่ปลายทาง</Label>
<Input
value={formData.destination}
onChange={(e)=>setFormData({...formData,destination:e.target.value})}
/>
</div>


<div className="flex flex-col gap-2">
<Label>วัตถุประสงค์</Label>
<Textarea
rows={3}
value={formData.purpose}
onChange={(e)=>setFormData({...formData,purpose:e.target.value})}
/>
</div>


<div className="flex justify-end gap-2 pt-2">

<Button variant="outline" onClick={onClose}>
ยกเลิก
</Button>

<Button onClick={()=>onSave(formData)}>
ส่งคำขอ
</Button>

</div>

</div>

)
}



function BookingDetail({ booking,onClose }) {

const status = statusMap[booking.status] || {
label: booking.status || "ไม่ทราบสถานะ",
className: "bg-gray-100 text-gray-600 border-gray-200"
}

return(

<div className="flex flex-col gap-4">

<div className="flex items-center justify-between">

<h3 className="font-semibold text-foreground">
รายละเอียดคำขอ
</h3>

<Badge variant="outline" className={status.className}>
{status.label}
</Badge>

</div>


<div className="grid grid-cols-2 gap-4 rounded-lg border p-4">

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

<div className="col-span-2">
<p className="text-xs text-muted-foreground">วัตถุประสงค์</p>
<p className="text-sm font-medium">{booking.purpose}</p>
</div>

</div>

<div className="flex justify-end">
<Button variant="outline" onClick={onClose}>
ปิด
</Button>
</div>

</div>

)
}



export default function BookingsPage() {

const [bookings,setBookings] = useState([])
const [search,setSearch] = useState("")
const [statusFilter,setStatusFilter] = useState("all")
const [createOpen,setCreateOpen] = useState(false)
const [detailBooking,setDetailBooking] = useState(null)


useEffect(()=>{
fetchBookings()
},[])


async function fetchBookings(){

const {data,error} = await supabase
.from("bookings")
.select("*")
.order("created_at",{ascending:false})

if(!error){
setBookings(data || [])
}

}


async function saveBooking(data){

await supabase
.from("bookings")
.insert([{
...data,
status:"pending"
}])

fetchBookings()
setCreateOpen(false)

}


const filtered = bookings.filter((b)=>{

const matchesSearch =
b.user_name?.includes(search) ||
b.destination?.includes(search) ||
b.department?.includes(search)

const matchesStatus =
statusFilter === "all" ||
b.status === statusFilter

return matchesSearch && matchesStatus

})


return(

<>

<PageHeader title="การจองรถ" />

<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

<div>

<h1 className="text-2xl font-bold">
การจองรถ
</h1>

<p className="text-sm text-muted-foreground">
รายการคำขอใช้รถ
</p>

</div>


<Dialog open={createOpen} onOpenChange={setCreateOpen}>

<DialogTrigger asChild>

<Button>
<Plus className="mr-2 size-4"/>
จองรถ
</Button>

</DialogTrigger>

<DialogContent className="sm:max-w-[520px]">

<DialogHeader>
<DialogTitle>แบบฟอร์มจองรถ</DialogTitle>
</DialogHeader>

<BookingForm
onClose={()=>setCreateOpen(false)}
onSave={saveBooking}
/>

</DialogContent>

</Dialog>

</div>



<Card>

<CardHeader>

<div className="flex flex-col gap-3 sm:flex-row">

<div className="relative flex-1">

<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2"/>

<Input
placeholder="ค้นหา..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="pl-9"
/>

</div>


<Select value={statusFilter} onValueChange={setStatusFilter}>

<SelectTrigger className="w-[180px]">

<SelectValue placeholder="สถานะ"/>

</SelectTrigger>

<SelectContent>

<SelectItem value="all">ทั้งหมด</SelectItem>
<SelectItem value="pending">รอดำเนินการ</SelectItem>
<SelectItem value="approved">อนุมัติ</SelectItem>
<SelectItem value="rejected">ไม่อนุมัติ</SelectItem>

</SelectContent>

</Select>

</div>

</CardHeader>



<CardContent className="px-0">

<Table>

<TableHeader>

<TableRow>

<TableHead>ผู้ขอ</TableHead>
<TableHead>หน่วยงาน</TableHead>
<TableHead>วันที่</TableHead>
<TableHead>เวลา</TableHead>
<TableHead>สถานที่</TableHead>
<TableHead>สถานะ</TableHead>
<TableHead></TableHead>

</TableRow>

</TableHeader>



<TableBody>

{filtered.map((booking)=>{

const status = statusMap[booking.status] || {
label: booking.status || "ไม่ทราบสถานะ",
className: "bg-gray-100 text-gray-600 border-gray-200"
}

return(

<TableRow key={booking.id}>

<TableCell>{booking.user_name}</TableCell>
<TableCell>{booking.department}</TableCell>
<TableCell>
{booking.start_date} - {booking.end_date}
</TableCell>

<TableCell>
{booking.start_time} - {booking.end_time}
</TableCell>

<TableCell>{booking.destination}</TableCell>

<TableCell>

<Badge variant="outline" className={status.className}>
{status.label}
</Badge>

</TableCell>

<TableCell className="text-right">

<Button
variant="ghost"
size="icon"
onClick={()=>setDetailBooking(booking)}
>

<Eye className="size-4"/>

</Button>

</TableCell>

</TableRow>

)

})}

</TableBody>

</Table>

</CardContent>

</Card>

</div>



<Dialog
open={!!detailBooking}
onOpenChange={()=>setDetailBooking(null)}
>

<DialogContent>

<DialogHeader>

<DialogTitle>
รายละเอียดการจอง
</DialogTitle>

</DialogHeader>

{detailBooking && (
<BookingDetail
booking={detailBooking}
onClose={()=>setDetailBooking(null)}
/>
)}

</DialogContent>

</Dialog>

</>

)

}