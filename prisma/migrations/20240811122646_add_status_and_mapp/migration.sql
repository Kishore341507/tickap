/*
  Warnings:

  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `registrationusers` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('Open', 'Closed', 'Cancelled', 'Live');

-- DropForeignKey
ALTER TABLE "registrations" DROP CONSTRAINT "fk_event";

-- DropForeignKey
ALTER TABLE "registrationusers" DROP CONSTRAINT "fk_event";

-- DropForeignKey
ALTER TABLE "registrationusers" DROP CONSTRAINT "fk_reg";

-- DropTable
DROP TABLE "events";

-- DropTable
DROP TABLE "registrations";

-- DropTable
DROP TABLE "registrationusers";

-- CreateTable
CREATE TABLE "event" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR,
    "guild_id" BIGINT,
    "channel_id" BIGINT,
    "banner" VARCHAR,
    "game_name" VARCHAR,
    "start_time" INTEGER,
    "manager_id" BIGINT,
    "prize" VARCHAR,
    "max_teams" INTEGER,
    "min_team_player" INTEGER,
    "max_team_player" INTEGER,
    "rules" TEXT,
    "details" TEXT,
    "is_solo" BOOLEAN,
    "extra" JSONB,
    "redirect_url" VARCHAR,
    "guild_url" VARCHAR,
    "role_id" BIGINT,
    "status" "EventStatus" NOT NULL DEFAULT 'Open',

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regs" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "team_name" VARCHAR,
    "local_id" INTEGER,
    "extra" JSONB,

    CONSTRAINT "regs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regusers" (
    "user_id" BIGINT NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_name" VARCHAR,
    "pfp" VARCHAR,

    CONSTRAINT "regusers_pkey" PRIMARY KEY ("user_id","registration_id")
);

-- AddForeignKey
ALTER TABLE "regs" ADD CONSTRAINT "fk_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regusers" ADD CONSTRAINT "fk_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regusers" ADD CONSTRAINT "fk_reg" FOREIGN KEY ("registration_id") REFERENCES "regs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
