-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "maxResponsesPerUser" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "submissionCooldown" INTEGER NOT NULL DEFAULT 0;
