-- CreateTable
CREATE TABLE "events" (
    "eventid" BIGINT NOT NULL,
    "eventname" VARCHAR,
    "guildid" BIGINT,
    "eventchannel" BIGINT,
    "banner" VARCHAR,
    "gamename" VARCHAR,
    "starttime" INTEGER,
    "eventmanager" BIGINT,
    "prize" VARCHAR,
    "maxteams" INTEGER,
    "minteamplayer" INTEGER,
    "maxteamplayer" INTEGER,
    "rules" TEXT,
    "info" TEXT,
    "issolo" BOOLEAN,
    "extra" JSONB,
    "r_url" VARCHAR,
    "serverlink" VARCHAR,
    "role" BIGINT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("eventid")
);

-- CreateTable
CREATE TABLE "regs" (
    "eventid" BIGINT NOT NULL,
    "regid" BIGINT NOT NULL,
    "teamname" VARCHAR,
    "localid" INTEGER,
    "extra" JSONB,

    CONSTRAINT "regs_pkey" PRIMARY KEY ("regid")
);

-- CreateTable
CREATE TABLE "regusers" (
    "userid" BIGINT NOT NULL,
    "regid" BIGINT NOT NULL,
    "eventid" BIGINT NOT NULL,
    "username" VARCHAR,
    "pfp" VARCHAR,

    CONSTRAINT "regusers_pkey" PRIMARY KEY ("userid","regid")
);

-- AddForeignKey
ALTER TABLE "regs" ADD CONSTRAINT "fk_event" FOREIGN KEY ("eventid") REFERENCES "events"("eventid") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regusers" ADD CONSTRAINT "fk_event" FOREIGN KEY ("eventid") REFERENCES "events"("eventid") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regusers" ADD CONSTRAINT "fk_reg" FOREIGN KEY ("regid") REFERENCES "regs"("regid") ON DELETE CASCADE ON UPDATE NO ACTION;
