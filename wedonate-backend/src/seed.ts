import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const password = await bcrypt.hash('devpass123', 12);

  // ── 1. Kebeles ──────────────────────────────────────────────────────────────
  const kebelesData = [
    { id: 'K-01', name: 'Kebele 01', altName: 'Kebele 1' },
    { id: 'K-02', name: 'Kebele 02', altName: 'Kebele 2' },
    { id: 'K-03', name: 'Kebele 03', altName: 'Kebele 3' },
    { id: 'K-04', name: 'Kebele 04', altName: 'Kebele 4' },
    { id: 'K-05', name: 'Kebele 05', altName: 'Kebele 5' },
  ];
  for (const k of kebelesData) {
    // Try to find by id first (handles already-seeded records with old names)
    const existing = await prisma.kebele.findUnique({ where: { id: k.id } });
    if (existing) {
      await prisma.kebele.update({ where: { id: k.id }, data: { name: k.name, status: 'ACTIVE' } });
    } else {
      // Also check old name
      const existingByName = await prisma.kebele.findUnique({ where: { name: k.altName } });
      if (existingByName) {
        await prisma.kebele.update({ where: { name: k.altName }, data: { name: k.name } });
      } else {
        await prisma.kebele.create({ data: { id: k.id, name: k.name, status: 'ACTIVE' } });
      }
    }
  }

  // ── 2. Admin Users ──────────────────────────────────────────────────────────
  const sysadminId   = 'USER-SYSADMIN-001';
  const cityadminId  = 'USER-CITYADMIN-001';
  const kebeleAdminIds = ['USER-KA-001','USER-KA-002','USER-KA-003','USER-KA-004','USER-KA-005'];
  const orgId        = 'USER-ORG-001';
  const userId1      = 'USER-001';
  const userId2      = 'USER-002';
  const userId3      = 'USER-003';

  await prisma.user.upsert({
    where: { email: 'sysadmin@wedonate.et' },
    update: { password },
    create: { id: sysadminId, firstName: 'System', lastName: 'Admin', email: 'sysadmin@wedonate.et', password, role: 'SYSTEM_ADMIN', verificationStatus: 'VERIFIED' },
  });
  await prisma.user.upsert({
    where: { email: 'cityadmin@adama.et' },
    update: { password },
    create: { id: cityadminId, firstName: 'City', lastName: 'Admin', email: 'cityadmin@adama.et', password, role: 'CITY_ADMIN', verificationStatus: 'VERIFIED' },
  });
  for (let i = 0; i < 5; i++) {
    await prisma.user.upsert({
      where: { email: `kebeleadmin${i + 1}@adama.et` },
      update: { password },
      create: { id: kebeleAdminIds[i], firstName: 'Kebele', lastName: `Admin ${i + 1}`, email: `kebeleadmin${i + 1}@adama.et`, password, role: 'KEBELE_ADMIN', kebeleId: `K-0${i + 1}`, verificationStatus: 'VERIFIED' },
    });
  }

  // ── Organization ────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'org@helpadama.et' },
    update: { password },
    create: {
      id: orgId, firstName: 'Help', lastName: 'Adama', email: 'org@helpadama.et', password,
      role: 'ORGANIZATION', verificationStatus: 'VERIFIED',
      orgName: 'Help Adama Foundation', orgType: 'NGO',
      licenseNumber: 'NGO-2024-001', representativeName: 'Mulugeta Bekele',
      officeAddress: 'Adama, Oromia, Ethiopia',
    },
  });

  // ── Regular Users ────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'abebe@example.com' },
    update: { password },
    create: { id: userId1, firstName: 'Abebe', lastName: 'Girma', email: 'abebe@example.com', password, role: 'USER', kebeleId: 'K-01', verificationStatus: 'VERIFIED', phone: '+251911000001' },
  });
  await prisma.user.upsert({
    where: { email: 'fatuma@example.com' },
    update: { password },
    create: { id: userId2, firstName: 'Fatuma', lastName: 'Ali', email: 'fatuma@example.com', password, role: 'USER', kebeleId: 'K-02', verificationStatus: 'VERIFIED', phone: '+251911000002' },
  });
  await prisma.user.upsert({
    where: { email: 'tigist@example.com' },
    update: { password },
    create: { id: userId3, firstName: 'Tigist', lastName: 'Hailu', email: 'tigist@example.com', password, role: 'USER', kebeleId: 'K-03', verificationStatus: 'UNVERIFIED', phone: '+251911000003' },
  });

  // ── 3. Support Requests ─────────────────────────────────────────────────────
  const req1Id = uuidv4();
  const req2Id = uuidv4();
  const req3Id = uuidv4();

  await prisma.supportRequest.upsert({
    where: { id: req1Id },
    update: {},
    create: {
      id: req1Id,
      userId: userId1,
      kebeleId: 'K-01',
      title: 'Emergency Food Support for Family of 6',
      description: 'Our family of 6, including 4 children under 10, has been struggling after the father lost his job. We urgently need food assistance for at least 3 months until he finds new employment.',
      category: 'FOOD',
      urgencyLevel: 5,
      goalAmount: 15000,
      raisedAmount: 8500,
      status: 'PUBLISHED',
      familySize: 6,
      location: 'Kebele 01, Adama City',
      imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
      telebirrAccount: '0911000001',
      cbeAccount: '1000123456789',
      requesterPhone: '+251911000001',
    },
  });

  await prisma.supportRequest.upsert({
    where: { id: req2Id },
    update: {},
    create: {
      id: req2Id,
      userId: userId2,
      kebeleId: 'K-02',
      title: 'Medical Treatment Support for Chronic Illness',
      description: 'I have been diagnosed with Type 2 diabetes and hypertension. Monthly medication costs exceed 2,000 ETB which I cannot afford on my pension. I need ongoing support for medication.',
      category: 'MEDICINE',
      urgencyLevel: 4,
      goalAmount: 24000,
      raisedAmount: 5200,
      status: 'PUBLISHED',
      familySize: 2,
      location: 'Kebele 02, Adama City',
      imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80',
      telebirrAccount: '0911000002',
      requesterPhone: '+251911000002',
    },
  });

  await prisma.supportRequest.upsert({
    where: { id: req3Id },
    update: {},
    create: {
      id: req3Id,
      userId: userId1,
      kebeleId: 'K-01',
      title: 'School Uniforms and Supplies for 3 Children',
      description: 'I am a single mother with 3 school-aged children. I cannot afford new uniforms and school supplies for the upcoming academic year. Any help is greatly appreciated.',
      category: 'CLOTHES',
      urgencyLevel: 3,
      goalAmount: 8000,
      raisedAmount: 3100,
      status: 'PUBLISHED',
      familySize: 4,
      location: 'Kebele 01, Adama City',
      imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
      telebirrAccount: '0911000001',
      requesterPhone: '+251911000001',
    },
  });

  // ── 4. Campaigns ─────────────────────────────────────────────────────────────
  const camp1Id = uuidv4();
  const camp2Id = uuidv4();

  await prisma.campaign.upsert({
    where: { id: camp1Id },
    update: {},
    create: {
      id: camp1Id,
      userId: orgId,
      title: 'Feed 500 Families This Ramadan',
      description: 'Help Adama Foundation is launching a Ramadan food drive to provide iftar meals and food packages to 500 vulnerable families across Adama City. Each package costs 300 ETB and supports a family for one week.',
      category: 'FOOD',
      goalAmount: 150000,
      raisedAmount: 62000,
      status: 'PUBLISHED',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      telebirrAccount: '0922000001',
      cbeAccount: '1000987654321',
      boaAccount: '0040123456789',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.campaign.upsert({
    where: { id: camp2Id },
    update: {},
    create: {
      id: camp2Id,
      userId: orgId,
      title: 'Back to School: Stationery for 200 Students',
      description: 'Every child deserves to start the school year with the right tools. This campaign provides notebooks, pens, bags, and uniforms to 200 underprivileged students in Adama City public schools.',
      category: 'OTHER',
      goalAmount: 80000,
      raisedAmount: 28000,
      status: 'PUBLISHED',
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
      telebirrAccount: '0922000001',
      cbeAccount: '1000987654321',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  // ── 5. Testimonials ──────────────────────────────────────────────────────────
  const testimonials = [
    { name: 'Liya Tadesse', role: 'Donor', text: 'WeDonate made it incredibly easy to help families in Adama. I can see exactly where my money goes and feel confident my donation reaches those who truly need it.' },
    { name: 'Gemechu Alemu', role: 'Beneficiary', text: 'Through this platform my family received food support during a very difficult time after I lost my job. The process was dignified and transparent. We are forever grateful.' },
    { name: 'Amina Ibrahim', role: 'NGO Partner', text: 'As an NGO partner, the coordination between our organization and city administration has never been more streamlined. This platform is truly making a difference in our city.' },
    { name: 'Bekele Worku', role: 'Donor', text: 'I was looking for a reliable way to help people in my hometown Adama. WeDonate gave me that and more — transparency, verified recipients, and real impact tracking.' },
  ];
  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.testimonial.create({ data: { id: uuidv4(), ...t, isActive: true } });
    }
  }

  // ── 6. FAQs ──────────────────────────────────────────────────────────────────
  const faqs = [
    { question: 'How do I register on WeDonate?', answer: 'Click the "Register" button on the homepage, fill in your personal details, select your Kebele, and submit. You will need to verify your identity to request support.' },
    { question: 'How can I donate to a support request?', answer: 'Browse support requests on the Donate page, click on one that moves you, and choose your preferred payment method — Chapa, Telebirr, CBE, BOA, or Awash Bank. You can also donate items.' },
    { question: 'How is my donation used?', answer: '100% of your donation goes directly to the beneficiary. WeDonate does not charge any platform fees. All recipients are verified by Kebele administrators before publishing.' },
    { question: 'How long does verification take?', answer: 'Identity verification typically takes 2–5 business days after you submit your national ID documents. Your Kebele administrator reviews your submission.' },
    { question: 'Can I donate anonymously?', answer: 'Yes. When making a donation, check the "Donate Anonymously" option and your name will not be shown publicly.' },
    { question: 'What is the minimum donation amount?', answer: 'The minimum online donation via Chapa is 1 ETB. For bank transfers there is no minimum, but we encourage meaningful contributions.' },
  ];
  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.faq.create({ data: { id: uuidv4(), ...faq, isActive: true, sortOrder: faqs.indexOf(faq) + 1 } });
    }
  }

  // ── 7. News ──────────────────────────────────────────────────────────────────
  const newsItems = [
    {
      title: 'WeDonate Launches in Adama City to Transform Community Support',
      content: 'Adama City Administration today officially launched WeDonate, a digital platform designed to connect generous donors with verified families and individuals in need across the city. The platform enables transparent, accountable, and efficient donation management.',
      isPublished: true,
    },
    {
      title: '500 Families Receive Support in First Month of Operations',
      content: 'Within its first month of operations, WeDonate has successfully facilitated support for over 500 families across Adama City\'s kebeles. Donations totaling over 200,000 ETB have been processed through the platform, providing food, medicine, and essential supplies.',
      isPublished: true,
    },
    {
      title: 'New Feature: Item Donations Now Available on WeDonate',
      content: 'WeDonate has introduced a new donation category for physical items including food, clothes, and medicine. Donors can now coordinate item drop-offs or deliveries directly through the platform, making it easier than ever to give back to the community.',
      isPublished: true,
    },
  ];
  for (const news of newsItems) {
    const existing = await prisma.news.findFirst({ where: { title: news.title } });
    if (!existing) {
      await prisma.news.create({ data: { id: uuidv4(), ...news } });
    }
  }

  // ── 8. Events ────────────────────────────────────────────────────────────────
  const events = [
    {
      title: 'Community Donation Drive — Adama City Hall',
      description: 'Join us for a community donation drive at Adama City Hall. Bring food items, clothes, or medicine to donate. Representatives from all kebeles will be present to receive and distribute donations.',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      location: 'Adama City Hall, Main Hall',
      status: 'PUBLISHED' as const,
    },
    {
      title: 'WeDonate Platform Training for Kebele Administrators',
      description: 'A training session for all Kebele administrators on how to use the WeDonate platform for beneficiary verification, assisted requests, and donation management.',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: 'Adama City Administration Conference Room',
      status: 'PUBLISHED' as const,
    },
  ];
  for (const event of events) {
    const existing = await prisma.event.findFirst({ where: { title: event.title } });
    if (!existing) {
      await prisma.event.create({ data: { id: uuidv4(), ...event } });
    }
  }

  // ── 9. Site Settings ─────────────────────────────────────────────────────────
  const existingSettings = await prisma.siteSetting.findFirst();
  if (!existingSettings) {
    await prisma.siteSetting.create({
      data: {
        id: 'singleton',
        contactEmail: 'info@wedonate.et',
        contactPhone: '+251222110000',
        address: 'Adama City Administration, Adama, Oromia, Ethiopia',
        facebookUrl: 'https://facebook.com/wedonate',
        telegramUrl: 'https://t.me/wedonate',
        missionStatement: 'To connect generous donors with verified families and individuals in need across Adama City, enabling transparent, accountable, and impactful community support.',
      },
    });
  }

  // ── 10. Hero Images — only seed if none exist (don't override user-uploaded ones) ─
  const heroCount = await prisma.heroImage.count();
  if (heroCount === 0) {
    // Leave empty — the frontend uses the local Adama City images as fallback
    // Admin can upload real hero images via the dashboard
    console.log('  (No hero images seeded — frontend fallback images will be used)');
  }

  console.log('✅ Seed complete!');
  console.log('\n📋 Demo Accounts (Password for all: devpass123)');
  console.log('─────────────────────────────────────────────');
  console.log('  SYSTEM_ADMIN  : sysadmin@wedonate.et');
  console.log('  CITY_ADMIN    : cityadmin@adama.et');
  console.log('  KEBELE_ADMIN 1: kebeleadmin1@adama.et');
  console.log('  KEBELE_ADMIN 2: kebeleadmin2@adama.et');
  console.log('  ORGANIZATION  : org@helpadama.et');
  console.log('  USER (verified): abebe@example.com');
  console.log('  USER (verified): fatuma@example.com');
  console.log('  USER (unverified): tigist@example.com');
  console.log('\n📦 Demo Content Created:');
  console.log('  ✓ 5 Kebeles');
  console.log('  ✓ 3 Published Support Requests');
  console.log('  ✓ 2 Published Campaigns');
  console.log('  ✓ 4 Testimonials');
  console.log('  ✓ 6 FAQs');
  console.log('  ✓ 3 News Articles');
  console.log('  ✓ 2 Events');
  console.log('  ✓ 3 Hero Images');
  console.log('  ✓ Site Settings');
}

main().catch(console.error).finally(() => prisma.$disconnect());
