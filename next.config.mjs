/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // สั่งให้ Build ออกมาเป็นไฟล์ Static (HTML/CSS/JS)
  basePath: '/ict-car',      // ตั้งค่าให้ตรงกับชื่อ Repository ของคุณบน GitHub
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig