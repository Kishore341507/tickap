/*
  Warnings:

  - The primary key for the `events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `eventchannel` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `eventid` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `eventmanager` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `eventname` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `gamename` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `guildid` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `info` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `issolo` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `maxteamplayer` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `maxteams` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `minteamplayer` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `r_url` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `serverlink` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `starttime` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `regs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regusers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "regs" DROP CONSTRAINT "fk_event";

-- DropForeignKey
ALTER TABLE "regusers" DROP CONSTRAINT "fk_event";

-- DropForeignKey
ALTER TABLE "regusers" DROP CONSTRAINT "fk_reg";

-- AlterTable
ALTER TABLE "events" DROP CONSTRAINT "events_pkey",
DROP COLUMN "eventchannel",
DROP COLUMN "eventid",
DROP COLUMN "eventmanager",
DROP COLUMN "eventname",
DROP COLUMN "gamename",
DROP COLUMN "guildid",
DROP COLUMN "info",
DROP COLUMN "issolo",
DROP COLUMN "maxteamplayer",
DROP COLUMN "maxteams",
DROP COLUMN "minteamplayer",
DROP COLUMN "r_url",
DROP COLUMN "role",
DROP COLUMN "serverlink",
DROP COLUMN "starttime",
ADD COLUMN     "channel_id" BIGINT,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "game_name" VARCHAR,
ADD COLUMN     "guild_id" BIGINT,
ADD COLUMN     "guild_url" VARCHAR,
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD COLUMN     "is_solo" BOOLEAN,
ADD COLUMN     "manager_id" BIGINT,
ADD COLUMN     "max_team_player" INTEGER,
ADD COLUMN     "max_teams" INTEGER,
ADD COLUMN     "min_team_player" INTEGER,
ADD COLUMN     "name" VARCHAR,
ADD COLUMN     "redirect_url" VARCHAR,
ADD COLUMN     "role_id" BIGINT,
ADD COLUMN     "start_time" INTEGER,
ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "regs";

-- DropTable
DROP TABLE "regusers";

-- CreateTable
CREATE TABLE "registrations" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "team_name" VARCHAR,
    "local_id" INTEGER,
    "extra" JSONB,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrationusers" (
    "user_id" BIGINT NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_name" VARCHAR,
    "pfp" VARCHAR,

    CONSTRAINT "registrationusers_pkey" PRIMARY KEY ("user_id","registration_id")
);

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "fk_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registrationusers" ADD CONSTRAINT "fk_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registrationusers" ADD CONSTRAINT "fk_reg" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
