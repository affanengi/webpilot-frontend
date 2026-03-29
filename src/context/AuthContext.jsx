import { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { syncUserWithBackend } from "../api/auth";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authInitialized, setAuthInitialized] = useState(false);
    const hasSyncedSession = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Force reload to get fresh token and emailVerified status
                    await firebaseUser.reload();
                } catch (e) {
                    console.error("Error reloading user in AuthContext:", e);
                }

                // ALWAYS set user to ensure latest verification status is propagated
                setUser(firebaseUser);

                if (!hasSyncedSession.current) {
                    syncUserWithBackend()
                        .then((backendUser) => {
                            // Merge firebaseUser with backend data
                            setUser((prev) => ({ ...prev, ...backendUser }));
                            hasSyncedSession.current = true;
                        })
                        .catch((err) => {
                            console.error("Background sync error:", err);
                            // user remains as firebaseUser (fallback)
                        });
                }
            } else {
                setUser(null);
                hasSyncedSession.current = false;
            }

            setAuthInitialized(true);
        });

        return unsubscribe;
    }, []); // Empty dependency array ensures this runs once on mount

    // --- NEW FUNCTION: Manually refresh user state to fix race conditions ---
    const refreshUser = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            // We spread {...} to create a new object reference, forcing React to re-render
            const freshUser = { ...auth.currentUser };
            setUser(freshUser);
            return freshUser;
        }
        return null;
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            hasSyncedSession.current = false;
        }
    };

    const value = {
        user,
        authInitialized,
        refreshUser, // <--- Exported here
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}