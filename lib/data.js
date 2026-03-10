// Mock Data
export const vehicles = [
  { id: "v1", licensePlate: "กข 1234", brand: "Toyota", model: "Hilux Revo", year: 2023, type: "กระบะ", status: "available", lastMileage: 45230 },
  { id: "v2", licensePlate: "คง 5678", brand: "Toyota", model: "Camry", year: 2022, type: "เก๋ง", status: "in-use", lastMileage: 67890 },
  { id: "v3", licensePlate: "จฉ 9012", brand: "Isuzu", model: "D-Max", year: 2023, type: "กระบะ", status: "available", lastMileage: 23450 },
  { id: "v4", licensePlate: "ชซ 3456", brand: "Toyota", model: "Innova", year: 2021, type: "อเนกประสงค์", status: "maintenance", lastMileage: 89120 },
  { id: "v5", licensePlate: "ฌญ 7890", brand: "Honda", model: "City", year: 2024, type: "เก๋ง", status: "available", lastMileage: 12300 },
  { id: "v6", licensePlate: "ฎฏ 2345", brand: "Nissan", model: "Navara", year: 2022, type: "กระบะ", status: "in-use", lastMileage: 56780 },
  { id: "v7", licensePlate: "ฐฑ 6789", brand: "Toyota", model: "Fortuner", year: 2023, type: "อเนกประสงค์", status: "available", lastMileage: 34560 },
  { id: "v8", licensePlate: "ฒณ 0123", brand: "Mitsubishi", model: "Triton", year: 2021, type: "กระบะ", status: "maintenance", lastMileage: 98760 },
]

export const bookings = [
  { id: "b1", userId: "u1", userName: "สมชาย ใจดี", department: "ฝ่ายบุคคล", date: "2026-02-17", startTime: "08:00", endTime: "12:00", destination: "ศาลากลาง จ.นครราชสีมา", purpose: "ประชุมราชการ", passengers: 3, status: "pending" },
  { id: "b2", userId: "u2", userName: "สมหญิง รักงาน", department: "ฝ่ายการเงิน", date: "2026-02-17", startTime: "09:00", endTime: "16:00", destination: "สำนักงบประมาณ กรุงเทพฯ", purpose: "ส่งเอกสาร", passengers: 2, status: "approved", vehicleId: "v2", vehiclePlate: "คง 5678", driverId: "d1", driverName: "ประสิทธิ์ ขับดี" },
  { id: "b3", userId: "u3", userName: "วิชัย สุขใจ", department: "ฝ่ายพัสดุ", date: "2026-02-18", startTime: "07:30", endTime: "17:00", destination: "คลังจังหวัด", purpose: "ตรวจรับพัสดุ", passengers: 4, status: "approved", vehicleId: "v6", vehiclePlate: "ฎฏ 2345", driverId: "d2", driverName: "สมศักดิ์ วิ่งเร็ว" },
  { id: "b4", userId: "u4", userName: "นภา สวยงาม", department: "ฝ่ายธุรการ", date: "2026-02-18", startTime: "10:00", endTime: "14:00", destination: "ไปรษณีย์กลาง", purpose: "ส่งไปรษณีย์ราชการ", passengers: 1, status: "rejected" },
  { id: "b5", userId: "u5", userName: "ธนกร มั่นคง", department: "ฝ่ายแผน", date: "2026-02-19", startTime: "08:00", endTime: "17:00", destination: "สำนักงานจังหวัด", purpose: "ประชุมแผนงบประมาณ", passengers: 5, status: "pending" },
  { id: "b6", userId: "u6", userName: "พรรณี ดีใจ", department: "ฝ่ายนโยบาย", date: "2026-02-19", startTime: "13:00", endTime: "16:00", destination: "อำเภอเมือง", purpose: "ติดต่อราชการ", passengers: 2, status: "pending" },
]

