-- CreateTable
CREATE TABLE "IncidentImage" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentId" TEXT NOT NULL,

    CONSTRAINT "IncidentImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncidentImage" ADD CONSTRAINT "IncidentImage_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
