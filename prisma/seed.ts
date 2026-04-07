import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Raw SQL bilan tekshirish (Prisma enum validation-ni buladiramiz)
    const result = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, email, role FROM users WHERE email = 'admin@gmail.com' LIMIT 1`
    );

    const existing = result && result.length > 0 ? result[0] : null;

    // Agar mavjud bo'lsa va rol noto'g'ri bo'lsa, yangilash
    if (existing) {
        if (existing.role !== 'SUPERADMIN') {
            console.log('SuperAdmin roli noto\'g\'ri, yangilanyapti...');
            await prisma.$executeRawUnsafe(
                `UPDATE users SET role = 'SUPERADMIN' WHERE email = 'admin@gmail.com'`
            );
            console.log('SuperAdmin roli yangilandi: SUPERADMIN');
        } else {
            console.log('SuperAdmin allaqachon mavjud to\'g\'ri rol bilan');
        }
        return;
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Parameterized query bilan yaratish (SQL injection dan xavfsiz)
    const userId = 'f2f2f249-d598-4a6d-93b6-f81801b1073b';
    await prisma.$executeRawUnsafe(
        `INSERT INTO users 
        (id, full_name, email, password, role, status, created_at, updated_at) 
        VALUES ($1::uuid, $2, $3, $4, $5, $6, NOW(), NOW())`,
        userId,
        'Super Admin',
        'admin@gmail.com',
        hashedPassword,
        'SUPERADMIN',
        'ACTIVE'
    );

    console.log('SuperAdmin yaratildi: admin@gmail.com');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
