import { prisma } from "../lib/database/prisma";

async function main() {
  const cols = await prisma.$queryRawUnsafe<any[]>(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'HistoricalAgriculturalData' ORDER BY ordinal_position;`
  );
  console.log("DB Columns:", cols.map((c) => c.column_name));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
