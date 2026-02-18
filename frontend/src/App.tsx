import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { useAuthStore } from "./store/authStore";
import { authService } from "./services/authService";
import Homepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import BoardPage from "./pages/Board";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ToastContainer from "./components/Toast";
import ConfirmDialog from "./components/ConfirmDialog";
import './App.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PublicRoute>
        <Homepage />
      </PublicRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/board/:id",
    element: (
      <ProtectedRoute>
        <BoardPage />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (user) {
        setIsCheckingSession(false);
        return;
      }


      try {
        const userData = await authService.checkSession();
        setAuth(userData);
      } catch {
        // Only clear auth if we don't have a persisted user
        // This prevents clearing auth on page reload when cookies are valid
        if (!user) {
          clearAuth();
        }
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [setAuth, clearAuth, user]);

  if (isCheckingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-[#efe5df]">Loading...</div>;
  }

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
      <ConfirmDialog />
    </>
  );
}

export default App
