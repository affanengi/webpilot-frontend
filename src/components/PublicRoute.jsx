import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
    const { user, authInitialized } = useAuth();
    const location = useLocation();

    // 1. Initial Loading State (App Hydration)
    // Wait for AuthContext to confirm state before deciding
    if (!authInitialized) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-background-dark">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    // 2. Auth Check
    // If user is already logged in, redirect them out of the "Public" area
    if (user) {
        // Smart Redirect: Ensure unverified users go to verification
        if (!user.emailVerified) {
            return <Navigate to="/verify-email" replace />;
        }

        // Default to Dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // 3. Render Public Page (Login, Signup, etc.)
    return children;
}
