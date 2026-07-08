import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lemon-seasons.com' },
    update: {},
    create: {
      email: 'admin@lemon-seasons.com',
      password: hashedPassword,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  // Create sample periods
  const year = new Date().getFullYear();
  const periods = [
    {
      name: 'Spring Bloom',
      startDate: new Date(`${year}-03-01`),
      endDate: new Date(`${year}-05-31`),
      color: '#4ade80',
      userId: admin.id,
    },
    {
      name: 'Summer Harvest',
      startDate: new Date(`${year}-06-01`),
      endDate: new Date(`${year}-08-31`),
      color: '#fb923c',
      userId: admin.id,
    },
    {
      name: 'Autumn Reflection',
      startDate: new Date(`${year}-09-01`),
      endDate: new Date(`${year}-11-30`),
      color: '#f59e0b',
      userId: admin.id,
    },
    {
      name: 'Winter Rest',
      startDate: new Date(`${year}-12-01`),
      endDate: new Date(`${year}-12-31`),
      color: '#60a5fa',
      userId: admin.id,
    },
  ];

  for (const period of periods) {
    await prisma.period.upsert({
      where: {
        id: `seed-${period.name.toLowerCase().replace(/\s/g, '-')}`,
      },
      update: {},
      create: {
        ...period,
        id: `seed-${period.name.toLowerCase().replace(/\s/g, '-')}`,
      },
    });
  }

  console.log(`✅ Created ${periods.length} sample periods`);
  console.log('🍋 Seeding complete!');
  console.log('\nAdmin credentials:');
  console.log('  Email: admin@lemon-seasons.com');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
