/*
  Warnings:

  - You are about to drop the `board_members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "board_members" DROP CONSTRAINT "board_members_board_id_fkey";

-- DropForeignKey
ALTER TABLE "board_members" DROP CONSTRAINT "board_members_user_id_fkey";

-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "board_members";
