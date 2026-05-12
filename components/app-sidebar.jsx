"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react" 
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  ClipboardCheck,
  History, 
  BookOpen,
  Wrench,
  BarChart3,
  Users,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button" 
import { useAuth, canAccessRoute, getRoleLabel, getRoleBadgeColor } from "@/lib/auth-context"

const mainNav = [
  { title: "แดชบอร์ด", href: "/", icon: LayoutDashboard },
  { title: "การจองรถ", href: "/bookings", icon: CalendarCheck },
  { title: "อนุมัติคำขอ", href: "/approvals", icon: ClipboardCheck },
  { title: "ประวัติการอนุมัติ", href: "/history", icon: History }, 
  { title: "จัดการยานพาหนะ", href: "/vehicles", icon: Car },
  { title: "จัดการสมาชิก", href: "/users", icon: Users }, 
  { title: "คนขับรถ", href: "/drivers", icon: Users },
]

const recordNav = [
  { title: "สมุดบันทึกการใช้รถ", href: "/logbook", icon: BookOpen },
  { title: "ซ่อมบำรุง", href: "/maintenance", icon: Wrench },
  { title: "รายงาน", href: "/reports", icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const role = user?.role ?? "user"

  const filteredMainNav = mainNav.filter((item) => canAccessRoute(role, item.href))
  const filteredRecordNav = recordNav.filter((item) => canAccessRoute(role, item.href))

  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = mounted ? time.toLocaleTimeString('th-TH', { hour12: false }) : "00:00:00"
  const formattedDate = mounted ? time.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : "-- -- ----"

  async function handleLogout() {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      window.location.href = "/login";
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-transparent">
            <img 
              src="/images/Thailand.png" 
              alt="Logo" 
              className="size-10 object-contain drop-shadow-md" 
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden text-white">
            <span className="text-[15px] font-bold leading-tight tracking-wide drop-shadow-sm">ระบบยานพาหนะ</span>
            <span className="text-xs text-white/60 font-medium">Vehicle Management</span>
          </div>
        </Link>
      </SidebarHeader>
      
      {/* ✅ เพิ่มคลาสสำหรับปรับแต่ง Scrollbar ให้เล็กและกลมกลืน (เฉพาะส่วนที่เลื่อนได้) */}
      <SidebarContent className="overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80 pr-1">
        
        <div className="px-3 pt-2 pb-4 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between rounded-2xl bg-slate-800/40 p-4 border border-white/5 shadow-inner backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="font-mono text-2xl leading-none font-extrabold tracking-wider text-white drop-shadow-md">
                {formattedTime}
              </span>
              <span className="text-[13px] font-medium text-slate-400 mt-1.5">
                {formattedDate}
              </span>
            </div>
            {/* ✅ เพิ่ม whitespace-nowrap ป้องกันข้อความผู้ดูแลระบบตกบรรทัด */}
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold border whitespace-nowrap ${getRoleBadgeColor(role)}`}>
              {getRoleLabel(role)}
            </span>
          </div>
        </div>

        {filteredMainNav.length > 0 && (
          <SidebarGroup className="pt-0">
            <SidebarGroupLabel className="flex items-center text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1 group-data-[collapsible=icon]:hidden">
              เมนูหลัก
              <div className="ml-3 h-[1px] flex-1 bg-white/10 rounded-full"></div>
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                      className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-11 transition-all"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="size-[18px] opacity-80" />
                        <span className="font-medium text-[14px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredRecordNav.length > 0 && (
          <SidebarGroup className="pt-2">
            <SidebarGroupLabel className="flex items-center text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1 group-data-[collapsible=icon]:hidden">
              บันทึกและรายงาน
              <div className="ml-3 h-[1px] flex-1 bg-white/10 rounded-full"></div>
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {filteredRecordNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                      className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-11 transition-all"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="size-[18px] opacity-80" />
                        <span className="font-medium text-[14px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-4 flex flex-col gap-3 bg-transparent mt-auto group-data-[collapsible=icon]:hidden">
        
        <div className="flex items-center gap-3 bg-slate-800/40 p-3.5 rounded-2xl border border-white/5 backdrop-blur-sm">
          <Avatar className="size-10 border border-white/10 shadow-sm shrink-0">
            <AvatarFallback className="bg-amber-500 text-white text-lg font-bold">
              {user?.name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="text-[14px] font-bold text-white truncate">{user?.name ?? "ไม่ทราบชื่อ"}</span>
            <span className="text-[11px] text-white/50 truncate font-medium mt-0.5">{getRoleLabel(role)}</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white h-12 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
        >
          ออกจากระบบ
        </Button>
      </SidebarFooter>

      <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-3 p-3 mt-auto">
         <Avatar className="size-8 border border-white/10 shadow-sm shrink-0">
            <AvatarFallback className="bg-amber-500 text-white text-xs font-bold">
              {user?.name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleLogout}
          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors h-10 w-10 rounded-xl"
          title="ออกจากระบบ"
        >
          <LogOut className="size-5" />
        </Button>
      </div>

    </Sidebar>
  )
}