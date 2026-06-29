"use client"

import { Check } from "lucide-react";

export function Form3Document({
  booking,
  driverName,
  vehiclePlate,
  signatureImage,
  adminName,
  startMileage,
  endMileage,
  showSignatureOnLine = false // ✅ 1. เพิ่ม Prop สำหรับโชว์ลายเซ็นบนเส้น
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
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}} />

      <div className="text-black p-[15mm] w-full h-full font-sarabun text-[15px] leading-relaxed relative box-border flex flex-col bg-transparent overflow-hidden">

        <div className="absolute top-8 right-12 print:top-[15mm] print:right-[15mm] font-bold text-sm text-black">แบบ ๓</div>

        <div className="text-center font-bold text-xl mb-4 mt-2 print:mt-0 text-black">
          ใบขออนุญาตใช้รถส่วนกลาง
        </div>

        <div className="text-right mb-4 text-black">
          วันที่ {today.getDate()} เดือน {getThaiMonth(today)} พ.ศ. {today.getFullYear() + 543}
        </div>

        <div className="mt-16 mb-3 text-black">
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
        <div className="flex justify-end mb-4 pr-10 text-black">
          <div className="flex flex-col">
            <div className="flex items-end mb-1">
              <div className="w-[50px] text-right mr-2">ลงชื่อ</div>
              <div className="border-b border-dotted border-black w-[200px] text-center font-bold pb-0.5">{booking?.user_name}</div>
              <div className="ml-2 w-[110px]">ผู้ขออนุญาตใช้รถ</div>
            </div>
            <div className="flex items-end mb-1">
              <div className="w-[50px] mr-2"></div>
              <div className="w-[200px] text-center">({booking?.user_name})</div>
              <div className="ml-2 w-[110px]"></div>
            </div>
            <div className="flex items-end">
              <div className="w-[50px] text-right mr-2">ตำแหน่ง</div>
              <div className="border-b border-dotted border-black w-[200px] text-center pb-0.5">{booking?.position || "......................................."}</div>
              <div className="ml-2 w-[110px]"></div>
            </div>
          </div>
        </div>

        <div className="indent-12 mb-2 text-black whitespace-nowrap">
          ได้ตรวจสอบแล้ว มีรถว่างอยู่ จึงเห็นสมควรอนุญาตใช้รถ หมายเลขทะเบียน <span className="border-b border-dotted border-black inline-block px-2 min-w-[100px] text-center font-bold">{vehiclePlate || ".................."}</span>
        </div>

        <div className="mb-2 text-black">
          โดยมี <span className="border-b border-dotted border-black inline-block px-4 min-w-[250px] text-center font-bold">{driverName || "............................................................"}</span> เป็นพนักงานขับรถ
        </div>

        <div className="mb-4 text-black">
          เลขไมล์ก่อนไป <span className="border-b border-dotted border-black inline-block w-[150px] text-center font-bold">
            {startMileage || "..........................."}
          </span>
          เลขไมล์หลังไป <span className="border-b border-dotted border-black inline-block w-[150px] text-center font-bold">
            {endMileage || "..........................."}
          </span>
        </div>

        {/* ส่วนลงชื่อเจ้าหน้าที่จัดรถ */}
        <div className="flex justify-center mb-4 pl-32 text-black">
          <div className="flex flex-col">
            <div className="flex items-end mb-1">
              <div className="w-[50px] text-right mr-2">ลงชื่อ</div>
              <div className="border-b border-dotted border-black w-[200px] text-center font-bold pb-0.5">{adminName || "............................................................"}</div>
            </div>
            <div className="flex items-end mb-1">
              <div className="w-[50px] mr-2"></div>
              <div className="w-[200px] text-center">({adminName || "............................................................"})</div>
            </div>
            <div className="flex items-end">
              <div className="w-[50px] text-right mr-2">ตำแหน่ง</div>
              <div className="border-b border-dotted border-black w-[200px] text-center pb-0.5">เจ้าหน้าที่จัดรถ</div>
            </div>
          </div>
        </div>

        <div className="flex-grow"></div>

        <div className="indent-12 font-bold mb-2 text-black">
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

        {/* ส่วนลงชื่อ ผอ. */}
        <div className="flex justify-center mb-6 pl-32 text-black">
          <div className="flex flex-col">
            <div className="flex items-end mb-1">
              <div className="w-[50px] text-right mr-2">(ลงชื่อ)</div>
              {/* เพิ่ม class relative ให้เส้นประ เพื่อให้ลายเซ็นมาแปะทับได้แม่นยำ */}
              <div className="border-b border-dotted border-black w-[200px] text-center pb-0.5 relative">
                {signatureImage && (
                  <img
                    src={signatureImage}
                    alt="Signature"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150px] h-[60px] object-contain mix-blend-multiply"
                  />
                )}
              </div>
            </div>
            <div className="flex items-end mb-1">
              <div className="w-[50px] mr-2"></div>
              <div className="w-[200px] text-center">(............................................................)</div>
            </div>
            <div className="flex items-end">
              <div className="w-[50px] text-right mr-2">ตำแหน่ง</div>
              <div className="border-b border-dotted border-black w-[200px] text-center pb-0.5">ผู้อำนวยการศูนย์ฯ</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}