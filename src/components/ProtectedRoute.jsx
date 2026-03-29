import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, authInitialized } = useAuth();

  // 1. Initial Loading State (App Hydration)
  if (!authInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-background-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // 2. Auth Check
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Render
  return children;
}
