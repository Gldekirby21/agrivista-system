// ==============================================================================
// OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
// Role Definitions: Exactly two distinct system roles
// ==============================================================================

export type UserRole = "OMAG_HEAD" | "OMAG_STAFF";

export const USER_ROLES = {
  OMAG_HEAD: "OMAG_HEAD" as const,
  OMAG_STAFF: "OMAG_STAFF" as const,
};

export interface RolePermissionConfig {
  role: UserRole;
  label: string;
  description: string;
  defaultRoute: string;
}

export const ROLE_CONFIGS: Record<UserRole, RolePermissionConfig> = {
  OMAG_HEAD: {
    role: "OMAG_HEAD",
    label: "OMAG Head / Municipal Agriculturist",
    description: "Executive oversight, system audits, strategic forecasts, and claim reviews",
    defaultRoute: "/head/dashboard",
  },
  OMAG_STAFF: {
    role: "OMAG_STAFF",
    label: "OMAG Field & Office Staff",
    description: "RSBSA profiling, parcel geotagging, photo inspection, and FIFO inventory distribution",
    defaultRoute: "/staff/beneficiaries",
  },
};
