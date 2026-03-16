"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil } from "lucide-react"
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

import { supabase } from "@/lib/supabase"


const statusMap = {
available:{label:"ว่าง",className:"bg-green-100 text-green-700"},
busy:{label:"กำลังขับ",className:"bg-yellow-100 text-yellow-700"},
inactive:{label:"หยุดงาน",className:"bg-gray-200 text-gray-700"}
}


function DriverForm({driver,onClose,onSave}){

const [form,setForm] = useState({
name:driver?.name || "",
phone:driver?.phone || "",
license_number:driver?.license_number || "",
status:driver?.status || "available"
})

return(

<div className="flex flex-col gap-4">

<div className="flex flex-col gap-2">
<Label>ชื่อคนขับ</Label>
<Input
value={form.name}
onChange={(e)=>setForm({...form,name:e.target.value})}
/>
</div>

<div className="flex flex-col gap-2">
<Label>เบอร์โทร</Label>
<Input
value={form.phone}
onChange={(e)=>setForm({...form,phone:e.target.value})}
/>
</div>

<div className="flex flex-col gap-2">
<Label>เลขใบขับขี่</Label>
<Input
value={form.license_number}
onChange={(e)=>setForm({...form,license_number:e.target.value})}
/>
</div>

<div className="flex flex-col gap-2">
<Label>สถานะ</Label>

<Select
value={form.status}
onValueChange={(v)=>setForm({...form,status:v})}
>

<SelectTrigger>
<SelectValue/>
</SelectTrigger>

<SelectContent>

<SelectItem value="available">
ว่าง
</SelectItem>

<SelectItem value="busy">
กำลังขับ
</SelectItem>

<SelectItem value="inactive">
หยุดงาน
</SelectItem>

</SelectContent>

</Select>

</div>

<div className="flex justify-end gap-2">

<Button
variant="outline"
onClick={onClose}
>
ยกเลิก
</Button>

<Button
onClick={()=>onSave(form)}
>
บันทึก
</Button>

</div>

</div>

)

}



export default function DriversPage(){

const [drivers,setDrivers] = useState([])
const [search,setSearch] = useState("")
const [dialogOpen,setDialogOpen] = useState(false)
const [editDriver,setEditDriver] = useState(null)


useEffect(()=>{
fetchDrivers()
},[])



async function fetchDrivers(){

const {data} = await supabase
.from("drivers")
.select("*")

setDrivers(data || [])

}



async function saveDriver(data){

if(editDriver){

await supabase
.from("drivers")
.update(data)
.eq("id",editDriver.id)

}else{

await supabase
.from("drivers")
.insert([data])

}

fetchDrivers()
setDialogOpen(false)
setEditDriver(null)

}



const filtered = drivers.filter(d=>
d.name?.toLowerCase().includes(search.toLowerCase())
)



return(

<>

<PageHeader title="จัดการคนขับ"/>

<div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

<div className="flex justify-between">

<h1 className="text-2xl font-bold">
คนขับรถ
</h1>


<Dialog
open={dialogOpen}
onOpenChange={(o)=>{
setDialogOpen(o)
if(!o) setEditDriver(null)
}}
>

<DialogTrigger asChild>

<Button>
<Plus className="mr-2 size-4"/>
เพิ่มคนขับ
</Button>

</DialogTrigger>


<DialogContent>

<DialogHeader>

<DialogTitle>

{editDriver ? "แก้ไขคนขับ" : "เพิ่มคนขับ"}

</DialogTitle>

</DialogHeader>

<DriverForm
driver={editDriver}
onClose={()=>setDialogOpen(false)}
onSave={saveDriver}
/>

</DialogContent>

</Dialog>

</div>


<Card>

<CardHeader>

<div className="relative">

<Search className="absolute left-3 top-3 size-4"/>

<Input
placeholder="ค้นหาคนขับ..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="pl-8"
/>

</div>

</CardHeader>


<CardContent className="p-0">

<Table>

<TableHeader>

<TableRow>

<TableHead>ชื่อ</TableHead>
<TableHead>โทร</TableHead>
<TableHead>ใบขับขี่</TableHead>
<TableHead>สถานะ</TableHead>
<TableHead></TableHead>

</TableRow>

</TableHeader>


<TableBody>

{filtered.map(driver=>{

const status = statusMap[driver.status]

return(

<TableRow key={driver.id}>

<TableCell className="font-medium">
{driver.name}
</TableCell>

<TableCell>
{driver.phone}
</TableCell>

<TableCell>
{driver.license_number}
</TableCell>

<TableCell>

<Badge className={status.className}>
{status.label}
</Badge>

</TableCell>

<TableCell>

<Button
variant="ghost"
size="icon"
onClick={()=>{
setEditDriver(driver)
setDialogOpen(true)
}}
>

<Pencil className="size-4"/>

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

</>

)

}