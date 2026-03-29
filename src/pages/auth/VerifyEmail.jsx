import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../../firebase";
import { applyActionCode } from "firebase/auth";
import { useAuth } from "../../context/AuthContext"; // Import useAuth

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser } = useAuth(); // Destructure refreshUser
    const effectRan = useRef(false);

    const [status, setStatus] = useState("verifying"); // verifying, success

    const oobCode = searchParams.get("oobCode");

    useEffect(() => {
        if (effectRan.current === false) {
            const verifyEmail = async () => {
                // 1. STRICT CHECK: Is there a code?
                if (!oobCode) {
                    console.warn("No verification code found. Redirecting to login.");
                    navigate("/login", { replace: true });
                    return;
                }

                // 2. HAS CODE: Try to verify
                try {
                    await applyActionCode(auth, oobCode);
                    setStatus("success");

                    // 3. RACE CONDITION FIX: Update Context State immediately
                    // This ensures ProtectedLayout sees emailVerified: true
                    await refreshUser();

                    // 4. Navigate to Dashboard
                    // We can navigate immediately since context is fresh
                    setTimeout(() => {
                        navigate("/dashboard", { replace: true });
                    }, 2000); // Keeping delay for user to read "Verified!"

                } catch (error) {
                    console.error("Verification failed:", error);
                    setStatus("error");
                }
            };

            verifyEmail();

            return () => {
                effectRan.current = true;
            };
        }
    }, [oobCode, navigate, refreshUser]);

    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-display text-white">
                <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-xl border border-[#1e293b] p-8 text-center space-y-6">
                    <span className="material-symbols-outlined text-red-500 text-6xl">
                        error
                    </span>
                    <h2 className="text-xl font-bold">Verification Failed</h2>
                    <p className="text-slate-400 text-sm">
                        This link may have expired or is invalid. Please try signing in and requesting a new one.
                    </p>
                    <button
                        onClick={() => navigate("/login")}
                        className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-display text-white">
            <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-xl border border-[#1e293b] p-8 text-center space-y-6">

                {status === "verifying" && (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                        </div>
                        <h2 className="text-xl font-bold">Verifying...</h2>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-4">
                        <span className="material-symbols-outlined text-green-500 text-6xl">
                            check_circle
                        </span>
                        <h2 className="text-xl font-bold">Verified!</h2>
                        <p className="text-slate-400 text-sm">
                            Redirecting you to the dashboard...
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
