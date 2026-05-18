import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { SessionTimeout } from '@/components/session-timeout' // ✅ 1. เพิ่มการนำเข้าระบบตรวจจับเวลา
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

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
    <html lang="th">
      <body className="font-sans antialiased">
        <AuthProvider>
          {/* ✅ 2. วาง SessionTimeout ไว้ภายใน AuthProvider เพื่อให้ระบบเริ่มเฝ้าระวังการใช้งาน */}
          <SessionTimeout /> 
          
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}