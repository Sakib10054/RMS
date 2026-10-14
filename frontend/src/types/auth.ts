
export type UserRole = 'MANAGER' | 'STAFF' | 'CUSTOMER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

