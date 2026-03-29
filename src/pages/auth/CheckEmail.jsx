import { useState } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { auth } from "../../firebase";
import { sendEmailVerification, signOut } from "firebase/auth"; // Added signOut
import { useAuth } from "../../context/AuthContext";

export default function CheckEmail() {
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get("oobCode");

    // TRAFFIC CONTROLLER: If this is a verification link, forward to processor
    // Don't render anything else.
    if (oobCode) {
        return <Navigate to={"/verify-email?oobCode=" + oobCode} replace />;
    }

    const navigate = useNavigate();
    const { user, refreshUser } = useAuth(); // Destructure refreshUser
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // success or error

    // Countdown timer effect
    if (resendDisabled && countdown > 0) {
        setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (resendDisabled && countdown === 0) {
        setResendDisabled(false);
    }

    const handleVerifiedCheck = async () => {
        if (auth.currentUser) {
            // FIX 2: Use refreshUser() instead of reload()
            // This ensures AuthContext is updated so ProtectedLayout doesn't kick us back
            await refreshUser();

            // Now check the updated user object from auth
            if (auth.currentUser.emailVerified) {
                navigate("/dashboard");
            } else {
                setMessage("Still not verified. Please check your email and click the link.");
                setMessageType("error");
            }
        } else {
            navigate("/login");
        }
    };

    const handleResend = async () => {
        if (auth.currentUser) {
            try {
                await sendEmailVerification(auth.currentUser);
                setMessage("Verification email sent! Check your inbox.");
                setMessageType("success");
                setResendDisabled(true);
                setCountdown(60);
            } catch (error) {
                console.error("Error sending email:", error);
                setMessage("Error sending email. Try again later.");
                setMessageType("error");
            }
        }
    };

    // FIX 1: Break the loop by signing out
    const handleBackToLogin = async () => {
        await signOut(auth);
        navigate("/login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-display text-white">
            <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-xl border border-[#1e293b] p-8 text-center space-y-6">

                {/* ICON */}
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            mark_email_unread
                        </span>
                    </div>
                </div>

                {/* HEADER */}
                <div>
                    <h2 className="text-2xl font-bold mb-2">Verify your email</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        We have sent a verification email to <br />
                        <span className="text-white font-medium">{user?.email}</span>.
                        <br />
                        Please check your inbox and click the link.
                    </p>
                </div>

                {/* TOAST MESSAGE */}
                {message && (
                    <div className={`p-3 rounded-lg text-sm ${messageType === "error" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                        {message}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="space-y-3">
                    <button
                        onClick={handleVerifiedCheck}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all shadow-lg shadow-primary/25"
                    >
                        I have verified
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={resendDisabled}
                        className="w-full py-3 bg-transparent border border-[#1e293b] hover:bg-[#1e293b] text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resendDisabled ? `Resend Email (${countdown}s)` : "Resend Email"}
                    </button>
                </div>

                {/* FOOTER */}
                <div className="pt-4 border-t border-[#1e293b]">
                    <button
                        onClick={handleBackToLogin}
                        className="text-sm text-slate-500 hover:text-white transition-colors"
                    >
                        Back to Login
                    </button>
                </div>

            </div>
        </div>
    );
}
