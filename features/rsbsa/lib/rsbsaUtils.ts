export const POLOMOLOK_BARANGAY_CODES: Record<string, string> = {
  "Bentung": "001",
  "Cannery Site": "002",
  "Crossing Pangi": "003",
  "Glamang": "004",
  "Kinilis": "005",
  "Klinan 6": "006",
  "Koronadal Proper": "007",
  "Lam-caliaf": "008",
  "Lapu": "009",
  "Lumakil": "010",
  "Maligo": "011",
  "Magsaysay": "012",
  "Pagalungan": "013",
  "Poblacion": "014",
  "Polo": "015",
  "Rubber": "016",
  "Silway 7": "017",
  "Silway 8": "018",
  "Sulit": "019",
  "Sumbakil": "020",
  "Upper Klinan": "021",
};

/**
 * Generates an auto-generated RSBSA Code ID for agricultural beneficiaries in Polomolok, South Cotabato.
 * Structure: Region (12) - Province (63) - Municipality (14) - Barangay (001-021) - Sequential/Random Unique Identifier (6 digits)
 * Example: 12-63-14-014-482910
 */
export function generateRsbsaNumber(barangay: string = "Poblacion"): string {
  const brgyCode = POLOMOLOK_BARANGAY_CODES[barangay] || "014";
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `12-63-14-${brgyCode}-${randomSuffix}`;
}
