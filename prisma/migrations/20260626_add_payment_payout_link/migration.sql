ALTER TABLE "Payment"
ADD COLUMN IF NOT EXISTS "payoutId" TEXT;

CREATE INDEX IF NOT EXISTS "Payment_payoutId_idx"
ON "Payment"("payoutId");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_payoutId_fkey"
FOREIGN KEY ("payoutId")
REFERENCES "DoctorPayout"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;