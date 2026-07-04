const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let db;

// ฟังก์ชันเริ่มต้นฐานข้อมูล SQLite
async function initDatabase() {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    // 1. สร้างตาราง Users (ถ้ายังไม่มี)
    await db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`);

    // 2. สร้างตาราง Tasks รองรับ end_date (ถ้ายังไม่มี)
    await db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        description TEXT,
        task_date TEXT,
        end_date TEXT,
        status TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // เจนข้อมูลเริ่มต้นสำหรับการทดสอบระบบ (Seed Data)
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
        await db.run("INSERT INTO users (username, password, role) VALUES ('somchai', 'password123', 'employee')");
        await db.run("INSERT INTO users (username, password, role) VALUES ('somsri', 'password123', 'employee')");
        await db.run("INSERT INTO users (username, password, role) VALUES ('boss', 'admin123', 'admin')");
        console.log('Seed users data successfully.');
    }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. API เข้าสู่ระบบ (Login)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (user) {
            res.json({ user: { id: user.id, username: user.username, role: user.role } });
        } else {
            res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
});

// 2. API ดึงรายการแผนงาน (Get Tasks) แยกสิทธิ์ตาม Role
app.get('/api/tasks', async (req, res) => {
    const { user_id, role, target_user_id } = req.query;
    try {
        let tasks;
        if (role === 'admin') {
            // ถ้าเป็น Admin และมีการเลือกตัวกรองรายคน
            if (target_user_id) {
                tasks = await db.all('SELECT tasks.*, users.username FROM tasks JOIN users ON tasks.user_id = users.id WHERE tasks.user_id = ?', [target_user_id]);
            } else {
                // ถ้าเป็น Admin ดูทั้งหมดของทุกคน
                tasks = await db.all('SELECT tasks.*, users.username FROM tasks JOIN users ON tasks.user_id = users.id');
            }
        } else {
            // ถ้าเป็นพนักงานทั่วไป ดูได้เฉพาะของตัวเอง
            tasks = await db.all('SELECT * FROM tasks WHERE user_id = ?', [user_id]);
        }
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'ดึงข้อมูลแผนงานไม่สำเร็จ' });
    }
});

// 3. API สร้างแผนงานใหม่ (Create Task) รองรับช่วงวันที่ข้ามวัน
app.post('/api/tasks', async (req, res) => {
    const { user_id, title, description, task_date, end_date } = req.body;
    try {
        await db.run(
            'INSERT INTO tasks (user_id, title, description, task_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, title, description, task_date, end_date || task_date, 'pending']
        );
        res.json({ message: 'สร้างแผนงานสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: 'สร้างแผนงานไม่สำเร็จ' });
    }
});

// 4. API แก้ไขข้อมูลแผนงาน หรืออัปเดตสถานะ (Update Task)
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, status, task_date, end_date, user_id } = req.body;
    try {
        // กรณีพนักงานทั่วไปหรือ Admin อัปเดตเฉพาะสถานะงาน (Status Only)
        if (status && !title) {
            await db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
        } else {
            // กรณี Admin แก้ไขเนื้อหา รายละเอียด หรือเปลี่ยนช่วงวันที่และสิทธิ์ผู้รับผิดชอบงาน
            await db.run(
                'UPDATE tasks SET title = ?, description = ?, task_date = ?, end_date = ?, user_id = ? WHERE id = ?',
                [title, description, task_date, end_date, user_id, id]
            );
        }
        res.json({ message: 'อัปเดตแผนงานเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: 'อัปเดตแผนงานไม่สำเร็จ' });
    }
});

// 5. API ลบแผนงานออกจากระบบ (Delete Task)
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM tasks WHERE id = ?', [id]);
        res.json({ message: 'ลบแผนงานเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: 'ลบข้อมูลไม่สำเร็จ' });
    }
});

// กำหนดพอร์ตทำงานหลัก (ถ้าชน สามารถเปลี่ยนพอร์ตตรงนี้ได้)
const PORT = process.env.PORT || 8027;

// เริ่มรันฐานข้อมูลก่อน แล้วค่อยเปิดสวิตช์เปิดเซิร์ฟเวอร์รับ Request
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`=============================================`);
        console.log(`🚀 Server is perfectly running on port: ${PORT}`);
        console.log(`=============================================`);
    });
});
