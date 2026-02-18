import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter: pool } as any);
  const users = ['alice@example.com','bob@example.com'];
  for (const email of users) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) {
      console.log(email, 'not found');
      continue;
    }
    console.log('Email:', email);
    console.log('Password field:', u.password);
    console.log('Looks like bcrypt hash?:', typeof u.password === 'string' && u.password.startsWith('$2'));
    console.log('Length:', u.password ? u.password.length : 0);
    console.log('---');
  }
  await prisma.$disconnect();
}

main().catch((e)=>{ console.error(e); process.exit(1); });
