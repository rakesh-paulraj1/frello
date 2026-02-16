import { createBrowserRouter, RouterProvider } from "react-router";
import Homepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import BoardPage from "./pages/Board";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
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
  return <RouterProvider router={router} />
}

export default App
