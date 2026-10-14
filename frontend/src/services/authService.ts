import { api } from '../lib/api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<unknown> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

