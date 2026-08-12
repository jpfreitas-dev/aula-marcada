-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('EMPTY', 'ATTENDED', 'ABSENT');

-- CreateEnum
CREATE TYPE "ClassPeriod" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CASH');

-- CreateEnum
CREATE TYPE "AllocationSource" AS ENUM ('PAYMENT', 'ADVANCE_PIX', 'ADVANCE_CASH');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guardian_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hourly_rate" DECIMAL(10,2) NOT NULL,
    "advance_balance_pix" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "advance_balance_cash" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_recurrences" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_recurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "period" "ClassPeriod" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "expected_amount" DECIMAL(10,2) NOT NULL,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'EMPTY',
    "is_makeup_only" BOOLEAN NOT NULL DEFAULT false,
    "pending_makeup_minutes" INTEGER NOT NULL DEFAULT 0,
    "content" VARCHAR(500),
    "notes" VARCHAR(500),
    "has_manual_amount_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "makeup_links" (
    "id" TEXT NOT NULL,
    "makeup_class_id" TEXT NOT NULL,
    "absence_class_id" TEXT NOT NULL,
    "covered_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "makeup_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_allocations" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "source" "AllocationSource" NOT NULL,
    "payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_recurrences_student_id_weekday_key" ON "student_recurrences"("student_id", "weekday");

-- CreateIndex
CREATE INDEX "classes_student_id_idx" ON "classes"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_date_period_key" ON "classes"("date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "makeup_links_makeup_class_id_absence_class_id_key" ON "makeup_links"("makeup_class_id", "absence_class_id");

-- CreateIndex
CREATE INDEX "class_allocations_class_id_idx" ON "class_allocations"("class_id");

-- AddForeignKey
ALTER TABLE "student_recurrences" ADD CONSTRAINT "student_recurrences_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "makeup_links" ADD CONSTRAINT "makeup_links_makeup_class_id_fkey" FOREIGN KEY ("makeup_class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "makeup_links" ADD CONSTRAINT "makeup_links_absence_class_id_fkey" FOREIGN KEY ("absence_class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_allocations" ADD CONSTRAINT "class_allocations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_allocations" ADD CONSTRAINT "class_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
