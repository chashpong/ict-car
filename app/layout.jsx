import { Sarabun } from 'next/font/google' // ✅ 1. นำเข้าฟอนต์ Sarabun ของไทยจาก Next.js โดยตรง
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { SessionTimeout } from '@/components/session-timeout'
import './globals.css'

// ✅ 2. ตั้งค่าฟอนต์ Sarabun เพื่อให้โหลดล่วงหน้า (Preload) แบบติดจรวด
const sarabun = Sarabun({ 
  weight: ['300', '400', '500', '600', '700', '800'], // โหลดน้ำหนักตัวอักษรที่ต้องใช้
  subsets: ['thai', 'latin'], 
  display: 'swap',
  variable: '--font-sarabun', // สร้างตัวแปรให้ Tailwind ไปเรียกใช้ได้ง่ายๆ
});

export const metadata = {
  title: 'ระบบบริหารจัดการยานพาหนะราชการ',
  description: 'ระบบบริหารจัดการยานพาหนะและบันทึกการใช้รถยนต์ราชการแบบดิจิทัล - Vehicle Management System',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    // ✅ 3. นำตัวแปรฟอนต์สารบรรณมาครอบไว้ที่ tag <html> และลบ Geist ที่ไม่ได้ใช้ออก
    <html lang="th" className={`${sarabun.variable}`}>
      <body className="font-sans font-sarabun antialiased bg-slate-50 text-slate-900">
        <AuthProvider>
          <SessionTimeout /> 
          
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}