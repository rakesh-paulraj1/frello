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
    const response = await api.post<AuthResponse>("/auth/signup", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Backend manages cookies
    // If you have a logout endpoint, call it here to clear the cookie
    // await api.post('/logout');
  },

  checkSession: async (): Promise<User> => {
    const response = await api.get<User>("/me");
    return response.data;
  },
};
