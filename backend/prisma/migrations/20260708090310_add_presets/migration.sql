-- AlterTable
ALTER TABLE "periods" ADD COLUMN     "presetId" TEXT;

-- CreateTable
CREATE TABLE "presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presets" ADD CONSTRAINT "presets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
