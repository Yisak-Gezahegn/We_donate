/*
  Warnings:

  - You are about to drop the column `fanNumber` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `nationalIdBackUrl` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `nationalIdFrontUrl` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `fanNumber` on the `support_requests` table. All the data in the column will be lost.
  - You are about to drop the column `nationalIdBackUrl` on the `support_requests` table. All the data in the column will be lost.
  - You are about to drop the column `nationalIdFrontUrl` on the `support_requests` table. All the data in the column will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "KebeleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('GENERAL', 'USER', 'KEBELE_ADMIN', 'CITY_ADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestStatus" ADD VALUE 'PENDING_CITY_APPROVAL';
ALTER TYPE "RequestStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "fanNumber",
DROP COLUMN "nationalIdBackUrl",
DROP COLUMN "nationalIdFrontUrl";

-- AlterTable
ALTER TABLE "support_requests" DROP COLUMN "fanNumber",
DROP COLUMN "nationalIdBackUrl",
DROP COLUMN "nationalIdFrontUrl";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountSource" TEXT NOT NULL DEFAULT 'SELF_REGISTERED',
ADD COLUMN     "createdByAdminId" TEXT,
ADD COLUMN     "fanNumber" TEXT,
ADD COLUMN     "nationalIdBackUrl" TEXT,
ADD COLUMN     "nationalIdFrontUrl" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT,
ADD COLUMN     "verifiedByRole" TEXT;

-- CreateTable
CREATE TABLE "kebeles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "KebeleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kebeles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "section" TEXT,
    "content" TEXT NOT NULL,
    "roleScope" "RoleScope" NOT NULL DEFAULT 'GENERAL',
    "embedding" vector(3072),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kebeles_name_key" ON "kebeles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_documents_name_key" ON "knowledge_documents"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_kebeleId_fkey" FOREIGN KEY ("kebeleId") REFERENCES "kebeles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
