/*
  Warnings:

  - A unique constraint covering the columns `[verificationCode]` on the table `email_verifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetCode]` on the table `password_resets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_verificationCode_key" ON "public"."email_verifications"("verificationCode");

-- CreateIndex
CREATE INDEX "email_verifications_verificationCode_idx" ON "public"."email_verifications"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_resetCode_key" ON "public"."password_resets"("resetCode");

-- CreateIndex
CREATE INDEX "password_resets_resetCode_idx" ON "public"."password_resets"("resetCode");
