-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_asignadoAId_fkey";

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "asignadoA_text" TEXT,
ALTER COLUMN "asignadoAId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AnalystVacation" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalystVacation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnalystVacation" ADD CONSTRAINT "AnalystVacation_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "QAAnalyst"("id") ON DELETE SET NULL ON UPDATE CASCADE;
