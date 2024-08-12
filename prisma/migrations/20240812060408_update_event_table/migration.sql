/*
  Warnings:

  - You are about to drop the column `game_name` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `guild_url` on the `event` table. All the data in the column will be lost.
  - Made the column `name` on table `event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `banner` on table `event` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('Discord', 'TickAp', 'Other');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('VedioGame', 'ESports', 'Music', 'Other');

-- AlterTable
ALTER TABLE "event" DROP COLUMN "game_name",
DROP COLUMN "guild_url",
ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'VedioGame',
ADD COLUMN     "category_name" VARCHAR,
ADD COLUMN     "location" VARCHAR,
ADD COLUMN     "location_url" VARCHAR,
ADD COLUMN     "platform" "Platform" NOT NULL DEFAULT 'Discord',
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "banner" SET NOT NULL,
ALTER COLUMN "banner" SET DEFAULT '/tickap_dark.png';
