import { Check } from "lucide-react";

export function Form3Document({ 
  booking, 
  driverName, 
  vehiclePlate, 
  signatureImage,
  adminName,      
  startMileage,   
  endMileage      
}) {
  const getThaiMonth = (dateStr) => {
    if (!dateStr) return ".........................";
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return months[new Date(dateStr).getMonth()];
  }
  
  const getThaiDay = (dateStr) => dateStr ? new Date(dateStr).getDate() : ".........";
  const getThaiYear = (dateStr) => dateStr ? new Date(dateStr).getFullYear() + 543 : ".........";
  const getTime = (timeStr) => timeStr ? timeStr.substring(0, 5) : ".........";

  const today = new Date();

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}} />

      {/* ✅ ปรับลด print:px-[20mm] เป็น print:px-[12mm] เพื่อคืนพื้นที่ซ้ายขวาให้ประโยคยาวๆ */}
      <div className="bg-white text-black p-10 md:p-14 print:py-[15mm] print:px-[12mm] w-full max-w-[210mm] mx-auto h-auto min-h-[297mm] print:h-auto print:min-h-0 shadow-lg print:shadow-none border border-slate-200 print:border-none font-sarabun text-[15px] leading-relaxed relative box-border flex flex-col">
        
        <div className="absolute top-8 right-12 print:top-[15mm] print:right-[15mm] font-bold text-sm text-black">แบบ ๓</div>
        
        <div className="text-center font-bold text-xl mb-4 mt-2 print:mt-0 text-black">
          ใบขออนุญาตใช้รถส่วนกลาง
        </div>

        <div className="text-right mb-4 text-black">
          วันที่ {today.getDate()} เดือน {getThaiMonth(today)} พ.ศ. {today.getFullYear() + 543}
        </div>

        <div className="mb-3 text-black">
          <span className="font-bold">เรียน</span> ผอ.ศสข. ๔ (นม)
        </div>

        <div className="indent-12 mb-2 text-black">
          ข้าพเจ้า <span className="border-b border-dotted border-black inline-block px-4 min-w-[200px] text-center font-bold">{booking?.user_name}</span> 
          ตำแหน่ง <span className="border-b border-dotted border-black inline-block px-4 min-w-[200px] text-center">{booking?.position || ".................................................."}</span> ศสข.๔ (นม)
        </div>

        <div className="mb-2 text-black">
          ขออนุญาตใช้รถส่วนกลางของสำนักงาน เพื่อไปราชการที่ <span className="border-b border-dotted border-black inline-block px-4 min-w-[300px] text-center font-bold">{booking?.destination}</span>
        </div>

        <div className="mb-2 text-black">
          เพื่อปฏิบัติราชการเกี่ยวกับเรื่อง <span className="border-b border-dotted border-black inline-block px-4 min-w-[450px] text-center font-bold">{booking?.purpose || "........................................................................"}</span>
        </div>

        <div className="mb-2 text-black">
          มีผู้นั่งไปในครั้งนี้ จำนวน <span className="border-b border-dotted border-black inline-block px-4 min-w-[50px] text-center font-bold">{booking?.passengers}</span> คน 
          ขอใช้รถในวันที่ <span className="border-b border-dotted border-black inline-block px-2 min-w-[40px] text-center font-bold">{getThaiDay(booking?.start_date)}</span> 
          เดือน <span className="border-b border-dotted border-black inline-block px-2 min-w-[100px] text-center font-bold">{getThaiMonth(booking?.start_date)}</span> 
          พ.ศ. <span className="border-b border-dotted border-black inline-block px-2 min-w-[60px] text-center font-bold">{getThaiYear(booking?.start_date)}</span>
        </div>

        <div className="mb-4 text-black">
          เวลา <span className="border-b border-dotted border-black inline-block px-2 min-w-[60px] text-center font-bold">{getTime(booking?.start_time)}</span> น. 
          ถึงวันที่ <span className="border-b border-dotted border-black inline-block px-2 min-w-[40px] text-center font-bold">{getThaiDay(booking?.end_date)}</span> 
          เดือน <span className="border-b border-dotted border-black inline-block px-2 min-w-[100px] text-center font-bold">{getThaiMonth(booking?.end_date)}</span> 
          พ.ศ. <span className="border-b border-dotted border-black inline-block px-2 min-w-[60px] text-center font-bold">{getThaiYear(booking?.end_date)}</span> 
          เวลา <span className="border-b border-dotted border-black inline-block px-2 min-w-[60px] text-center font-bold">{getTime(booking?.end_time)}</span> น.
        </div>

        {/* ส่วนลายเซ็นผู้ขอ */}
        <div className="flex flex-col items-end mb-4 pr-12 text-black">
          <div className="mb-1 flex items-end">
            <span className="mr-2">ลงชื่อ</span>
            <span className="border-b border-dotted border-black inline-block w-[200px] text-center font-bold">
              {booking?.user_name}
            </span>
            <span className="ml-2">ผู้ขออนุญาตใช้รถ</span>
          </div>
          <div className="mb-1 text-center w-[200px] mr-24">
            ({booking?.user_name})
          </div>
          <div className="flex items-end">
            <span className="mr-2">ตำแหน่ง</span>
            <span className="border-b border-dotted border-black inline-block w-[200px] text-center">{booking?.position || "......................................."}</span>
          </div>
        </div>

        {/* ✅ ลดความยาวเส้น min-w-[150px] เป็น [100px] ลด px-4 เป็น px-2 และใช้ whitespace-nowrap ป้องกันการตัดคำมั่วซั่ว */}
        <div className="indent-12 mb-2 text-black whitespace-nowrap">
          ได้ตรวจสอบแล้ว มีรถว่างอยู่ จึงเห็นสมควรอนุญาตใช้รถ หมายเลขทะเบียน <span className="border-b border-dotted border-black inline-block px-2 min-w-[100px] text-center font-bold">{vehiclePlate || ".................."}</span>
        </div>
        
        <div className="mb-2 text-black">
          โดยมี <span className="border-b border-dotted border-black inline-block px-4 min-w-[250px] text-center font-bold">{driverName || "............................................................"}</span> เป็นพนักงานขับรถ
        </div>

        {/* ส่วนแสดงเลขไมล์ */}
        <div className="mb-4 text-black">
          เลขไมล์ก่อนไป <span className="border-b border-dotted border-black inline-block w-[150px] text-center font-bold">
            {startMileage || "..........................."}
          </span> 
          เลขไมล์หลังไป <span className="border-b border-dotted border-black inline-block w-[150px] text-center font-bold">
            {endMileage || "..........................."}
          </span>
        </div>

        {/* ส่วนลงชื่อเจ้าหน้าที่จัดรถ */}
        <div className="flex flex-col items-center pl-32 mb-4 text-center text-black">
          <div className="mb-1 flex items-end">
            <span className="mr-2">ลงชื่อ</span>
            <span className="border-b border-dotted border-black inline-block w-[200px] font-bold">
              {adminName || "............................................................"}
            </span>
          </div>
          <div className="mb-1 w-[200px] ml-8">
            ({adminName || "............................................................"})
          </div>
          <div className="flex items-end ml-8">
            <span className="mr-2">ตำแหน่ง</span>
            <span className="border-b border-dotted border-black inline-block w-[200px] text-center">เจ้าหน้าที่จัดรถ</span>
          </div>
        </div>

        {/* ✅ แก้ print:mt-40 ให้กลับมาเป็น print:mt-4 */}
        <div className="indent-12 font-bold mb-2 text-black mt-6 print:mt-46">
          ความเห็นของผู้มีอำนาจสั่งการให้ใช้รถยนต์
        </div>
        
        <div className="flex flex-col ml-32 mb-3 space-y-1 text-black">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border border-black flex items-center justify-center">
              {signatureImage && <Check className="size-4 text-black" />}
            </div>
            <span>อนุญาต</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border border-black"></div>
            <span>ไม่อนุญาต</span>
          </div>
        </div>

        <div className="flex flex-col items-center pl-32 text-black mb-0">
          <div className="mb-1 flex items-end relative h-16">
            <span className="mr-2 pb-2">(ลงชื่อ)</span>
            <div className="border-b border-dotted border-black inline-block w-[200px] relative h-full">
              {signatureImage && (
                <img 
                  src={signatureImage} 
                  alt="signature" 
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 max-h-24 max-w-[180px] object-contain mix-blend-multiply" 
                />
              )}
            </div>
          </div>
          <div className="mb-1 text-center w-[200px] ml-10">
            (............................................................)
          </div>
          <div className="flex items-end ml-10">
            <span className="mr-2">ตำแหน่ง</span>
            <span className="border-b border-dotted border-black inline-block w-[200px] text-center">ผู้อำนวยการศูนย์ฯ</span>
          </div>
        </div>
      </div>
    </>
  );
}