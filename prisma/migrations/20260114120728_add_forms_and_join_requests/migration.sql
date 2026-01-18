-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('LEADER', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('INVITE', 'REQUEST');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "allow_incomplete_teams" BOOLEAN DEFAULT false,
ADD COLUMN     "enable_team_invites" BOOLEAN DEFAULT true,
ADD COLUMN     "enable_team_requests" BOOLEAN DEFAULT true,
ADD COLUMN     "register_for_other" BOOLEAN DEFAULT true;

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "invites_open" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_disqualified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requests_open" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "registrationusers" ADD COLUMN     "role" "TeamRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "JoinRequest" (
    "id" TEXT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "registration_id" BIGINT,
    "user_id" BIGINT NOT NULL,
    "user_name" VARCHAR,
    "user_pfp" VARCHAR,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JoinRequest_event_id_idx" ON "JoinRequest"("event_id");

-- CreateIndex
CREATE INDEX "JoinRequest_registration_id_idx" ON "JoinRequest"("registration_id");

-- CreateIndex
CREATE INDEX "JoinRequest_user_id_idx" ON "JoinRequest"("user_id");

-- CreateIndex
CREATE INDEX "JoinRequest_status_idx" ON "JoinRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JoinRequest_event_id_registration_id_user_id_type_key" ON "JoinRequest"("event_id", "registration_id", "user_id", "type");

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
