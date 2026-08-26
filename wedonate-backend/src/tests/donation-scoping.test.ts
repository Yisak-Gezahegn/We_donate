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

describe('Donation Scoping and Authorization E2E', () => {
  let userToken: string;
  let adminK01Token: string;
  let adminK02Token: string;
  let cityToken: string;
  
  let normalDonationId: string;
  let assistedDonationId: string;
  let campaignDonationId: string;

  beforeAll(async () => {
    // 1. Create Kebeles
    await prisma.kebele.upsert({ where: { id: 'K-01' }, update: {}, create: { id: 'K-01', name: 'Kebele 1' } });
    await prisma.kebele.upsert({ where: { id: 'K-02' }, update: {}, create: { id: 'K-02', name: 'Kebele 2' } });

    // 2. Create Users
    const user = await prisma.user.create({ data: { id: uuidv4(), firstName: 'User', lastName: 'U', email: `u_${Date.now()}@t.com`, password: 'pw', role: 'USER', verificationStatus: 'VERIFIED', kebeleId: 'K-01' } });
    userToken = generateToken(user.id, user.role, user.verificationStatus, user.kebeleId);

    const adminK01 = await prisma.user.create({ data: { id: uuidv4(), firstName: 'Admin', lastName: 'K1', email: `a1_${Date.now()}@t.com`, password: 'pw', role: 'KEBELE_ADMIN', verificationStatus: 'VERIFIED', kebeleId: 'K-01' } });
    adminK01Token = generateToken(adminK01.id, adminK01.role, adminK01.verificationStatus, adminK01.kebeleId);

    const adminK02 = await prisma.user.create({ data: { id: uuidv4(), firstName: 'Admin', lastName: 'K2', email: `a2_${Date.now()}@t.com`, password: 'pw', role: 'KEBELE_ADMIN', verificationStatus: 'VERIFIED', kebeleId: 'K-02' } });
    adminK02Token = generateToken(adminK02.id, adminK02.role, adminK02.verificationStatus, adminK02.kebeleId);

    const cityAdmin = await prisma.user.create({ data: { id: uuidv4(), firstName: 'City', lastName: 'C', email: `c_${Date.now()}@t.com`, password: 'pw', role: 'CITY_ADMIN', verificationStatus: 'VERIFIED' } });
    cityToken = generateToken(cityAdmin.id, cityAdmin.role, cityAdmin.verificationStatus, cityAdmin.kebeleId);

    // 3. Create Resources
    const normalReq = await prisma.supportRequest.create({ data: { id: uuidv4(), userId: user.id, kebeleId: 'K-01', source: 'SELF_SERVICE', title: 'Normal', description: 'desc', category: 'FOOD', urgencyLevel: 1, status: 'PUBLISHED', isPublished: true } });
    const assistedReq = await prisma.supportRequest.create({ data: { id: uuidv4(), createdById: adminK01.id, kebeleId: 'K-01', source: 'ASSISTED', title: 'Assisted', description: 'desc', category: 'FOOD', urgencyLevel: 1, status: 'PUBLISHED', isPublished: true } });
    const campaign = await prisma.campaign.create({ data: { id: uuidv4(), userId: user.id, title: 'Campaign', description: 'desc', category: 'FOOD', goalAmount: 1000, deadline: new Date(), status: 'PUBLISHED', isPublished: true } });

    // 4. Create Donations
    const d1 = await prisma.donation.create({ data: { id: uuidv4(), supportRequestId: normalReq.id, amount: 100, currency: 'ETB', paymentStatus: 'PENDING', paymentMethod: 'TELEBIRR', donationType: 'MONEY' } });
    normalDonationId = d1.id;

    const d2 = await prisma.donation.create({ data: { id: uuidv4(), supportRequestId: assistedReq.id, amount: 200, currency: 'ETB', paymentStatus: 'PENDING', paymentMethod: 'TELEBIRR', donationType: 'MONEY' } });
    assistedDonationId = d2.id;

    const d3 = await prisma.donation.create({ data: { id: uuidv4(), campaignId: campaign.id, amount: 300, currency: 'ETB', paymentStatus: 'PENDING', paymentMethod: 'TELEBIRR', donationType: 'MONEY' } });
    campaignDonationId = d3.id;
  });

  it('City donation query excludes SELF_SERVICE Direct Support and includes Campaign & ASSISTED', async () => {
    const res = await request(app).get('/api/admin/donations').set('Authorization', `Bearer ${cityToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: any) => d.id);
    expect(ids).not.toContain(normalDonationId);
    expect(ids).toContain(assistedDonationId);
    expect(ids).toContain(campaignDonationId);
  });

  it('Kebele donation query includes own SELF_SERVICE Direct Support and excludes Campaign, ASSISTED, and other Kebele donations', async () => {
    const res = await request(app).get('/api/admin/donations').set('Authorization', `Bearer ${adminK01Token}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: any) => d.id);
    expect(ids).toContain(normalDonationId);
    expect(ids).not.toContain(assistedDonationId);
    expect(ids).not.toContain(campaignDonationId);

    const res2 = await request(app).get('/api/admin/donations').set('Authorization', `Bearer ${adminK02Token}`);
    expect(res2.status).toBe(200);
    const ids2 = res2.body.data.map((d: any) => d.id);
    expect(ids2).not.toContain(normalDonationId); // Excludes another kebele's donation
  });

  it('Wrong Kebele receives 403 for normal individual donation verification', async () => {
    const res = await request(app).patch(`/api/admin/donations/${normalDonationId}/verify`).set('Authorization', `Bearer ${adminK02Token}`);
    expect(res.status).toBe(403);
  });

  it('City receives 403 for normal individual donation verification', async () => {
    const res = await request(app).patch(`/api/admin/donations/${normalDonationId}/verify`).set('Authorization', `Bearer ${cityToken}`);
    expect(res.status).toBe(403);
  });

  it('Correct Kebele can verify normal individual donation', async () => {
    const res = await request(app).patch(`/api/admin/donations/${normalDonationId}/verify`).set('Authorization', `Bearer ${adminK01Token}`);
    expect(res.status).toBe(200);
  });
});
