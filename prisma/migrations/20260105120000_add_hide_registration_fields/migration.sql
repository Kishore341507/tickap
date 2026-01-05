-- AlterTable
ALTER TABLE "events" ADD COLUMN "hide_registrations" BOOLEAN DEFAULT false;
ALTER TABLE "events" ADD COLUMN "hide_registration_count" BOOLEAN DEFAULT false;
