-- AlterTable
ALTER TABLE "events" ADD COLUMN     "auto_team_name" BOOLEAN DEFAULT true,
ADD COLUMN     "team_counter" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX "registrations_event_id_local_id_idx" ON "registrations"("event_id", "local_id");
