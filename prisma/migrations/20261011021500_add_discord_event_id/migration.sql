-- AlterTable
ALTER TABLE "events" ADD COLUMN     "discord_event_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "events_discord_event_id_key" ON "events"("discord_event_id");
