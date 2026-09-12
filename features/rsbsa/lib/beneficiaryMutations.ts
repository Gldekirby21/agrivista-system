import { prisma } from "@/lib/database/prisma";
import { logAuditEvent } from "@/lib/audit/auditLog";
import {
  BeneficiaryCreateSchema,
  BeneficiaryCreateInput,
  BeneficiaryUpdateSchema,
  BeneficiaryUpdateInput,
  FarmCreateSchema,
  FarmCreateInput,
  FarmUpdateSchema,
  FarmUpdateInput,
  ParcelCreateSchema,
  ParcelCreateInput,
  ParcelUpdateSchema,
  ParcelUpdateInput,
  CropRecordSchema,
  CropRecordInput,
  CropUpdateSchema,
  CropUpdateInput,
  DocumentUploadSchema,
  DocumentUploadInput,
  DocumentUpdateSchema,
  DocumentUpdateInput,
} from "./validation";

// -----------------------------------------------------------------------------
// 1. BENEFICIARY MUTATIONS
// -----------------------------------------------------------------------------

export async function createBeneficiary(
  input: BeneficiaryCreateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const validated = BeneficiaryCreateSchema.parse(input);

  if (validated.rsbsaNumber) {
    const existing = await prisma.farmer.findUnique({
      where: { rsbsaNumber: validated.rsbsaNumber },
    });
    if (existing) {
      throw new Error(`RSBSA Identifier '${validated.rsbsaNumber}' is already assigned.`);
    }
  }

  const beneficiary = await prisma.farmer.create({
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
    action: "CREATE",
    module: "BENEFICIARY",
    recordId: String(beneficiary.id),
    newValues: {
      id: beneficiary.id,
      name: `${beneficiary.firstName} ${beneficiary.lastName}`,
      rsbsaNumber: beneficiary.rsbsaNumber,
      barangay: beneficiary.barangay,
    },
  });

  return beneficiary;
}

export async function updateBeneficiary(
  id: number,
  input: BeneficiaryUpdateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.farmer.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Beneficiary record ID ${id} does not exist.`);
  }

  const validated = BeneficiaryUpdateSchema.parse(input);

  if (validated.rsbsaNumber && validated.rsbsaNumber !== existing.rsbsaNumber) {
    const duplicate = await prisma.farmer.findUnique({
      where: { rsbsaNumber: validated.rsbsaNumber },
    });
    if (duplicate && duplicate.id !== id) {
      throw new Error(`RSBSA Identifier '${validated.rsbsaNumber}' is already registered.`);
    }
  }

  const updated = await prisma.farmer.update({
    where: { id },
    data: validated,
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "UPDATE",
    module: "BENEFICIARY",
    recordId: String(id),
    previousValues: {
      firstName: existing.firstName,
      lastName: existing.lastName,
      rsbsaNumber: existing.rsbsaNumber,
      status: existing.status,
    },
    newValues: {
      firstName: updated.firstName,
      lastName: updated.lastName,
      rsbsaNumber: updated.rsbsaNumber,
      status: updated.status,
    },
  });

  return updated;
}

export async function archiveBeneficiary(
  id: number,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.farmer.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Beneficiary ID ${id} not found.`);
  }

  const archived = await prisma.farmer.update({
    where: { id },
    data: { status: "Archived" },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "ARCHIVE",
    module: "BENEFICIARY",
    recordId: String(id),
    previousValues: { status: existing.status },
    newValues: { status: "Archived" },
  });

  return archived;
}

// -----------------------------------------------------------------------------
// 2. FARM LANDHOLDING MUTATIONS
// -----------------------------------------------------------------------------

export async function createFarm(
  input: FarmCreateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const validated = FarmCreateSchema.parse(input);

  const beneficiary = await prisma.farmer.findUnique({
    where: { id: validated.beneficiaryId },
  });
  if (!beneficiary) {
    throw new Error(`Beneficiary ID ${validated.beneficiaryId} not found.`);
  }

  const farm = await prisma.farm.create({
    data: {
      farmerId: validated.beneficiaryId,
      farmName: validated.farmName || `${beneficiary.lastName} Farm`,
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
      status: "Active",
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "CREATE",
    module: "FARM",
    recordId: String(farm.id),
    newValues: {
      id: farm.id,
      beneficiaryId: validated.beneficiaryId,
      farmName: farm.farmName,
      totalAreaHa: farm.totalAreaHa,
      barangay: farm.barangay,
    },
  });

  return farm;
}

export async function updateFarm(
  id: number,
  input: FarmUpdateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.farm.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Farm ID ${id} not found.`);
  }

  const validated = FarmUpdateSchema.parse(input);

  const updated = await prisma.farm.update({
    where: { id },
    data: validated,
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "UPDATE",
    module: "FARM",
    recordId: String(id),
    previousValues: {
      farmName: existing.farmName,
      totalAreaHa: existing.totalAreaHa,
      status: existing.status,
    },
    newValues: {
      farmName: updated.farmName,
      totalAreaHa: updated.totalAreaHa,
      status: updated.status,
    },
  });

  return updated;
}

export async function archiveFarm(
  id: number,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.farm.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Farm ID ${id} not found.`);
  }

  const archived = await prisma.farm.update({
    where: { id },
    data: { status: "Archived" },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "ARCHIVE",
    module: "FARM",
    recordId: String(id),
    previousValues: { status: existing.status },
    newValues: { status: "Archived" },
  });

  return archived;
}

// -----------------------------------------------------------------------------
// 3. FARM PARCEL MUTATIONS
// -----------------------------------------------------------------------------

