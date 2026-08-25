import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedSuperAdmin = await bcrypt.hash('superadmin123', 12);
  const hashedCityAdmin = await bcrypt.hash('cityadmin123', 12);
  const hashedKebeleAdmin = await bcrypt.hash('kebeleadmin123', 12);
  const hashedKebeleAdminB = await bcrypt.hash('kebeleadminB123', 12);
  const hashedOrganization = await bcrypt.hash('organization123', 12);
  const hashedUser = await bcrypt.hash('user123', 12);

  // Kebeles
  await prisma.kebele.upsert({
    where: { name: 'Kebele 01' },
    update: {},
    create: { id: 'K-01', name: 'Kebele 01', status: 'ACTIVE' },
  });
  await prisma.kebele.upsert({
    where: { name: 'Kebele 02' },
    update: {},
    create: { id: 'K-02', name: 'Kebele 02', status: 'ACTIVE' },
  });
  await prisma.kebele.upsert({
    where: { name: 'Kebele 03 (Inactive)' },
    update: {},
    create: { id: 'K-03', name: 'Kebele 03 (Inactive)', status: 'INACTIVE' },
  });

  await prisma.user.upsert({
    where: { email: 'superadmin@wedonate.et' },
    update: { password: hashedSuperAdmin },
    create: { id: uuidv4(), firstName: 'System', lastName: 'Admin', email: 'superadmin@wedonate.et', password: hashedSuperAdmin, role: 'SYSTEM_ADMIN', verificationStatus: 'VERIFIED' },
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
    where: { email: 'kebeleadminB@adama.et' },
    update: { password: hashedKebeleAdminB },
    create: { id: uuidv4(), firstName: 'Kebele B', lastName: 'Administrator', email: 'kebeleadminB@adama.et', password: hashedKebeleAdminB, role: 'KEBELE_ADMIN', kebeleId: 'K-02', verificationStatus: 'VERIFIED' },
  });

  await prisma.user.upsert({
    where: { email: 'org@example.com' },
    update: { password: hashedOrganization },
    create: { id: uuidv4(), firstName: 'Org', lastName: 'Representative', email: 'org@example.com', password: hashedOrganization, role: 'ORGANIZATION', orgName: 'Adama Charity', orgType: 'NGO', verificationStatus: 'VERIFIED' },
  });

  const donor = await prisma.user.upsert({
    where: { email: 'abebe@example.com' },
    update: { password: hashedUser, kebeleId: 'K-01' },
    create: { id: uuidv4(), firstName: 'Abebe', lastName: 'Kebede', email: 'abebe@example.com', phone: '+251911234567', password: hashedUser, role: 'USER', verificationStatus: 'VERIFIED', kebeleId: 'K-01' },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'liya@example.com' },
    update: { password: hashedUser, kebeleId: 'K-01' },
    create: { id: uuidv4(), firstName: 'Liya', lastName: 'Tadesse', email: 'liya@example.com', phone: '+251922345678', password: hashedUser, role: 'USER', verificationStatus: 'VERIFIED', kebeleId: 'K-01' },
  });

  const outOfScopeUser = await prisma.user.upsert({
    where: { email: 'out-of-scope@example.com' },
    update: { password: hashedUser, kebeleId: 'K-02' },
    create: { id: uuidv4(), firstName: 'Other', lastName: 'User', email: 'out-of-scope@example.com', phone: '+251933456789', password: hashedUser, role: 'USER', verificationStatus: 'VERIFIED', kebeleId: 'K-02' },
  });

  const unverifiedUser = await prisma.user.upsert({
    where: { email: 'unverified@example.com' },
    update: { password: hashedUser, kebeleId: 'K-01' },
    create: { id: uuidv4(), firstName: 'Unverified', lastName: 'Citizen', email: 'unverified@example.com', phone: '+251944567890', password: hashedUser, role: 'USER', verificationStatus: 'PENDING', kebeleId: 'K-01' },
  });

  const kebeleAdmin = await prisma.user.findUnique({ where: { email: 'kebeleadmin@adama.et' } });

  // Sample approved support requests
  await prisma.supportRequest.createMany({
    skipDuplicates: true,
    data: [
      { id: uuidv4(), userId: donor.id, title: 'Food for My Family', description: 'My family of 5 needs food support after losing our income source. We have 3 young children.', category: 'FOOD', urgencyLevel: 5, goalAmount: 5000, raisedAmount: 1200, status: 'PUBLISHED' },
      { id: uuidv4(), userId: user2.id, title: 'Medical Treatment Support', description: 'I need financial help for my mother\'s surgery. The total cost is ETB 15,000.', category: 'MEDICINE', urgencyLevel: 5, goalAmount: 15000, raisedAmount: 4500, status: 'PUBLISHED' },
      { id: uuidv4(), userId: donor.id, title: 'School Supplies for Children', description: 'Three children need school uniforms and supplies to continue their education.', category: 'CLOTHES', urgencyLevel: 3, goalAmount: 3000, raisedAmount: 800, status: 'PUBLISHED' },
      { 
        id: uuidv4(), userId: unverifiedUser.id, createdById: kebeleAdmin?.id, kebeleId: 'K-01',
        title: 'Assisted: Rebuilding Home', description: 'Beneficiary lost home in a fire and needs assistance. Request created by Kebele Admin.', category: 'OTHER', urgencyLevel: 4, goalAmount: 10000, raisedAmount: 0, status: 'PENDING_CITY_APPROVAL', source: 'ASSISTED' 
      },
      { 
        id: uuidv4(), userId: user2.id, kebeleId: 'K-01',
        title: 'Need medical wheelchair', description: 'Normal user requesting a wheelchair for grandmother.', category: 'MEDICINE', urgencyLevel: 3, goalAmount: 8000, raisedAmount: 0, status: 'PENDING_REVIEW', source: 'SELF_SERVICE' 
      },
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

  const campaign = await prisma.campaign.findFirst({ where: { userId: donor.id } });
  const request = await prisma.supportRequest.findFirst({ where: { userId: donor.id } });

  // Add some pending donations for verification workflows
  if (campaign && request) {
    await prisma.donation.createMany({
      skipDuplicates: true,
      data: [
        {
          id: uuidv4(), donorId: user2.id, amount: 500, donationType: 'MONEY', currency: 'ETB',
          paymentMethod: 'TELEBIRR', referenceCode: 'TB-PEND-123',
          campaignId: campaign.id, paymentStatus: 'PENDING'
        },
        {
          id: uuidv4(), donorId: user2.id, amount: 300, donationType: 'MONEY', currency: 'ETB',
          paymentMethod: 'CBE', referenceCode: 'CBE-PEND-456',
          supportRequestId: request.id, paymentStatus: 'PENDING'
        }
      ]
    });
  }

  console.log('✅ Seed complete!');
  console.log('📋 Accounts:');
  console.log('  System Admin : superadmin@wedonate.et / superadmin123');
  console.log('  City Admin   : cityadmin@adama.et     / cityadmin123');
  console.log('  Kebele Admin A : kebeleadmin@adama.et   / kebeleadmin123');
  console.log('  Kebele Admin B : kebeleadminB@adama.et  / kebeleadminB123');
  console.log('  Organization : org@example.com        / organization123');
  console.log('  User         : abebe@example.com      / user123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
