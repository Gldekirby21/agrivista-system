// ==============================================================================
// OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
// Authentication & Session Interface Definitions
// ==============================================================================

import { UserRole } from "./roles";

export interface UserSession {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  user?: UserSession;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}
