import { prisma } from "../lib/database/prisma";

async function main() {
  try {
    const records = await prisma.photoVerification.findMany({
      select: {
        id: true,
        originalFileName: true,
        fileSizeBytes: true,
        mimeType: true,
        verificationStatus: true,
        metadataJson: true,
      },
    });
    console.log("FOUND_RECORDS_COUNT:", records.length);
    for (const r of records) {
      const meta = r.metadataJson as any;
      console.log(`- ID: ${r.id}, file: ${r.originalFileName}, size: ${r.fileSizeBytes}, hasBase64: ${Boolean(meta?.photoBase64)}`);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
