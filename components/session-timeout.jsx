"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import Swal from "sweetalert2"

export function SessionTimeout() {
  const { user, logout } = useAuth()

  useEffect(() => {
    // ถ้ายังไม่ได้ล็อกอิน ไม่ต้องเริ่มจับเวลา
    if (!user) return; 

    let timeoutId;
    
    // ⏱️ ตั้งค่าเวลาที่จะให้ออกจากระบบ (ตั้งไว้ที่ 30 นาที)
    const TIMEOUT_MINUTES = 30; // สำหรับทดสอบใช้ 0.1 นาที (6 วินาที) จริงๆ ควรตั้งเป็น 30
    const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

    // ฟังก์ชันที่จะทำงานเมื่อหมดเวลา
    const handleIdle = async () => {
      await logout(); // สั่งออกจากระบบ
      
      // โชว์แจ้งเตือนว่าหมดเวลาแล้ว
      Swal.fire({
        icon: 'warning',
        title: 'เซสชันหมดอายุ',
        text: 'คุณไม่ได้ใช้งานระบบเป็นเวลานาน เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่',
        confirmButtonColor: '#1e3a5f',
        confirmButtonText: 'รับทราบ',
        allowOutsideClick: false
      }).then(() => {
        window.location.href = "/login"; // เตะกลับหน้า Login
      });
    };

    // ฟังก์ชันสำหรับรีเซ็ตเวลาใหม่ทุกครั้งที่มีการขยับ
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleIdle, TIMEOUT_MS);
    };

    // รายการพฤติกรรมของยูสเซอร์ที่จะนับว่า "มีการใช้งานอยู่"
    const events = [
      'mousemove', 'keydown', 'wheel', 'click', 'scroll', 'touchstart'
    ];

    // ผูก Event Listener เข้ากับหน้าเว็บ
    events.forEach(event => document.addEventListener(event, resetTimer));

    // เริ่มจับเวลาครั้งแรก
    resetTimer();

    // คืนค่า (Cleanup) เมื่อปิดหน้าเว็บ หรือ Component ถูกทำลาย
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  // Component นี้ทำงานอยู่เบื้องหลัง ไม่ต้องแสดง UI อะไรบนหน้าเว็บ
  return null; 
}