/*
  Warnings:

  - You are about to drop the column `isSuperAdmin` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "isSuperAdmin";
