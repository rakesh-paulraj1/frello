import api from "./api";
import type { User } from "../store/authStore";

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export const authService = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/signup", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/login", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Backend manages cookies
    // If you have a logout endpoint, call it here to clear the cookie
    // await api.post('/logout');
  },
};
