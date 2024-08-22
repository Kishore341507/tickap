/*
  Warnings:

  - You are about to drop the `event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `regusers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "regs" DROP CONSTRAINT "fk_event";

-- DropForeignKey
ALTER TABLE "regusers" DROP CONSTRAINT "fk_event";

-- DropForeignKey
ALTER TABLE "regusers" DROP CONSTRAINT "fk_reg";

-- DropTable
DROP TABLE "event";

-- DropTable
DROP TABLE "regs";

-- DropTable
DROP TABLE "regusers";

-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "banner" VARCHAR NOT NULL DEFAULT '/tickap_dark.png',
    "start_time" INTEGER,
    "date" TIMESTAMP,
    "prize" VARCHAR,
    "max_teams" INTEGER,
    "min_team_player" INTEGER,
    "max_team_player" INTEGER,
    "rules" TEXT,
    "details" TEXT,
    "is_solo" BOOLEAN,
    "extra" JSONB,
    "redirect_url" VARCHAR,
    "location" VARCHAR,
    "location_url" VARCHAR,
    "status" "EventStatus" NOT NULL DEFAULT 'Open',
    "category" "Category" NOT NULL DEFAULT 'VedioGame',
    "category_name" VARCHAR,
    "platform" "Platform" NOT NULL DEFAULT 'Discord',
    "role_id" BIGINT,
    "manager_id" BIGINT,
    "guild_id" BIGINT,
    "channel_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "team_name" VARCHAR,
    "local_id" INTEGER,
    "extra" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrationusers" (
    "user_id" BIGINT NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_name" VARCHAR,
    "pfp" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrationusers_pkey" PRIMARY KEY ("user_id","registration_id")
);

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "fk_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registrationusers" ADD CONSTRAINT "fk_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registrationusers" ADD CONSTRAINT "fk_reg" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
