"use client"

import { useState, useEffect } from "react"
import { 
  History, Search, Clock, User, FileText, 
  Activity, ArrowRight, Database, Eye, ShieldAlert // ✅ เปลี่ยน ArrowRightRight เป็น ArrowRight
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

// --- Helper Functions ---
const formatThaiDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', { 
    day: '2-digit', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(date) + " น.";
};

const actionConfig = {
  CREATE: { label: "สร้างข้อมูลใหม่", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  UPDATE: { label: "แก้ไขข้อมูล", color: "bg-blue-100 text-blue-700 border-blue-200" },
  DELETE: { label: "ลบข้อมูล", color: "bg-rose-100 text-rose-700 border-rose-200" },
  APPROVE: { label: "อนุมัติ", color: "bg-purple-100 text-purple-700 border-purple-200" },
  REJECT: { label: "ไม่อนุมัติ", color: "bg-orange-100 text-orange-700 border-orange-200" },
};

const entityConfig = {
  bookings: "คำขอจองรถ",
  drivers: "พนักงานขับรถ",
  profiles: "สมาชิกและสิทธิ์",
  vehicles: "รถยนต์ส่วนกลาง",
  logbooks: "สมุดบันทึกการใช้รถ",
  maintenance: "ซ่อมบำรุง"
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200) // ดึงมา 200 รายการล่าสุดเพื่อไม่ให้หนักเครื่อง

    if (!error) {
      setLogs(data || [])
    }
    setLoading(false)
  }

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.user_name?.toLowerCase().includes(search.toLowerCase()) || 
                        log.entity_id?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    return matchSearch && matchAction;
  })

  return (
    <div className="min-h-screen font-sarabun text-black bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/images/image.png')" }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      <div className="relative z-10 border-b border-white/10">
        <PageHeader title="ประวัติกิจกรรมระบบ" />
      </div>

      <div className="p-4 md:p-8 relative z-10 space-y-6">
        
        <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="size-8 text-blue-400" /> ประวัติการทำงาน (Audit Trail)
          </h1>
          <p className="text-white/80 text-sm mt-1 font-medium">
            ตรวจสอบการสร้าง, แก้ไข, ลบ หรือการพิจารณาอนุมัติต่างๆ ในระบบอย่างโปร่งใส
          </p>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
          <CardHeader className="bg-white border-b py-5 px-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="ค้นหาชื่อผู้ใช้งาน หรือ ID รายการ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 text-black"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px] h-12 rounded-2xl border-slate-200 shadow-sm bg-white font-bold">
                <SelectValue placeholder="ทุกการกระทำ" />
              </SelectTrigger>
              <SelectContent className="font-sarabun text-black bg-white">
                <SelectItem value="all">การกระทำทั้งหมด</SelectItem>
                <SelectItem value="CREATE">สร้างข้อมูลใหม่</SelectItem>
                <SelectItem value="UPDATE">แก้ไขข้อมูล</SelectItem>
                <SelectItem value="DELETE">ลบข้อมูล</SelectItem>
                <SelectItem value="APPROVE">พิจารณาอนุมัติ</SelectItem>
                <SelectItem value="REJECT">ปฏิเสธคำขอ</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="pl-6 py-5 font-bold text-slate-500 uppercase text-[11px] tracking-widest">วัน/เวลา</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">ผู้ทำรายการ</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">การกระทำ</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">ส่วนที่เกี่ยวข้อง</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">รหัสอ้างอิง</TableHead>
                  <TableHead className="pr-6 text-right font-bold text-slate-500 uppercase text-[11px] tracking-widest py-5">รายละเอียด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-500 font-medium">กำลังโหลดข้อมูลประวัติ...</TableCell></TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-400 italic">ไม่พบประวัติกิจกรรม</TableCell></TableRow>
                ) : filteredLogs.map((log) => {
                  const action = actionConfig[log.action] || { label: log.action, color: "bg-slate-100 text-slate-700" };
                  const entityLabel = entityConfig[log.entity_type] || log.entity_type;

                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                          <Clock className="size-3.5 text-slate-400" />
                          {formatThaiDateTime(log.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                            <User className="size-3.5" />
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{log.user_name || "ไม่ระบุตัวตน"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`px-3 py-1 rounded-full border shadow-sm font-bold text-[10px] ${action.color}`}>
                          {action.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Database className="size-3.5 text-slate-400" />
                          {entityLabel}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 font-bold">
                        {log.entity_id.split('-')[0]}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedLog(log)} 
                          className="text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-xs px-4"
                        >
                          <Eye className="size-3.5 mr-1.5" /> ดูข้อมูล
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog แสดงรายละเอียด JSON */}
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="sm:max-w-2xl rounded-[2rem] border-none bg-white text-black shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-[#0f172a] text-white">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                 <FileText className="size-5 text-blue-400" /> ข้อมูลเชิงลึก (Audit Details)
              </DialogTitle>
              <DialogDescription className="hidden">แสดงรายละเอียดข้อมูลที่ถูกเปลี่ยนแปลง</DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6 font-sarabun bg-slate-50/50 max-h-[70vh] overflow-y-auto">
              {selectedLog && (
                <>
                  <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ผู้ทำรายการ</p>
                      <p className="font-bold text-slate-800">{selectedLog.user_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เวลา</p>
                      <p className="font-bold text-slate-800">{formatThaiDateTime(selectedLog.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">รหัสอ้างอิง</p>
                      <p className="font-mono font-bold text-blue-600">{selectedLog.entity_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ข้อมูลเก่า */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-rose-600 font-bold text-sm bg-rose-50 px-3 py-1.5 rounded-lg w-fit">
                        <Activity className="size-4" /> ข้อมูลเดิม (Before)
                      </div>
                      <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto">
                        <pre className="text-emerald-400 font-mono text-xs">
                          {selectedLog.old_data ? JSON.stringify(selectedLog.old_data, null, 2) : "ไม่มีข้อมูลเดิม (สร้างใหม่)"}
                        </pre>
                      </div>
                    </div>

                    {/* ข้อมูลใหม่ */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                        <ArrowRight className="size-4" /> ข้อมูลใหม่ (After) {/* ✅ เปลี่ยนไอคอนตรงนี้ด้วย */}
                      </div>
                      <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto">
                        <pre className="text-blue-400 font-mono text-xs">
                          {selectedLog.new_data ? JSON.stringify(selectedLog.new_data, null, 2) : "ถูกลบไปแล้ว"}
                        </pre>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
              <Button onClick={() => setSelectedLog(null)} className="rounded-xl px-8 font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                ปิดหน้าต่าง
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}