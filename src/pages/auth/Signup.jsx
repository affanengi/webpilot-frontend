import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import Input from "../../components/ui/Input";

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Update display name in Firebase
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      // 3. Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: fullName,
        email: email,
        bio: "",
        is2FAEnabled: false,
        preferences: {
          theme: "light",
          language: "en",
          timezone: "UTC"
        },
        createdAt: new Date(),
      });

      // 4. Send verification email
      await sendEmailVerification(userCredential.user, {
        url: window.location.origin + "/dashboard",
      });

      console.log("Signup successful, redirecting to check-email...");

      // 5. Always redirect to check-email (The Waiting Room)
      navigate("/check-email", { replace: true });

    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="bg-primary rounded-lg p-2">
                <span className="material-symbols-outlined text-white text-[24px]">
                  rocket_launch
                </span>
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-base font-bold">WebPilot</h1>
                <p className="text-sm text-text-secondary-light">Automation</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold">
              Create your account
            </h2>
            <p className="text-sm text-text-secondary-light mt-1">
              Start automating your workflows in minutes.
            </p>
          </div>

          {/* Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-soft p-6 sm:p-8">
            <form className="space-y-6" onSubmit={handleSignup}>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Full Name
                </label>
                <div className="mb-2">
                  <Input
                    icon="person"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Email address
                </label>
                <div className="mb-2">
                  <Input
                    icon="mail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Input
                    icon="lock"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                  >
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary-light"
                    >
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
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
                className="flex w-full justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-text-secondary-light">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-primary hover:underline">
              Log in
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}