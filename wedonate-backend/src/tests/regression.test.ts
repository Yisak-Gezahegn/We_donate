import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function generateToken(userId: string, role: string, verificationStatus: string, kebeleId: string | null = null) {
  return jwt.sign({ userId, role, verificationStatus, kebeleId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
}

describe('Role/UI Business Logic and Assisted Requests Regression Tests', () => {
  let userToken: string;
  let orgToken: string;
  let kebeleToken: string;
  let cityToken: string;
  
  let userId: string;
  let orgId: string;
  let kebeleId: string;
  let cityId: string;

  beforeAll(async () => {
    // Setup Kebele first
    const kebeleRecord = await prisma.kebele.upsert({
      where: { id: 'K-01' },
      update: {},
      create: {
        id: 'K-01',
        name: 'Test Kebele',
      }
    });

    // Setup generic user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(), firstName: 'Normal', lastName: 'User',
        email: `user_${Date.now()}@test.com`, password: await bcrypt.hash('password', 10),
        role: 'USER', verificationStatus: 'VERIFIED', kebeleId: 'K-01'
      }
    });
    userId = user.id;
    userToken = generateToken(user.id, user.role, user.verificationStatus, user.kebeleId);

    // Setup Organization
    const org = await prisma.user.create({
      data: {
        id: uuidv4(), firstName: 'Org', lastName: 'Admin',
        email: `org_${Date.now()}@test.com`, password: await bcrypt.hash('password', 10),
        role: 'ORGANIZATION', verificationStatus: 'VERIFIED'
      }
    });
    orgId = org.id;
    orgToken = generateToken(org.id, org.role, org.verificationStatus, org.kebeleId);

    // Setup Kebele Admin
    const kebeleAdmin = await prisma.user.create({
      data: {
        id: uuidv4(), firstName: 'Kebele', lastName: 'Admin',
        email: `kebele_${Date.now()}@test.com`, password: await bcrypt.hash('password', 10),
        role: 'KEBELE_ADMIN', verificationStatus: 'VERIFIED', kebeleId: 'K-01'
      }
    });
    kebeleId = kebeleAdmin.id;
    kebeleToken = generateToken(kebeleAdmin.id, kebeleAdmin.role, kebeleAdmin.verificationStatus, kebeleAdmin.kebeleId);

    // Setup City Admin
    const city = await prisma.user.create({
      data: {
        id: uuidv4(), firstName: 'City', lastName: 'Admin',
        email: `city_${Date.now()}@test.com`, password: await bcrypt.hash('password', 10),
        role: 'CITY_ADMIN', verificationStatus: 'VERIFIED'
      }
    });
    cityId = city.id;
    cityToken = generateToken(city.id, city.role, city.verificationStatus, city.kebeleId);
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: [userId, orgId, kebeleId, cityId] } } });
    await prisma.supportRequest.deleteMany({ where: { OR: [{ userId }, { createdById: kebeleId }] } });
    await prisma.campaign.deleteMany({ where: { userId: orgId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, orgId, kebeleId, cityId] } } });
    await prisma.$disconnect();
  });

  describe('Role-based Create Permissions', () => {
    it('USER cannot create campaign', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'User Campaign', description: 'desc', category: 'EDUCATION', goalAmount: 5000, deadline: new Date().toISOString() });
      expect(res.status).toBe(403);
    });

    it('ORGANIZATION retains campaign functionality', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({ title: 'Org Campaign', description: 'desc', category: 'EDUCATION', goalAmount: 5000, deadline: new Date().toISOString() });
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
    });

    it('ORGANIZATION cannot create individual support request', async () => {
      const res = await request(app)
        .post('/api/support-requests')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({ title: 'Org Request', description: 'desc', category: 'FOOD', urgencyLevel: 1 });
      expect(res.status).toBe(403);
    });
  });

  describe('Verification Scoping', () => {
    beforeAll(async () => {
      await prisma.user.create({
        data: { id: uuidv4(), firstName: 'P', lastName: 'Org', email: `p_org_${Date.now()}@test.com`, password: 'pw', role: 'ORGANIZATION', verificationStatus: 'PENDING' }
      });
      await prisma.user.create({
        data: { id: uuidv4(), firstName: 'P', lastName: 'User', email: `p_user_${Date.now()}@test.com`, password: 'pw', role: 'USER', verificationStatus: 'UNVERIFIED', kebeleId: 'K-01' }
      });
    });

    it('City organization verification returns ORGANIZATION only', async () => {
      const res = await request(app).get('/api/admin/organizations/pending').set('Authorization', `Bearer ${cityToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const nonOrgs = res.body.data.filter((u: any) => u.role !== 'ORGANIZATION');
      expect(nonOrgs.length).toBe(0);
    });

    it('Kebele verification returns local USER only', async () => {
      const res = await request(app).get('/api/admin/user-verifications/pending').set('Authorization', `Bearer ${kebeleToken}`);
      expect(res.status).toBe(200);
      const orgs = res.body.data.filter((u: any) => u.role === 'ORGANIZATION');
      expect(orgs.length).toBe(0);
      const otherKebeles = res.body.data.filter((u: any) => u.kebeleId !== 'K-01');
      expect(otherKebeles.length).toBe(0);
    });
  });

  describe('Assisted Requests', () => {
    let assistedReqId: string;

    it('assisted request requires no user account, Kebele creates it, beneficiary data is stored', async () => {
      const res = await request(app)
        .post('/api/support-requests')
        .set('Authorization', `Bearer ${kebeleToken}`)
        .send({
          title: 'Assisted Req', description: 'desc', category: 'FOOD', urgencyLevel: 5,
          isAssisted: true,
          beneficiaryName: 'Jane Doe', beneficiaryPhone: '0911000000',
          beneficiaryIdType: 'NATIONAL_ID', beneficiaryIdNum: '12345'
        });
      
      expect(res.status).toBe(201);
      assistedReqId = res.body.data.id;
      expect(res.body.data.userId).toBeNull();
      expect(res.body.data.beneficiaryName).toBe('Jane Doe');
      expect(res.body.data.beneficiaryIdNum).toBe('12345');
    });

    it('Kebele cannot self-approve assisted request', async () => {
      const res = await request(app)
        .patch(`/api/support-requests/${assistedReqId}/status`)
        .set('Authorization', `Bearer ${kebeleToken}`)
        .send({ status: 'PUBLISHED' });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Conflict of Interest|forbidden|Assisted requests must be approved/i);
    });

    it('City approves assisted request', async () => {
      const res = await request(app)
        .patch(`/api/support-requests/${assistedReqId}/status`)
        .set('Authorization', `Bearer ${cityToken}`)
        .send({ status: 'APPROVED' }); // Or PUBLISHED depending on system states
      
      // Some implementations might allow CITY_ADMIN to approve directly
      if (res.status === 200) {
        expect(res.body.data.status).toMatch(/APPROVED|PUBLISHED/);
      } else {
        expect(res.status).toBe(200);
      }
    });
  });

  describe('Profile and Session', () => {
    it('Profile returns same Kebele', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.kebeleId).toBe('K-01');
    });
  });
});
