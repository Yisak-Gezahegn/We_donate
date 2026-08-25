import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with baseline setup data...');

  const password = await bcrypt.hash('devpass123', 12);

  // 1. Seed 5 Kebeles
  const kebelesData = [
    { id: 'K-01', name: 'Kebele 1' },
    { id: 'K-02', name: 'Kebele 2' },
    { id: 'K-03', name: 'Kebele 3' },
    { id: 'K-04', name: 'Kebele 4' },
    { id: 'K-05', name: 'Kebele 5' },
  ];

  for (const k of kebelesData) {
    await prisma.kebele.upsert({
      where: { name: k.name },
      update: {},
      create: { id: k.id, name: k.name, status: 'ACTIVE' },
    });
  }

  // 2. Seed SYSTEM_ADMIN
  await prisma.user.upsert({
    where: { email: 'sysadmin@wedonate.et' },
    update: { password: password },
    create: { 
      id: uuidv4(), 
      firstName: 'System', 
      lastName: 'Admin', 
      email: 'sysadmin@wedonate.et', 
      password: password, 
      role: 'SYSTEM_ADMIN', 
      verificationStatus: 'VERIFIED' 
    },
  });

  // 3. Seed CITY_ADMIN
  await prisma.user.upsert({
    where: { email: 'cityadmin@adama.et' },
    update: { password: password },
    create: { 
      id: uuidv4(), 
      firstName: 'City', 
      lastName: 'Admin', 
      email: 'cityadmin@adama.et', 
      password: password, 
      role: 'CITY_ADMIN', 
      verificationStatus: 'VERIFIED' 
    },
  });

  // 4. Seed KEBELE_ADMINs
  for (let i = 1; i <= 5; i++) {
    await prisma.user.upsert({
      where: { email: `kebeleadmin${i}@adama.et` },
      update: { password: password },
      create: { 
        id: uuidv4(), 
        firstName: 'Kebele', 
        lastName: `Admin ${i}`, 
        email: `kebeleadmin${i}@adama.et`, 
        password: password, 
        role: 'KEBELE_ADMIN', 
        kebeleId: `K-0${i}`, 
        verificationStatus: 'VERIFIED' 
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('📋 Credentials (Password for all is devpass123):');
  console.log('  SYSTEM_ADMIN : sysadmin@wedonate.et');
  console.log('  CITY_ADMIN   : cityadmin@adama.et');
  console.log('  KEBELE_ADMIN 1: kebeleadmin1@adama.et');
  console.log('  KEBELE_ADMIN 2: kebeleadmin2@adama.et');
  console.log('  KEBELE_ADMIN 3: kebeleadmin3@adama.et');
  console.log('  KEBELE_ADMIN 4: kebeleadmin4@adama.et');
  console.log('  KEBELE_ADMIN 5: kebeleadmin5@adama.et');
}

main().catch(console.error).finally(() => prisma.$disconnect());