export const logEntries = [
  { id: "l1", date: "2026-02-15", vehicleId: "v2", vehiclePlate: "คง 5678", driverId: "d1", driverName: "ประสิทธิ์ ขับดี", startMileage: 67500, endMileage: 67890, distance: 390, fuelLiters: 35, fuelCost: 1225, hasReceipt: true },
  { id: "l2", date: "2026-02-14", vehicleId: "v1", vehiclePlate: "กข 1234", driverId: "d2", driverName: "สมศักดิ์ วิ่งเร็ว", startMileage: 44980, endMileage: 45230, distance: 250, fuelLiters: 22, fuelCost: 770, hasReceipt: true },
  { id: "l3", date: "2026-02-13", vehicleId: "v3", vehiclePlate: "จฉ 9012", driverId: "d1", driverName: "ประสิทธิ์ ขับดี", startMileage: 23200, endMileage: 23450, distance: 250, fuelLiters: 20, fuelCost: 700, hasReceipt: false },
  { id: "l4", date: "2026-02-12", vehicleId: "v6", vehiclePlate: "ฎฏ 2345", driverId: "d3", driverName: "วิทยา นำทาง", startMileage: 56400, endMileage: 56780, distance: 380, fuelLiters: 32, fuelCost: 1120, hasReceipt: true },
  { id: "l5", date: "2026-02-11", vehicleId: "v7", vehiclePlate: "ฐฑ 6789", driverId: "d2", driverName: "สมศักดิ์ วิ่งเร็ว", startMileage: 34200, endMileage: 34560, distance: 360, fuelLiters: 30, fuelCost: 1050, hasReceipt: true },
  { id: "l6", date: "2026-02-10", vehicleId: "v5", vehiclePlate: "ฌญ 7890", driverId: "d1", driverName: "ประสิทธิ์ ขับดี", startMileage: 12100, endMileage: 12300, distance: 200, fuelLiters: 15, fuelCost: 525, hasReceipt: true },
]

export const maintenanceRecords = [
  { id: "m1", vehicleId: "v4", vehiclePlate: "ชซ 3456", type: "เปลี่ยนถ่ายน้ำมันเครื่อง", date: "2026-02-10", cost: 3500, nextDue: "2026-05-10", description: "เปลี่ยนน้ำมันเครื่องและกรอง" },
  { id: "m2", vehicleId: "v8", vehiclePlate: "ฒณ 0123", type: "ซ่อมระบบเบรก", date: "2026-02-08", cost: 8500, nextDue: "2026-08-08", description: "เปลี่ยนผ้าเบรกหน้า-หลัง" },
  { id: "m3", vehicleId: "v1", vehiclePlate: "กข 1234", type: "ตรวจเช็คระยะ", date: "2026-01-20", cost: 2800, nextDue: "2026-04-20", description: "เช็คระยะ 40,000 กม." },
  { id: "m4", vehicleId: "v2", vehiclePlate: "คง 5678", type: "เปลี่ยนยาง", date: "2026-01-15", cost: 16000, nextDue: "2027-01-15", description: "เปลี่ยนยาง 4 เส้น" },
  { id: "m5", vehicleId: "v6", vehiclePlate: "ฎฏ 2345", type: "ซ่อมแอร์", date: "2026-02-05", cost: 5500, nextDue: "2026-08-05", description: "เติมน้ำยาแอร์และตรวจสอบระบบ" },
]

export const drivers = [
  { id: "d1", name: "ประสิทธิ์ ขับดี", phone: "081-234-5678" },
  { id: "d2", name: "สมศักดิ์ วิ่งเร็ว", phone: "082-345-6789" },
  { id: "d3", name: "วิทยา นำทาง", phone: "083-456-7890" },
]

// Monthly usage data for charts
export const monthlyUsageData = [
  { month: "ก.ย.", trips: 42, fuel: 18500 },
  { month: "ต.ค.", trips: 38, fuel: 16200 },
  { month: "พ.ย.", trips: 45, fuel: 19800 },
  { month: "ธ.ค.", trips: 35, fuel: 15400 },
  { month: "ม.ค.", trips: 48, fuel: 21000 },
  { month: "ก.พ.", trips: 32, fuel: 14200 },
]

export const vehicleUsageData = [
  { name: "กข 1234", trips: 28 },
  { name: "คง 5678", trips: 35 },
  { name: "จฉ 9012", trips: 22 },
  { name: "ชซ 3456", trips: 15 },
  { name: "ฌญ 7890", trips: 18 },
]

export const fuelExpenseData = [
  { month: "ก.ย.", cost: 18500 },
  { month: "ต.ค.", cost: 16200 },
  { month: "พ.ย.", cost: 19800 },
  { month: "ธ.ค.", cost: 15400 },
  { month: "ม.ค.", cost: 21000 },
  { month: "ก.พ.", cost: 14200 },
]
