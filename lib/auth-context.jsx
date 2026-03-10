"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"

const AuthContext = createContext(undefined)

// Demo users for each role
const DEMO_USERS = {
  "admin@gov.go.th": {
    password: "admin1234",
    user: {
      id: "u-admin",
      name: "ทรง งามศรี",
      email: "admin@gov.go.th",
      role: "admin",
      department: "ฝ่ายบริหารทั่วไป",
    },
  },
  "approver@gov.go.th": {
    password: "approve1234",
    user: {
      id: "u-approver",
      name: "วิรัตน์ อนุมัติ",
      email: "approver@gov.go.th",
      role: "approver",
      department: "ฝ่ายอำนวยการ",
    },
  },
  "driver@gov.go.th": {
    password: "driver1234",
    user: {
      id: "u-driver",
      name: "ประสิทธิ์ ขับดี",
      email: "driver@gov.go.th",
      role: "driver",
      department: "ฝ่ายยานพาหนะ",
    },
  },
  "user@gov.go.th": {
    password: "user1234",
    user: {
      id: "u-user",
      name: "สมชาย ใจดี",
      email: "user@gov.go.th",
      role: "user",
      department: "ฝ่ายบุคคล",
    },
  },
}

const SESSION_KEY = "vms_session"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser(parsed)
      }
    } catch {
      // ignore parse errors
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email, password, remember) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const entry = DEMO_USERS[email.toLowerCase().trim()]
    if (!entry || entry.password !== password) {
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
    }

    setUser(entry.user)
    const serialized = JSON.stringify(entry.user)
    if (remember) {
      localStorage.setItem(SESSION_KEY, serialized)
    }
    sessionStorage.setItem(SESSION_KEY, serialized)
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

// Role-based permission helper
const ROLE_MENU_ACCESS = {
  admin: ["/", "/vehicles", "/bookings", "/approvals", "/logbook", "/maintenance", "/reports"],
  approver: ["/", "/bookings", "/approvals", "/reports"],
  driver: ["/", "/logbook"],
  user: ["/", "/bookings"],
}

export function canAccessRoute(role, route) {
  return ROLE_MENU_ACCESS[role]?.includes(route) ?? false
}

export function getAccessibleRoutes(role) {
  return ROLE_MENU_ACCESS[role] ?? []
}

export function getRoleLabel(role) {
  const labels = {
    admin: "ผู้ดูแลระบบ",
    approver: "ผู้อนุมัติ",
    driver: "พนักงานขับรถ",
    user: "ผู้ใช้ทั่วไป",
  }
  return labels[role]
}

export function getRoleBadgeColor(role) {
  const colors = {
    admin: "bg-primary/15 text-primary",
    approver: "bg-chart-3/15 text-chart-3",
    driver: "bg-chart-2/15 text-chart-2",
    user: "bg-muted-foreground/15 text-muted-foreground",
  }
  return colors[role]
}
