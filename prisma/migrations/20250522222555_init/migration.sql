-- CreateTable
CREATE TABLE "QAAnalyst" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "color" TEXT,
    "availability" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QAAnalyst_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "analystId" TEXT NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalystCell" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,

    CONSTRAINT "AnalystCell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAnalyst" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,

    CONSTRAINT "TeamAnalyst_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPlan" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "codeReference" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "estimatedHours" INTEGER NOT NULL,
    "estimatedDays" INTEGER NOT NULL,
    "totalCases" INTEGER NOT NULL,
    "testQuality" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "codeRef" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "testType" TEXT,
    "status" TEXT,
    "category" TEXT,
    "responsiblePerson" TEXT,
    "priority" TEXT,
    "cycle" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "testPlanId" TEXT NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestStep" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expected" TEXT,
    "testCaseId" TEXT NOT NULL,

    CONSTRAINT "TestStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestEvidence" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tester" TEXT NOT NULL,
    "precondition" TEXT,
    "result" TEXT NOT NULL,
    "comments" TEXT,
    "testCaseId" TEXT NOT NULL,
    "steps" TEXT[],
    "screenshots" TEXT[],

    CONSTRAINT "TestEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCycle" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "designed" INTEGER NOT NULL,
    "successful" INTEGER NOT NULL,
    "notExecuted" INTEGER NOT NULL,
    "defects" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "testPlanId" TEXT NOT NULL,

    CONSTRAINT "TestCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaReporte" TIMESTAMP(3) NOT NULL,
    "fechaSolucion" TIMESTAMP(3),
    "diasAbierto" INTEGER NOT NULL,
    "esErroneo" BOOLEAN NOT NULL DEFAULT false,
    "aplica" BOOLEAN NOT NULL DEFAULT true,
    "cliente" TEXT NOT NULL,
    "idJira" TEXT NOT NULL,
    "tipoBug" TEXT,
    "areaAfectada" TEXT,
    "celula" TEXT NOT NULL,
    "informadoPorId" TEXT NOT NULL,
    "asignadoAId" TEXT NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateChange" (
    "id" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "comentario" TEXT,
    "incidentId" TEXT NOT NULL,

    CONSTRAINT "StateChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectRelation" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,

    CONSTRAINT "DefectRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "idJira" TEXT NOT NULL,
    "nombre" TEXT,
    "proyecto" TEXT NOT NULL,
    "horas" INTEGER NOT NULL,
    "dias" INTEGER NOT NULL,
    "horasEstimadas" INTEGER,
    "estado" TEXT,
    "estadoCalculado" TEXT,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3) NOT NULL,
    "fechaRealEntrega" TIMESTAMP(3),
    "fechaCertificacion" TIMESTAMP(3),
    "diasRetraso" INTEGER NOT NULL,
    "analistaProducto" TEXT NOT NULL,
    "planTrabajo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipo" TEXT NOT NULL,
    "celula" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAnalyst" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,

    CONSTRAINT "ProjectAnalyst_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QAAnalyst_email_key" ON "QAAnalyst"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AnalystCell_analystId_cellId_key" ON "AnalystCell"("analystId", "cellId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAnalyst_teamId_analystId_key" ON "TeamAnalyst"("teamId", "analystId");

-- CreateIndex
CREATE UNIQUE INDEX "DefectRelation_testCaseId_incidentId_key" ON "DefectRelation"("testCaseId", "incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAnalyst_projectId_analystId_key" ON "ProjectAnalyst"("projectId", "analystId");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalystCell" ADD CONSTRAINT "AnalystCell_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalystCell" ADD CONSTRAINT "AnalystCell_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAnalyst" ADD CONSTRAINT "TeamAnalyst_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAnalyst" ADD CONSTRAINT "TeamAnalyst_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "TestPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestStep" ADD CONSTRAINT "TestStep_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestEvidence" ADD CONSTRAINT "TestEvidence_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCycle" ADD CONSTRAINT "TestCycle_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "TestPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_celula_fkey" FOREIGN KEY ("celula") REFERENCES "Cell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_informadoPorId_fkey" FOREIGN KEY ("informadoPorId") REFERENCES "QAAnalyst"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "QAAnalyst"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateChange" ADD CONSTRAINT "StateChange_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectRelation" ADD CONSTRAINT "DefectRelation_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefectRelation" ADD CONSTRAINT "DefectRelation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_equipo_fkey" FOREIGN KEY ("equipo") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_celula_fkey" FOREIGN KEY ("celula") REFERENCES "Cell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAnalyst" ADD CONSTRAINT "ProjectAnalyst_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAnalyst" ADD CONSTRAINT "ProjectAnalyst_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "QAAnalyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;
