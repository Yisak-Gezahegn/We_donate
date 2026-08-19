-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "awashAccount" TEXT,
ADD COLUMN     "boaAccount" TEXT,
ADD COLUMN     "cbeAccount" TEXT,
ADD COLUMN     "otherBankAccount" TEXT,
ADD COLUMN     "otherBankName" TEXT,
ADD COLUMN     "registrationUrl" TEXT,
ADD COLUMN     "supportLetterUrl" TEXT,
ADD COLUMN     "telebirrAccount" TEXT;

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "deliveryMethod" TEXT,
ADD COLUMN     "itemDescription" TEXT,
ADD COLUMN     "itemImageUrl" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentProofUrl" TEXT,
ADD COLUMN     "referenceCode" TEXT;

-- AlterTable
ALTER TABLE "support_requests" ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "awashAccount" TEXT,
ADD COLUMN     "boaAccount" TEXT,
ADD COLUMN     "cbeAccount" TEXT,
ADD COLUMN     "familySize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "nationalIdUrl" TEXT,
ADD COLUMN     "otherBankAccount" TEXT,
ADD COLUMN     "otherBankName" TEXT,
ADD COLUMN     "supportLetterUrl" TEXT,
ADD COLUMN     "telebirrAccount" TEXT;
