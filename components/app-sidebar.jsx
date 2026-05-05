"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  ClipboardCheck,
  BookOpen,
  Wrench,
  BarChart3,
  Users,
  LogOut,
  ChevronUp,
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, canAccessRoute, getRoleLabel, getRoleBadgeColor } from "@/lib/auth-context"

const mainNav = [
  { title: "แดชบอร์ด", href: "/", icon: LayoutDashboard },
  { title: "จัดการยานพาหนะ", href: "/vehicles", icon: Car },
  { title: "จัดการสมาชิก", href: "/users", icon: Users }, 
  { title: "คนขับรถ", href: "/drivers", icon: Users },
  { title: "การจองรถ", href: "/bookings", icon: CalendarCheck },
  { title: "อนุมัติคำขอ", href: "/approvals", icon: ClipboardCheck },
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

  async function handleLogout() {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      window.location.href = "/login";
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg">
            <img 
              src="/images/Thailand.png" 
              alt="MOI Logo" 
              className="size-20 object-contain" 
            />
          </div>
          {/* ✅ ปรับเป็น text-white เพื่อให้เห็นชื่อระบบชัดเจน */}
          <div className="flex flex-col group-data-[collapsible=icon]:hidden text-white">
            <span className="text-sm font-semibold leading-tight">ระบบยานพาหนะ</span>
            <span className="text-xs text-white/60">Vehicle Management</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {filteredMainNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/50">เมนูหลัก</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <Link href={item.href}>
                        <item.icon className="text-white/70" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {filteredRecordNav.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/50">บันทึกและรายงาน</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredRecordNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                        className="text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <Link href={item.href}>
                          <item.icon className="text-white/70" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip={user?.name ?? "ผู้ใช้"} className="h-auto hover:bg-white/10">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-sidebar-primary text-white text-xs">
                      {user?.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  {/* ✅ ปรับเป็น text-white เพื่อให้เห็นชื่อผู้ใช้ชัดเจน */}
                  <div className="flex flex-1 flex-col group-data-[collapsible=icon]:hidden text-left">
                    <span className="text-xs font-medium text-white">{user?.name ?? "ไม่ทราบชื่อ"}</span>
                    <span className="text-[10px] text-white/50">
                      {getRoleLabel(role)}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden text-white/50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 bg-white">
                <DropdownMenuLabel className="font-normal text-black">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <span
                      className={`mt-1 inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${getRoleBadgeColor(role)}`}
                    >
                      {getRoleLabel(role)}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  {user?.department}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer font-bold">
                  <LogOut className="mr-2 size-4" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}