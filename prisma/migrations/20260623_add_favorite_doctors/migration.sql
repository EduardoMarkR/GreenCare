CREATE TABLE "FavoriteDoctor" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FavoriteDoctor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FavoriteDoctor_patientId_doctorId_key"
ON "FavoriteDoctor"("patientId", "doctorId");

ALTER TABLE "FavoriteDoctor"
ADD CONSTRAINT "FavoriteDoctor_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FavoriteDoctor"
ADD CONSTRAINT "FavoriteDoctor_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
ON DELETE CASCADE ON UPDATE CASCADE;