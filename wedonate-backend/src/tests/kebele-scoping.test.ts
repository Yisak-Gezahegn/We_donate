import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function generateToken(userId: string, role: string, verificationStatus: string, kebeleId: string | null = null) {
  return jwt.sign({ userId, role, verificationStatus, kebeleId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
}

describe('Kebele Scoping and Authorization E2E', () => {
  let userToken: string;
  let adminK01Token: string;
  let adminK02Token: string;
  let requestId: string;
  let adminK01Id: string;
  let adminK01RequestId: string;

  beforeAll(async () => {
    // 1. Create User in K-01
    const user = await prisma.user.create({
      data: {
        firstName: 'Test', lastName: 'User',
        email: 'testuser@k01.com', password: await bcrypt.hash('password', 10),
        role: 'USER', verificationStatus: 'VERIFIED',
        kebeleId: 'K-01'
      }
    });
    userToken = generateToken(user.id, user.role, user.verificationStatus, user.kebeleId);

    // 2. Create Kebele Admin in K-01
    const adminK01 = await prisma.user.create({
      data: {
        firstName: 'Admin', lastName: 'K01',
        email: 'admin@k01.com', password: await bcrypt.hash('password', 10),
        role: 'KEBELE_ADMIN', verificationStatus: 'VERIFIED',
        kebeleId: 'K-01'
      }
    });
    adminK01Id = adminK01.id;
    adminK01Token = generateToken(adminK01.id, adminK01.role, adminK01.verificationStatus, adminK01.kebeleId);

    // 3. Create Kebele Admin in K-02
    const adminK02 = await prisma.user.create({
      data: {
        firstName: 'Admin', lastName: 'K02',
        email: 'admin@k02.com', password: await bcrypt.hash('password', 10),
        role: 'KEBELE_ADMIN', verificationStatus: 'VERIFIED',
        kebeleId: 'K-02'
      }
    });
    adminK02Token = generateToken(adminK02.id, adminK02.role, adminK02.verificationStatus, adminK02.kebeleId);
  });

  it('should allow user to create a support request', async () => {
    const res = await request(app)
      .post('/api/support-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Need help with food',
        description: 'Test description',
        category: 'FOOD',
        urgencyLevel: 5,
        goalAmount: 1000
      });
    
    console.log(res.body);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    requestId = res.body.data.id;
  });

  it('should allow Kebele Admin (K-01) to view requests from their Kebele', async () => {
    const res = await request(app)
      .get('/api/support-requests/all')
      .set('Authorization', `Bearer ${adminK01Token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((r: any) => r.id === requestId)).toBe(true);
  });

  it('should prevent Kebele Admin (K-02) from viewing K-01 requests', async () => {
    const res = await request(app)
      .get('/api/support-requests/all')
      .set('Authorization', `Bearer ${adminK02Token}`);
    
    expect(res.status).toBe(200);
    // Should not include the K-01 request
    expect(res.body.data.some((r: any) => r.id === requestId)).toBe(false);
  });

  it('should prevent Kebele Admin (K-02) from approving K-01 requests (403 Forbidden due to scope)', async () => {
    const res = await request(app)
      .patch(`/api/support-requests/${requestId}/status`)
      .set('Authorization', `Bearer ${adminK02Token}`)
      .send({ status: 'PUBLISHED' });
    
    expect(res.status).toBe(403); // Our logic throws 403 if unauthorized Kebele
  });

  it('should allow Kebele Admin (K-01) to approve K-01 requests', async () => {
    const res = await request(app)
      .patch(`/api/support-requests/${requestId}/status`)
      .set('Authorization', `Bearer ${adminK01Token}`)
      .send({ status: 'PUBLISHED' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('should prevent Kebele Admin (K-01) from self-approving their own request', async () => {
    // 1. Admin K-01 creates their own request
    const createRes = await request(app)
      .post('/api/support-requests')
      .set('Authorization', `Bearer ${adminK01Token}`)
      .send({
        title: 'My own request',
        description: 'Testing self-approval',
        category: 'FOOD',
        urgencyLevel: 3,
        goalAmount: 5000
      });
    
    expect(createRes.status).toBe(201);
    adminK01RequestId = createRes.body.data.id;

    // 2. Admin K-01 tries to approve their own request
    const approveRes = await request(app)
      .patch(`/api/support-requests/${adminK01RequestId}/status`)
      .set('Authorization', `Bearer ${adminK01Token}`)
      .send({ status: 'PUBLISHED' });
    
    // Should block self-approval (403 Forbidden)
    expect(approveRes.status).toBe(403);
    expect(approveRes.body.message).toContain('Conflict of Interest');
  });
});
