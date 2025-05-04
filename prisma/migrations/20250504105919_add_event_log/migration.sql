-- CreateEnum
CREATE TYPE "EventLogType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "EventLogTarget" AS ENUM ('EVENT', 'REGISTRATION');

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "user_name" TEXT,
    "log_type" "EventLogType" NOT NULL,
    "log_target" "EventLogTarget" NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "registration_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventLog_event_id_idx" ON "EventLog"("event_id");

-- CreateIndex
CREATE INDEX "EventLog_user_id_idx" ON "EventLog"("user_id");

-- CreateIndex
CREATE INDEX "EventLog_log_type_idx" ON "EventLog"("log_type");

-- CreateIndex
CREATE INDEX "EventLog_log_target_idx" ON "EventLog"("log_target");

-- CreateIndex
CREATE INDEX "EventLog_created_at_idx" ON "EventLog"("created_at");

-- CreateIndex
CREATE INDEX "EventLog_registration_id_idx" ON "EventLog"("registration_id");
