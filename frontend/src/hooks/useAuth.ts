import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";

export const useAuth = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = () => {
    authService.logout();
    clearAuth();
  };

  return {
    logout,
  };
};
