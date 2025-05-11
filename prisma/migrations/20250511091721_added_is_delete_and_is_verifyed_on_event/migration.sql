-- AlterTable
ALTER TABLE "events" ADD COLUMN     "is_deleted" BOOLEAN DEFAULT false,
ADD COLUMN     "is_verified" BOOLEAN DEFAULT false;
