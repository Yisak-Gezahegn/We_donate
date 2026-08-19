import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.user.upsert({
    where: { email: 'superadmin@wedonate.et' },
    update: {},
    create: { id: uuidv4(), firstName: 'Super', lastName: 'Admin', email: 'superadmin@wedonate.et', password: 'superadmin123', role: 'SUPER_ADMIN', isVerified: true },
  });

  await prisma.user.upsert({
    where: { email: 'cityadmin@adama.et' },
    update: {},
    create: { id: uuidv4(), firstName: 'City', lastName: 'Administrator', email: 'cityadmin@adama.et', password: 'cityadmin123', role: 'CITY_ADMIN', isVerified: true },
  });

  const donor = await prisma.user.upsert({
    where: { email: 'abebe@example.com' },
    update: {},
    create: { id: uuidv4(), firstName: 'Abebe', lastName: 'Kebede', email: 'abebe@example.com', phone: '+251911234567', password: 'user123', role: 'USER', isVerified: true },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'liya@example.com' },
    update: {},
    create: { id: uuidv4(), firstName: 'Liya', lastName: 'Tadesse', email: 'liya@example.com', phone: '+251922345678', password: 'user123', role: 'USER', isVerified: true },
  });

  // Sample approved support requests
  await prisma.supportRequest.createMany({
    skipDuplicates: true,
    data: [
      { id: uuidv4(), userId: donor.id, title: 'Food for My Family', description: 'My family of 5 needs food support after losing our income source. We have 3 young children.', category: 'FOOD', urgencyLevel: 5, goalAmount: 5000, raisedAmount: 1200, status: 'APPROVED' },
      { id: uuidv4(), userId: user2.id, title: 'Medical Treatment Support', description: 'I need financial help for my mother\'s surgery. The total cost is ETB 15,000.', category: 'MEDICINE', urgencyLevel: 5, goalAmount: 15000, raisedAmount: 4500, status: 'APPROVED' },
      { id: uuidv4(), userId: donor.id, title: 'School Supplies for Children', description: 'Three children need school uniforms and supplies to continue their education.', category: 'CLOTHES', urgencyLevel: 3, goalAmount: 3000, raisedAmount: 800, status: 'APPROVED' },
    ],
  });

  // Sample approved campaigns
  await prisma.campaign.createMany({
    skipDuplicates: true,
    data: [
      { id: uuidv4(), userId: donor.id, title: 'Build a Community Library', description: 'Help us build a library for Adama\'s children. We need books, furniture and renovation support.', category: 'INFRASTRUCTURE', goalAmount: 150000, raisedAmount: 42000, status: 'ACTIVE', deadline: new Date('2026-12-31') },
      { id: uuidv4(), userId: user2.id, title: 'Emergency Flood Relief Fund', description: 'Families affected by recent flooding need immediate food, clothing and shelter support.', category: 'EMERGENCY', goalAmount: 200000, raisedAmount: 87500, status: 'ACTIVE', deadline: new Date('2026-09-30') },
      { id: uuidv4(), userId: donor.id, title: 'School Renovation Project', description: 'Renovating 3 classrooms in Adama Primary School to improve learning conditions.', category: 'EDUCATION', goalAmount: 80000, raisedAmount: 25000, status: 'APPROVED', deadline: new Date('2026-11-30') },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('📋 Accounts:');
  console.log('  Super Admin : superadmin@wedonate.et / superadmin123');
  console.log('  City Admin  : cityadmin@adama.et    / cityadmin123');
  console.log('  User        : abebe@example.com     / user123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
