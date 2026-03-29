import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/ui/Input";

export default function Login() {
  const navigate = useNavigate();
  const { user, authInitialized } = useAuth(); // Use context state for session check
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // SESSION CHECK: If already logged in, redirect based on verification status
  useEffect(() => {
    if (authInitialized && user) {
      if (!user.emailVerified) {
        navigate("/check-email", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, authInitialized, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Sign In
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 2. Force Reload to get fresh status
      await userCredential.user.reload();

      // 3. Strict Redirection
      if (!userCredential.user.emailVerified) {
        navigate("/check-email", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  // If session check is running (and no user yet), we still render the form
  // to avoid a blank screen, or we could show a spinner. 
  // Requirement says: "Render Logic: It must ALWAYS render the Inputs (Email/Password) first."
  // So we will just render the form. If useEffect redirects, so be it.

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

          {/* LEFT SECTION */}
          <div className="hidden md:flex flex-col p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="material-symbols-rounded text-4xl">
                  rocket_launch
                </span>
              </div>
              <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">
                WebPilot Automation
              </h1>
            </div>

            <h2 className="text-4xl font-bold tracking-tight mb-4 text-text-light dark:text-text-dark">
              Streamline Your Workflow, Effortlessly.
            </h2>

            <p className="text-text-secondary-light dark:text-text-secondary-dark text-lg">
              Log in to access your dashboard and manage your automated tasks in one place.
            </p>

            <div className="mt-10">
              <img
                src="/login-illustration.svg"
                alt="Workflow illustration"
                className="w-full max-w-xs"
              />
            </div>
          </div>

          {/* LOGIN CARD */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md mx-auto bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-6 sm:p-8">

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                  Welcome Back
                </h2>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  Please enter your details to sign in.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleLogin}>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                    Email Address
                  </label>
                  <div className="mb-2">
                    <Input
                      icon="mail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-sm font-medium text-text-light dark:text-text-dark">
                      Password
                    </label>
                    <a href="/forgot-password" className="text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>

                  <div className="relative">
                    <Input
                      icon="lock"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10" // Extra padding for the eye icon
                    >
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </Input>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-500 text-center">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary py-3 text-white font-semibold disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                {/* Signup */}
                <p className="mt-8 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Don’t have an account?{" "}
                  <a href="/signup" className="text-primary font-medium hover:underline">
                    Sign up
                  </a>
                </p>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}