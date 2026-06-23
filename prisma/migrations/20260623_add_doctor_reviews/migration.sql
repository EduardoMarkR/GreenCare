CREATE TABLE "DoctorReview" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DoctorReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DoctorReview_appointmentId_key" ON "DoctorReview"("appointmentId");

ALTER TABLE "DoctorReview"
ADD CONSTRAINT "DoctorReview_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorReview"
ADD CONSTRAINT "DoctorReview_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorReview"
ADD CONSTRAINT "DoctorReview_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
ON DELETE CASCADE ON UPDATE CASCADE;