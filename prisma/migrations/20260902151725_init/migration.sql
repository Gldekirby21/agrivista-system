-- CreateTable
CREATE TABLE "Farmer" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "municipality" TEXT NOT NULL DEFAULT 'Polomolok',
    "province" TEXT NOT NULL DEFAULT 'South Cotabato',
    "isSenior" BOOLEAN NOT NULL DEFAULT false,
    "isPwd" BOOLEAN NOT NULL DEFAULT false,
    "is4ps" BOOLEAN NOT NULL DEFAULT false,
    "isIp" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" SERIAL NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "totalAreaHa" DOUBLE PRECISION NOT NULL,
    "primaryCrop" TEXT NOT NULL,
    "waterSource" TEXT NOT NULL DEFAULT 'Rainfed',
    "isCalamityAffected" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
