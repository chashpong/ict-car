"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { supabase } from "./supabase"

const AuthContext = createContext(undefined)
const SESSION_KEY = "vms_session"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const fetching = useRef(false);

  const fetchProfile = async (authUser) => {
    if (fetching.current) return;

    try {
      fetching.current = true;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.warn("⚠️ ไม่พบข้อมูลโปรไฟล์ในตาราง profiles");
        const guestData = {
          id: authUser.id,
          email: authUser.email,
          name: "รอยืนยันสิทธิ์",
          role: "user" 
        };
        setUser(guestData);
        return guestData;
      }

      const userData = {
        id: authUser.id,
        email: authUser.email,
        name: data.full_name,
        role: data.role,
        department: data.department || "ไม่ระบุ"
      };

      setUser(userData);
      localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      return userData;

    } catch (err) {
      if (!err.message.includes("lock")) {
        console.error("Error fetching profile:", err.message);
      }
      return null;
    } finally {
      fetching.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        await fetchProfile(session.user);
      } else {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && mounted) {
        await fetchProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };

      const profile = await fetchProfile(data.user);
      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อ" };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

/**
 * ✅ แก้ไขส่วนการเข้าถึงเมนู (Access Control)
 * เพิ่ม /logs ให้ admin สามารถเข้าถึงได้
 */
const ROLE_MENU_ACCESS = {
  // admin เข้าถึงได้ทุกหน้า
  admin: ["/", "/vehicles", "/drivers", "/users", "/bookings", "/approvals", "/history", "/logbook", "/maintenance", "/reports", "/logs"],
  
  // ✅ เอา "/" ออกจาก approver เพื่อไม่ให้ระบบอนุญาตให้เข้าหน้าหลัก
  approver: ["/bookings", "/approvals", "/history", "/reports"],
  
  driver: ["/logbook"],
  user: ["/bookings"],
}

export function canAccessRoute(role, route) {
  if (!role) return false
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
  return labels[role] || "ไม่ระบุสิทธิ์"
}

export function getRoleBadgeColor(role) {
  const colors = {
    admin: "bg-red-100 text-red-700 border-red-200",
    approver: "bg-purple-100 text-purple-700 border-purple-200",
    driver: "bg-amber-100 text-amber-700 border-amber-200",
    user: "bg-blue-100 text-blue-700 border-blue-200",
  }
  return colors[role] || "bg-gray-100 text-gray-700"
}