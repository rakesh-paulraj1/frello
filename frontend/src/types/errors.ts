import type { AxiosError } from "axios";

export interface ApiError {
  error: string;
}

export type AuthError = AxiosError<ApiError>;
