-- DropForeignKey
ALTER TABLE "support_requests" DROP CONSTRAINT "support_requests_userId_fkey";

-- AlterTable
ALTER TABLE "support_requests" ADD COLUMN     "beneficiaryBackIdUrl" TEXT,
ADD COLUMN     "beneficiaryFanNumber" TEXT,
ADD COLUMN     "beneficiaryFrontIdUrl" TEXT,
ADD COLUMN     "beneficiaryIdNum" TEXT,
ADD COLUMN     "beneficiaryIdType" TEXT,
ADD COLUMN     "beneficiaryName" TEXT,
ADD COLUMN     "beneficiaryPhone" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isUser" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
