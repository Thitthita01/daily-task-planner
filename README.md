# Daily Task Planner — Computer Engineer Intern Assignment

## 🔗 ข้อมูลการเข้าใช้งาน
- **Public URL:** http://49.0.72.38:8027
- **บัญชีสำหรับทดสอบ:**
  - พนักงาน 1: `somchai` / รหัสผ่าน: `password123` (สิทธิ์ Employee)
  - พนักงาน 2: `somsri` / รหัสผ่าน: `password123` (สิทธิ์ Employee)
  - หัวหน้างาน: `boss` / รหัสผ่าน: `admin123` (สิทธิ์ Admin)

## 🛠️ Tech Stack ที่เลือกใช้และเหตุผล
เนื่องจากโจทย์มีข้อจำกัดด้านเวลา 24 ชั่วโมง จึงพิจารณาเลือก Stack ที่เบาและเสร็จได้ไวที่สุด:
1. **Backend:** Node.js (Express) พัฒนา API ได้รวดเร็วและใช้ทรัพยากรต่ำ เหมาะสมกับการทำงานบน LXC Container
2. **Database:** SQLite เลือกใช้เนื่องจากไม่ต้องเสียเวลาติดตั้ง Database Server ขนาดใหญ่ (เช่น MySQL) ข้อมูลถูกจัดเก็บลงเป็นไฟล์เดียว จัดการง่าย ปลอดภัย และเพียงพอต่อความต้องการของระบบภายในเฟสแรก (MVP)
3. **Frontend:** HTML + JavaScript (Fetch API) และตกแต่งด้วย Tailwind CSS (CDN) เพื่อให้หน้าตาออกมาสวยงาม สแกนข้อมูลได้ง่าย (Scannability) โดยไม่ต้องเสียเวลาเซ็ตอัป Build Tools ของเฟรมเวิร์กขนาดใหญ่อย่าง React/Vue เพื่อประหยัดเวลาไปเน้นในส่วนของ Deployment

## 🚀 วิธีการรันระบบ (How to run)
1. ติดตั้ง dependencies: `npm install`
2. รันในโหมดพัฒนา: `npm run dev`
3. รันโปรดักชันผ่าน PM2: `pm2 start server.js --name "daily-task-planner"`

## ✅ สิ่งที่ทำเสร็จจริง
- ระบบจัดการสิทธิ์ผู้ใช้งาน (Role-based separation) ระหว่าง Employee และ Admin
- บอร์ดวางแผนงานประจำวันล่วงหน้าและย้อนหลัง
- ระบบอัปเดตสถานะงาน (Pending / Doing / Done)
- Deploy ขึ้นใช้งานจริงบนพอร์ต 8027 และรันผ่าน PM2 เพื่อความเสถียร