export async function createFarmParcel(
  input: ParcelCreateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const validated = ParcelCreateSchema.parse(input);

  const farm = await prisma.farm.findUnique({ where: { id: validated.farmId } });
  if (!farm) {
    throw new Error(`Farm ID ${validated.farmId} not found.`);
  }

  const parcel = await prisma.farmParcel.create({
    data: {
      farmId: validated.farmId,
      parcelNumber: validated.parcelNumber,
      areaHa: validated.areaHa,
      latitude: validated.latitude || null,
      longitude: validated.longitude || null,
      soilType: validated.soilType || null,
      remarks: validated.remarks || null,
      status: "Active",
    },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "CREATE",
    module: "PARCEL",
    recordId: String(parcel.id),
    newValues: {
      id: parcel.id,
      farmId: validated.farmId,
      parcelNumber: parcel.parcelNumber,
      areaHa: parcel.areaHa,
    },
  });

  return parcel;
}

export async function updateFarmParcel(
  id: number,
  input: ParcelUpdateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.farmParcel.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Parcel ID ${id} not found.`);
  }

  const validated = ParcelUpdateSchema.parse(input);

  const updated = await prisma.farmParcel.update({
    where: { id },
    data: validated,
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "UPDATE",
    module: "PARCEL",
    recordId: String(id),
    previousValues: {
      parcelNumber: existing.parcelNumber,
      areaHa: existing.areaHa,
      status: existing.status,
    },
    newValues: {
      parcelNumber: updated.parcelNumber,
      areaHa: updated.areaHa,
      status: updated.status,
    },
  });

  return updated;
}

export async function archiveFarmParcel(
  id: number,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.farmParcel.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Parcel ID ${id} not found.`);
  }

  const archived = await prisma.farmParcel.update({
    where: { id },
    data: { status: "Archived" },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "ARCHIVE",
    module: "PARCEL",
    recordId: String(id),
    previousValues: { status: existing.status },
    newValues: { status: "Archived" },
  });

  return archived;
}

// -----------------------------------------------------------------------------
// 4. CROP RECORD MUTATIONS
// -----------------------------------------------------------------------------

export async function createCrop(
  input: CropRecordInput,
  userId?: string,
  roleSnapshot?: string
) {
  const validated = CropRecordSchema.parse(input);

  const parcel = await prisma.farmParcel.findUnique({
    where: { id: validated.parcelId },
  });
  if (!parcel) {
    throw new Error(`Parcel ID ${validated.parcelId} not found.`);
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
    action: "CREATE",
    module: "CROP",
    recordId: String(crop.id),
    newValues: {
      id: crop.id,
      parcelId: validated.parcelId,
      cropType: crop.cropType,
      plantedAreaHa: crop.plantedAreaHa,
      status: crop.status,
    },
  });

  return crop;
}

export async function updateCrop(
  id: number,
  input: CropUpdateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.crop.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Crop ID ${id} not found.`);
  }

  const validated = CropUpdateSchema.parse(input);

  const updated = await prisma.crop.update({
    where: { id },
    data: validated,
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "UPDATE",
    module: "CROP",
    recordId: String(id),
    previousValues: {
      cropType: existing.cropType,
      status: existing.status,
      plantedAreaHa: existing.plantedAreaHa,
    },
    newValues: {
      cropType: updated.cropType,
      status: updated.status,
      plantedAreaHa: updated.plantedAreaHa,
    },
  });

  return updated;
}

export async function archiveCrop(
  id: number,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.crop.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Crop ID ${id} not found.`);
  }

  const archived = await prisma.crop.update({
    where: { id },
    data: { status: "Archived" },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "ARCHIVE",
    module: "CROP",
    recordId: String(id),
    previousValues: { status: existing.status },
    newValues: { status: "Archived" },
  });

  return archived;
}

// -----------------------------------------------------------------------------
// 5. LAND DOCUMENT MUTATIONS
// -----------------------------------------------------------------------------

export async function createLandDocument(
  input: DocumentUploadInput,
  userId: string,
  roleSnapshot?: string
) {
  const validated = DocumentUploadSchema.parse(input);

  const beneficiary = await prisma.farmer.findUnique({
    where: { id: validated.farmerId },
  });
  if (!beneficiary) {
    throw new Error(`Beneficiary ID ${validated.farmerId} not found.`);
  }

  let validUploadedById = userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
    if (fallbackUser) validUploadedById = fallbackUser.id;
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
    action: "CREATE",
    module: "LAND_DOCUMENT",
    recordId: doc.id,
    newValues: {
      id: doc.id,
      beneficiaryId: validated.farmerId,
      documentType: doc.documentType,
      fileName: doc.fileName,
    },
  });

  return doc;
}

export async function updateLandDocument(
  id: string,
  input: DocumentUpdateInput,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.landDocument.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`LandDocument ID ${id} not found.`);
  }

  const validated = DocumentUpdateSchema.parse(input);

  const updated = await prisma.landDocument.update({
    where: { id },
    data: validated,
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "UPDATE",
    module: "LAND_DOCUMENT",
    recordId: id,
    previousValues: {
      documentType: existing.documentType,
      verificationStatus: existing.verificationStatus,
    },
    newValues: {
      documentType: updated.documentType,
      verificationStatus: updated.verificationStatus,
    },
  });

  return updated;
}

export async function archiveLandDocument(
  id: string,
  userId?: string,
  roleSnapshot?: string
) {
  const existing = await prisma.landDocument.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`LandDocument ID ${id} not found.`);
  }

  const archived = await prisma.landDocument.update({
    where: { id },
    data: { verificationStatus: "Archived" },
  });

  await logAuditEvent({
    userId,
    roleSnapshot,
    action: "ARCHIVE",
    module: "LAND_DOCUMENT",
    recordId: id,
    previousValues: { verificationStatus: existing.verificationStatus },
    newValues: { verificationStatus: "Archived" },
  });

  return archived;
}
