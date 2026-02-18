import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool } as any);

async function main() {
  console.log('Running seed...');

  const users = [
    { name: 'Alice', email: 'alice@example.com', password: 'password123' },
    { name: 'Bob', email: 'bob@example.com', password: 'password123' },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: hashed },
    });

    const publicTitle = `${u.name}'s Project`;
    const privateTitle = `${u.name}'s Private Board`;

    const existingPublic = await prisma.board.findFirst({ where: { title: publicTitle, ownerId: user.id } });
    if (!existingPublic) {
      await prisma.board.create({ data: { title: publicTitle, ownerId: user.id, isPublic: true } });
    }

    const existingPrivate = await prisma.board.findFirst({ where: { title: privateTitle, ownerId: user.id } });
    if (!existingPrivate) {
      await prisma.board.create({ data: { title: privateTitle, ownerId: user.id, isPublic: false } });
    }
  }

  console.log('Seed finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
