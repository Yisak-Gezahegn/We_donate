import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Override DATABASE_URL to point to the test db running on port 5434
process.env.DATABASE_URL = 'postgresql://postgres:wedonate2026@localhost:5434/wedonate_test_db';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Reset database schema before all tests
  execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', { stdio: 'ignore', env: process.env });
});

afterAll(async () => {
  await prisma.$disconnect();
});
