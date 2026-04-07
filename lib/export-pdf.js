import { jsPDF } from "jspdf";
// ✅ ใช้เฉพาะไฟล์ตัวธรรมดาไฟล์เดียวพอครับ เพื่อตัดปัญหาตัวอักษรต่างดาว
import "./THSarabunNew-normal.js"; 

const getThaiDateParts = (dateString) => {
  if (!dateString) return { d: "..", m: "....................", y: "........" };
  const date = new Date(dateString);
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return {
    d: date.getDate().toString(),
    m: months[date.getMonth()],
    y: (date.getFullYear() + 543).toString()
  };
};

export const generateForm3PDF = (booking) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // ฟังก์ชันจำลองตัวหนา (Fake Bold) โดยใช้การวาดเส้นขอบทับ
  const setBold = () => {
    doc.setFont("THSarabunNew", "normal");
    doc.setDrawColor(0); 
    doc.setLineWidth(0.1); // เพิ่มความหนาของเส้น
    doc.textWithLink = doc.text; // กันเหนียวสำหรับบางเวอร์ชัน
  };

  const setNormal = () => {
    doc.setLineWidth(0); // กลับมาใช้เส้นปกติ
  };

  // เริ่มวาดเอกสาร
  setNormal();
  doc.setFont("THSarabunNew", "normal");
  doc.setFontSize(16); // ขนาดฟอนต์ 16pt ตามระเบียบเป๊ะ

  const now = getThaiDateParts(new Date());
  const start = getThaiDateParts(booking.start_date);
  const end = getThaiDateParts(booking.end_date);

  // --- หัวเอกสาร ---
  doc.text("แบบ ๓", 185, 15, { align: "right" }); 
  
  // ใช้ตัวหนาจำลองสำหรับหัวข้อหลัก
  doc.setLineWidth(0.15); 
  doc.text("ใบขออนุญาตใช้รถส่วนกลาง", 105, 25, { align: "center" }); 
  doc.setLineWidth(0);

  doc.text(`วันที่   ${now.d}   เดือน   ${now.m}   พ.ศ.   ${now.y}`, 185, 35, { align: "right" });
  doc.text("เรียน   ผอ.ศสข. ๔ (นม)", 25, 45); 

  // --- ส่วนที่ 1: ข้อมูลผู้ขอ ---
  doc.text(`ข้าพเจ้า   ${booking.user_name}`, 45, 55); 
  doc.text(`ตำแหน่ง   ${booking.position || '..........................................'}`, 105, 55); 
  doc.text("ศสข.๔ (นม)", 175, 55); 

  doc.text(`ขออนุญาตใช้รถส่วนกลางของสำนักงาน เพื่อไปราชการที่   ${booking.destination}`, 25, 65); 
  
  // จัดการข้อความภารกิจ
  const dutyText = `เพื่อปฏิบัติราชการเกี่ยวกับเรื่อง   ${booking.duty_details || '-'}`;
  const splitDuty = doc.splitTextToSize(dutyText, 165);
  doc.text(splitDuty, 25, 75);

  const nextY = 75 + (splitDuty.length * 7);

  doc.text(`มีผู้นั่งไปในครั้งนี้ จำนวน   ${booking.passengers}   คน`, 25, nextY);
  doc.text(`ขอใช้รถในวันที่   ${start.d}   เดือน   ${start.m}   พ.ศ.   ${start.y}`, 100, nextY); 

  doc.text(`เวลา   ${booking.start_time}   น.  ถึงวันที่   ${end.d}   เดือน   ${end.m}   พ.ศ.   ${end.y}   เวลา   ${booking.end_time}   น.`, 25, nextY + 10);

  // ส่วนลงชื่อผู้ขอ
  doc.text("ลงชื่อ .................................................... ผู้ขออนุญาตใช้รถ", 110, nextY + 30); 
  doc.text(`( ${booking.user_name} )`, 135, nextY + 40, { align: "center" });
  doc.text(`ตำแหน่ง   ${booking.position || '...................................................'}`, 135, nextY + 50, { align: "center" });

  // --- ส่วนที่ 2: เจ้าหน้าที่พัสดุ ---
  const lineY = nextY + 65;
  doc.text(`ได้ตรวจสอบแล้ว มีรถว่างอยู่ จึงเห็นสมควรอนุญาตให้ใช้รถ หมายเลขทะเบียน   ${booking.license_plate || '....................'}`, 35, lineY); 
  doc.text(`โดยมี   ${booking.driver_name || '............................................................'}   เป็นพนักงานขับรถ`, 25, lineY + 10); 
  
  // เลขไมล์ (ตามที่ถาม: พิมพ์เส้นประไว้ให้กรอกด้วยลายมือตามระเบียบครับ)
  doc.text("เลขไมล์ก่อนไป .................................................... เลขไมล์หลังไป ....................................................", 25, lineY + 20);

  // ✅ เพิ่มบรรทัดรวมระยะทางตรงนี้ครับ
  doc.text("รวมทั้งหมด....................................................กิโลเมตร", 25, lineY + 30);

  // ขยับแกน Y ลงมา 10 หน่วย เพื่อไม่ให้ทับกับบรรทัดกิโลเมตร
  doc.text("ลงชื่อ ....................................................", 110, lineY + 45);
  doc.text("(....................................................)", 135, lineY + 55, { align: "center" });
  doc.text("ตำแหน่ง ....................................................", 135, lineY + 65, { align: "center" });

  // --- ส่วนที่ 3: ความเห็นผู้อนุมัติ ---
  const approvalY = lineY + 80; // ขยับลงมาตามด้านบน
  
  // ถ้าข้อมูลยาวจนจะล้นกระดาษ ให้ขึ้นหน้า 2 อัตโนมัติครับ
  if (approvalY > 265) {
    doc.addPage();
    // (สามารถเขียนหัวกระดาษหน้า 2 เพิ่มได้ที่นี่ถ้าต้องการครับ)
  }

  doc.setLineWidth(0.15);
  doc.text("ความเห็นของผู้มีอำนาจสั่งการให้ใช้รถยนต์", 35, approvalY); 
  doc.setLineWidth(0);
  
  const isApproved = booking.status === 'approved';
  doc.text(`[ ${isApproved ? '/' : ' '} ]  อนุญาต`, 45, approvalY + 10);
  doc.text(`[ ${booking.status === 'rejected' ? '/' : ' '} ]  ไม่อนุญาต`, 45, approvalY + 20);

  // แปะรูปลายเซ็นจาก Supabase
  if (isApproved && booking.signature_url) {
    doc.addImage(booking.signature_url, 'PNG', 120, approvalY + 25, 35, 12);
  }

  doc.text("(ลงชื่อ) ....................................................", 110, approvalY + 35); 
  doc.text(`( ${isApproved ? (booking.approver_name || '.........................................') : '.........................................'} )`, 135, approvalY + 45, { align: "center" });
  doc.text(`ตำแหน่ง   ${isApproved ? (booking.approver_position || '.........................................') : '.........................................'}`, 135, approvalY + 55, { align: "center" });

  doc.save(`แบบ๓_${booking.user_name}.pdf`);
};