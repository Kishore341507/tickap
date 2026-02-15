-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "accept_response" TEXT,
ADD COLUMN     "custom_response" BOOLEAN DEFAULT false,
ADD COLUMN     "reject_response" TEXT;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "custom_message" TEXT,
ADD COLUMN     "status" "ResponseStatus" NOT NULL DEFAULT 'PENDING';
