import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedSuperAdmin = await bcrypt.hash('superadmin123', 12);
  const hashedCityAdmin = await bcrypt.hash('cityadmin123', 12);
  const hashedKebeleAdmin = await bcrypt.hash('kebeleadmin123', 12);
  const hashedOrganization = await bcrypt.hash('organization123', 12);
  const hashedUser = await bcrypt.hash('user123', 12);

  await prisma.user.upsert({
    where: { email: 'superadmin@wedonate.et' },
    update: { password: hashedSuperAdmin },
    create: { id: uuidv4(), firstName: 'Super', lastName: 'Admin', email: 'superadmin@wedonate.et', password: hashedSuperAdmin, role: 'SYSTEM_ADMIN', verificationStatus: 'VERIFIED' },
  });

  await prisma.user.upsert({
    where: { email: 'cityadmin@adama.et' },
    update: { password: hashedCityAdmin },
    create: { id: uuidv4(), firstName: 'City', lastName: 'Administrator', email: 'cityadmin@adama.et', password: hashedCityAdmin, role: 'CITY_ADMIN', verificationStatus: 'VERIFIED' },
  });

  await prisma.user.upsert({
    where: { email: 'kebeleadmin@adama.et' },
    update: { password: hashedKebeleAdmin },
    create: { id: uuidv4(), firstName: 'Kebele', lastName: 'Administrator', email: 'kebeleadmin@adama.et', password: hashedKebeleAdmin, role: 'KEBELE_ADMIN', kebeleId: 'K-01', verificationStatus: 'VERIFIED' },
  });

  await prisma.user.upsert({
    where: { email: 'org@example.com' },
    update: { password: hashedOrganization },
    create: { id: uuidv4(), firstName: 'Org', lastName: 'Representative', email: 'org@example.com', password: hashedOrganization, role: 'ORGANIZATION', orgName: 'Adama Charity', orgType: 'NGO', verificationStatus: 'VERIFIED' },
  });

  const donor = await prisma.user.upsert({
    where: { email: 'abebe@example.com' },
    update: { password: hashedUser },
    create: { id: uuidv4(), firstName: 'Abebe', lastName: 'Kebede', email: 'abebe@example.com', phone: '+251911234567', password: hashedUser, role: 'USER', verificationStatus: 'VERIFIED' },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'liya@example.com' },
    update: { password: hashedUser },
    create: { id: uuidv4(), firstName: 'Liya', lastName: 'Tadesse', email: 'liya@example.com', phone: '+251922345678', password: hashedUser, role: 'USER', verificationStatus: 'VERIFIED' },
  });

  // Sample approved support requests
  await prisma.supportRequest.createMany({
    skipDuplicates: true,
    data: [
      { id: uuidv4(), userId: donor.id, title: 'Food for My Family', description: 'My family of 5 needs food support after losing our income source. We have 3 young children.', category: 'FOOD', urgencyLevel: 5, goalAmount: 5000, raisedAmount: 1200, status: 'PUBLISHED' },
      { id: uuidv4(), userId: user2.id, title: 'Medical Treatment Support', description: 'I need financial help for my mother\'s surgery. The total cost is ETB 15,000.', category: 'MEDICINE', urgencyLevel: 5, goalAmount: 15000, raisedAmount: 4500, status: 'PUBLISHED' },
      { id: uuidv4(), userId: donor.id, title: 'School Supplies for Children', description: 'Three children need school uniforms and supplies to continue their education.', category: 'CLOTHES', urgencyLevel: 3, goalAmount: 3000, raisedAmount: 800, status: 'PUBLISHED' },
    ],
  });

  // Sample approved campaigns
  await prisma.campaign.createMany({
    skipDuplicates: true,
    data: [
      { id: uuidv4(), userId: donor.id, title: 'Build a Community Library', description: 'Help us build a library for Adama\'s children. We need books, furniture and renovation support.', category: 'INFRASTRUCTURE', goalAmount: 150000, raisedAmount: 42000, status: 'PUBLISHED', deadline: new Date('2026-12-31') },
      { id: uuidv4(), userId: user2.id, title: 'Emergency Flood Relief Fund', description: 'Families affected by recent flooding need immediate food, clothing and shelter support.', category: 'EMERGENCY', goalAmount: 200000, raisedAmount: 87500, status: 'PUBLISHED', deadline: new Date('2026-09-30') },
      { id: uuidv4(), userId: donor.id, title: 'School Renovation Project', description: 'Renovating 3 classrooms in Adama Primary School to improve learning conditions.', category: 'EDUCATION', goalAmount: 80000, raisedAmount: 25000, status: 'PUBLISHED', deadline: new Date('2026-11-30') },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('📋 Accounts:');
  console.log('  System Admin : superadmin@wedonate.et / superadmin123');
  console.log('  City Admin   : cityadmin@adama.et     / cityadmin123');
  console.log('  Kebele Admin : kebeleadmin@adama.et   / kebeleadmin123');
  console.log('  Organization : org@example.com        / organization123');
  console.log('  User         : abebe@example.com      / user123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
