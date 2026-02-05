-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'USER';

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "max" INTEGER,
ADD COLUMN     "min" INTEGER;
