import { prisma } from "@/lib/database/prisma";
import { logAuditEvent } from "@/lib/audit/auditLog";
import {
  FarmerCreateSchema,
  FarmerCreateInput,
  FarmerUpdateSchema,
  FarmerUpdateInput,
  FarmParcelCreateSchema,
  FarmParcelCreateInput,
  CropRecordSchema,
  CropRecordInput,
  DocumentUploadSchema,
  DocumentUploadInput,
} from "./validation";

/**
 * Creates a new RSBSA Farmer record with audit logging
 */
export async function createFarmer(
  input: FarmerCreateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const validated = FarmerCreateSchema.parse(input);

  // Check unique rsbsaNumber if provided
  if (validated.rsbsaNumber) {
    const existing = await prisma.farmer.findUnique({
      where: { rsbsaNumber: validated.rsbsaNumber },
    });
    if (existing) {
      throw new Error(`RSBSA Number '${validated.rsbsaNumber}' is already registered to another farmer.`);
    }
  }

  const farmer = await prisma.farmer.create({
    data: {
      firstName: validated.firstName,
      middleName: validated.middleName || null,
      lastName: validated.lastName,
      extensionName: validated.extensionName || null,
      rsbsaNumber: validated.rsbsaNumber || null,
      farmerCode: validated.farmerCode || null,
      sex: validated.sex,
      dateOfBirth: validated.dateOfBirth,
      contactNumber: validated.contactNumber || null,
      email: validated.email || null,
      barangay: validated.barangay,
      municipality: validated.municipality,
      province: validated.province,
      civilStatus: validated.civilStatus || null,
      isSenior: validated.isSenior,
      isPwd: validated.isPwd,
      is4ps: validated.is4ps,
      isIp: validated.isIp,
      status: "Active",
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "CREATE_FARMER",
    module: "RSBSA",
    recordId: String(farmer.id),
    newValues: {
      id: farmer.id,
      name: `${farmer.firstName} ${farmer.lastName}`,
      rsbsaNumber: farmer.rsbsaNumber,
      barangay: farmer.barangay,
    },
  });

  return farmer;
}

/**
 * Updates an existing RSBSA Farmer profile with audit logging
 */
export async function updateFarmer(
  id: number,
  input: FarmerUpdateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.farmer.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Farmer record ID ${id} not found.`);
  }

  const validated = FarmerUpdateSchema.parse(input);

  if (validated.rsbsaNumber && validated.rsbsaNumber !== existing.rsbsaNumber) {
    const duplicate = await prisma.farmer.findUnique({
      where: { rsbsaNumber: validated.rsbsaNumber },
    });
    if (duplicate && duplicate.id !== id) {
      throw new Error(`RSBSA Number '${validated.rsbsaNumber}' is already assigned to another farmer.`);
    }
  }

  const updated = await prisma.farmer.update({
    where: { id },
    data: {
      ...validated,
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "UPDATE_FARMER",
    module: "RSBSA",
    recordId: String(id),
    previousValues: {
      firstName: existing.firstName,
      lastName: existing.lastName,
      rsbsaNumber: existing.rsbsaNumber,
      barangay: existing.barangay,
      contactNumber: existing.contactNumber,
    },
    newValues: {
      firstName: updated.firstName,
      lastName: updated.lastName,
      rsbsaNumber: updated.rsbsaNumber,
      barangay: updated.barangay,
      contactNumber: updated.contactNumber,
    },
  });

  return updated;
}

/**
 * Adds a Farm landholding and georeferenced FarmParcel to a Farmer
 */
export async function addFarmAndParcel(
  farmerId: number,
  input: FarmParcelCreateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } });
  if (!farmer) {
    throw new Error(`Farmer ID ${farmerId} does not exist.`);
  }

  const validated = FarmParcelCreateSchema.parse(input);

  const farm = await prisma.farm.create({
    data: {
      farmerId,
      farmName: validated.farmName || `${farmer.lastName} Farm Plot`,
      barangay: validated.barangay,
      municipality: validated.municipality,
      province: validated.province,
      sitioPurok: validated.sitioPurok || null,
      totalAreaHa: validated.totalAreaHa,
      tenureType: validated.tenureType,
      soilType: validated.soilType || null,
      waterSource: validated.waterSource,
      latitude: validated.latitude || null,
      longitude: validated.longitude || null,
      remarks: validated.remarks || null,
      parcels: {
        create: {
          parcelNumber: validated.parcelNumber,
          areaHa: validated.areaHa,
          latitude: validated.latitude || null,
          longitude: validated.longitude || null,
          soilType: validated.soilType || null,
          remarks: validated.remarks || null,
        },
      },
    },
    include: {
      parcels: true,
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "CREATE_FARM_PARCEL",
    module: "RSBSA",
    recordId: String(farm.id),
    newValues: {
      farmId: farm.id,
      farmerId,
      parcelNumber: validated.parcelNumber,
      areaHa: validated.areaHa,
      barangay: validated.barangay,
    },
  });

  return farm;
}

/**
 * Records or updates a crop on a farm parcel
 */
export async function recordCrop(
  input: CropRecordInput,
  userId?: string,
  roleSnapshot?: string
) {
  const validated = CropRecordSchema.parse(input);

  const parcel = await prisma.farmParcel.findUnique({
    where: { id: validated.parcelId },
  });

  if (!parcel) {
    throw new Error(`Farm parcel ID ${validated.parcelId} does not exist.`);
  }

  const crop = await prisma.crop.create({
    data: {
      parcelId: validated.parcelId,
      cropType: validated.cropType,
      variety: validated.variety || null,
      category: validated.category,
      plantedAreaHa: validated.plantedAreaHa,
      plantingDate: validated.plantingDate,
      expectedHarvestDate: validated.expectedHarvestDate || null,
      season: validated.season,
      year: validated.year,
      status: validated.status,
      remarks: validated.remarks || null,
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "RECORD_CROP",
    module: "RSBSA",
    recordId: String(crop.id),
    newValues: {
      cropId: crop.id,
      parcelId: validated.parcelId,
      cropType: crop.cropType,
      plantedAreaHa: crop.plantedAreaHa,
      season: crop.season,
      year: crop.year,
    },
  });

  return crop;
}

/**
 * Attaches a supporting land document metadata to a farmer
 */
export async function addSupportingDocument(
  input: DocumentUploadInput,
  userId: string,
  roleSnapshot?: string
) {
  const validated = DocumentUploadSchema.parse(input);

  const farmer = await prisma.farmer.findUnique({
    where: { id: validated.farmerId },
  });
  if (!farmer) {
    throw new Error(`Farmer ID ${validated.farmerId} does not exist.`);
  }

  // Ensure uploadedById is a valid User foreign key
  let validUploadedById = userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
    if (fallbackUser) {
      validUploadedById = fallbackUser.id;
    }
  }

  const doc = await prisma.landDocument.create({
    data: {
      farmerId: validated.farmerId,
      farmId: validated.farmId || null,
      documentType: validated.documentType,
      storageProvider: "LOCAL",
      bucketName: "agrivista-documents",
      storageKey: validated.storageKey,
      fileName: validated.fileName,
      fileFormat: validated.fileFormat,
      fileSizeBytes: validated.fileSizeBytes,
      uploadedById: validUploadedById,
      verificationStatus: "Attached",
      remarks: validated.remarks || null,
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "UPLOAD_DOCUMENT",
    module: "RSBSA",
    recordId: doc.id,
    newValues: {
      documentId: doc.id,
      farmerId: validated.farmerId,
      documentType: doc.documentType,
      fileName: doc.fileName,
    },
  });

  return doc;
}
