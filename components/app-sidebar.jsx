"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  ShieldAlert,
  CalendarDays, 
  ClipboardList
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
import { supabase } from "@/lib/supabase"
import Swal from 'sweetalert2'

// ✅ 1. Import คอมโพเนนต์ UserProfileDialog ที่เราเพิ่งสร้าง
import { UserProfileDialog } from "@/components/user-profile-dialog"

const mainNav = [
  { title: "แดชบอร์ด",        href: "/",            icon: LayoutDashboard },
  { title: "ปฏิทินการใช้รถ",  href: "/calendar",    icon: CalendarDays    },
  { title: "การจองรถ",        href: "/bookings",    icon: CalendarCheck   },
  { title: "ตรวจสอบคำขอ",     href: "/reviewer",    icon: ClipboardList   },
  { title: "อนุมัติคำขอ",      href: "/approvals",   icon: ClipboardCheck  },
  { title: "ประวัติการอนุมัติ", href: "/history",     icon: History         },
  { title: "จัดการยานพาหนะ",   href: "/vehicles",    icon: Car             },
  { title: "จัดการสมาชิก",     href: "/users",       icon: Users           },
  { title: "คนขับรถ",          href: "/drivers",     icon: Users           },
]

const recordNav = [
  { title: "สมุดบันทึกการใช้รถ", href: "/logbook",     icon: BookOpen   },
  { title: "ซ่อมบำรุง",         href: "/maintenance", icon: Wrench     },
  { title: "รายงาน",            href: "/reports",     icon: BarChart3  },
  { title: "ประวัติระบบ",       href: "/logs",        icon: ShieldAlert },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const role = user?.role ?? "user"

  // ── Pending approvals count (admin/approver) ──
  const [pendingCount, setPendingCount] = useState(0)

  // ✅ 2. สร้าง State ควบคุมป๊อปอัปโปรไฟล์
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (role !== "admin" && role !== "approver") return

    async function fetchPending() {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
      setPendingCount(count ?? 0)
    }

    fetchPending()

    const channel = supabase
      .channel("sidebar:bookings:pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetchPending)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [role])

  // ── Logbook jobs count (driver) ──
  const [logbookCount, setLogbookCount] = useState(0)

  useEffect(() => {
    if (role !== "driver" || !user?.id) return

    async function fetchLogbookJobs() {
      const { data: driverData } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!driverData) return

      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("status", ["approved", "started"])
        .eq("driver_id", driverData.id)

      setLogbookCount(count ?? 0)
    }

    fetchLogbookJobs()

    const channel = supabase
      .channel("sidebar:bookings:driver")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetchLogbookJobs)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [role, user?.id])

  const filteredMainNav = mainNav.filter((item) => {
    if (role !== "admin" && item.href === "/") return false;
    if ((role === "user" || role === "driver") && item.href === "/approvals") return false;
    return canAccessRoute(role, item.href);
  });

  const filteredRecordNav = recordNav.filter((item) => {
    if (item.href === "/logs" && role !== "admin") return false;
    return canAccessRoute(role, item.href);
  });

  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = mounted ? time.toLocaleTimeString('th-TH', { hour12: false }) : "00:00:00"
  const formattedDate = mounted ? time.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : "-- -- ----"

  async function handleLogout(e) {
    e.preventDefault();
    Swal.fire({
      title: 'ออกจากระบบ?', text: "คุณต้องการออกจากระบบใช่หรือไม่?", icon: 'question',
      showCancelButton: true, confirmButtonColor: '#3b82f6', cancelButtonColor: '#ef4444',
      confirmButtonText: 'ออกจากระบบ', cancelButtonText: 'ยกเลิก', reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'กำลังออกจากระบบ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
        try { await logout(); localStorage.clear(); sessionStorage.clear(); }
        catch (error) { console.error("Logout Error:", error); }
        finally { window.location.href = "/login"; }
      }
    });
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <Link href={role === "driver" ? "/logbook" : (role === "user" ? "/bookings" : (role === "approver" ? "/approvals" : "/"))} className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-transparent">
            <img src="/images/Thailand.png" alt="Logo" className="size-10 object-contain drop-shadow-md" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden text-white">
            <span className="text-[15px] font-bold leading-tight tracking-wide drop-shadow-sm">ระบบยานพาหนะ</span>
            <span className="text-xs text-white/60 font-medium">Vehicle Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80 pr-1">

        {/* Clock widget */}
        <div className="px-3 pt-2 pb-4 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between rounded-2xl bg-slate-800/40 p-4 border border-white/5 shadow-inner backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="font-mono text-2xl leading-none font-extrabold tracking-wider text-white drop-shadow-md">{formattedTime}</span>
              <span className="text-[13px] font-medium text-slate-400 mt-1.5">{formattedDate}</span>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold border whitespace-nowrap ${getRoleBadgeColor(role)}`}>
              {getRoleLabel(role)}
            </span>
          </div>
        </div>

        {/* ── Main nav ── */}
        {filteredMainNav.length > 0 && (
          <SidebarGroup className="pt-0">
            <SidebarGroupLabel className="flex items-center text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1 group-data-[collapsible=icon]:hidden">
              เมนูหลัก
              <div className="ml-3 h-[1px] flex-1 bg-white/10 rounded-full" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainNav.map((item) => {
                  const isApprovals = item.href === "/approvals"
                  const showBadge = isApprovals && pendingCount > 0

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-11 transition-all"
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <item.icon className="size-[18px] opacity-80" />
                            {showBadge && (
                              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white shadow-md ring-1 ring-slate-900 group-data-[collapsible=icon]:flex hidden">
                                {pendingCount > 9 ? "9+" : pendingCount}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-[14px] flex-1 group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                          {showBadge && (
                            <span className="ml-auto shrink-0 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-[11px] font-extrabold text-white shadow-md group-data-[collapsible=icon]:hidden">
                              {pendingCount > 99 ? "99+" : pendingCount}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ── Record nav ── */}
        {filteredRecordNav.length > 0 && (
          <SidebarGroup className="pt-2">
            <SidebarGroupLabel className="flex items-center text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1 group-data-[collapsible=icon]:hidden">
              บันทึกและรายงาน
              <div className="ml-3 h-[1px] flex-1 bg-white/10 rounded-full" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredRecordNav.map((item) => {
                  const isLogbook = item.href === "/logbook"
                  const showLogbookBadge = isLogbook && logbookCount > 0

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-11 transition-all"
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <item.icon className="size-[18px] opacity-80" />
                            {showLogbookBadge && (
                              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-extrabold text-white shadow-md ring-1 ring-slate-900 group-data-[collapsible=icon]:flex hidden">
                                {logbookCount > 9 ? "9+" : logbookCount}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-[14px] flex-1 group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                          {showLogbookBadge && (
                            <span className="ml-auto shrink-0 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-blue-500 text-[11px] font-extrabold text-white shadow-md group-data-[collapsible=icon]:hidden">
                              {logbookCount > 99 ? "99+" : logbookCount}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 flex flex-col gap-3 bg-transparent mt-auto group-data-[collapsible=icon]:hidden">
        
        {/* ✅ 3. เปลี่ยนกล่อง Profile เป็น Button เพื่อให้กดได้ */}
        <button 
          onClick={() => setProfileOpen(true)}
          className="w-full flex items-center gap-3 bg-slate-800/40 hover:bg-slate-800/80 p-3.5 rounded-2xl border border-white/5 backdrop-blur-sm transition-all text-left group cursor-pointer"
        >
          <Avatar className="size-10 border border-white/10 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
            <AvatarFallback className="bg-amber-500 text-white text-lg font-bold uppercase">
              {user?.name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="text-[14px] font-bold text-white truncate group-hover:text-blue-300 transition-colors">
              {user?.name ?? "ไม่ทราบชื่อ"}
            </span>
            <span className="text-[11px] text-white/50 truncate font-medium mt-0.5 group-hover:hidden">
              {getRoleLabel(role)}
            </span>
            <span className="text-[11px] text-blue-300 truncate font-medium mt-0.5 hidden group-hover:block">
              แก้ไขโปรไฟล์
            </span>
          </div>
        </button>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white h-12 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="size-4" /> ออกจากระบบ
        </Button>
      </SidebarFooter>

      {/* Collapsed footer */}
      <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-3 p-3 mt-auto">
        {/* ✅ 4. ให้ Sidebar แบบหุบ กดรูป Profile ได้ด้วย */}
        <button 
          onClick={() => setProfileOpen(true)}
          className="rounded-full hover:scale-110 transition-transform cursor-pointer" 
          title="แก้ไขโปรไฟล์"
        >
          <Avatar className="size-8 border border-white/10 shadow-sm shrink-0">
            <AvatarFallback className="bg-amber-500 text-white text-xs font-bold uppercase">
              {user?.name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
        </button>
        
        <Button
          variant="ghost" size="icon" onClick={handleLogout}
          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors h-10 w-10 rounded-xl cursor-pointer"
          title="ออกจากระบบ"
        >
          <LogOut className="size-5" />
        </Button>
      </div>

      {/* ✅ 5. ฝัง Dialog ไว้ที่จุดท้ายสุดของ Component */}
      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />

    </Sidebar>
  )
}