import { useState } from "react";

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 p-3 mb-4">
              <div className="bg-primary rounded-xl p-3">
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: "32px" }}
                >
                  rocket_launch
                </span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-text-light dark:text-text-dark text-xl font-bold leading-normal">
                  WebPilot
                </h1>
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-normal leading-normal">
                  Automation
                </p>
              </div>
            </div>
          </div>

          {/* Forgot Password Form */}
          {!submitted && (
            <div className="bg-card-light dark:bg-card-dark p-6 sm:p-8 rounded-xl shadow-sm space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                  Forgot Password?
                </h2>
                <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  No worries, we'll send you reset instructions.
                </p>
              </div>

              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium"
                  >
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="block w-full rounded-lg border-0 py-3 px-4 bg-background-light dark:bg-background-dark ring-1 ring-inset ring-border-light dark:ring-border-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark focus:ring-2 focus:ring-primary sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full justify-center rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                >
                  Send Reset Link
                </button>
              </form>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-sm font-medium text-primary hover:underline flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    arrow_back
                  </span>
                  Back to Log In
                </a>
              </div>
            </div>
          )}

          {/* Confirmation Message */}
          {submitted && (
            <div className="bg-card-light dark:bg-card-dark p-6 sm:p-8 rounded-xl shadow-sm text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex items-center justify-center size-16 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <span
                    className="material-symbols-outlined text-green-600 dark:text-green-400"
                    style={{ fontSize: "32px" }}
                  >
                    mark_email_read
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Check your email
                </h2>
                <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  We have sent password recovery instructions to your email.
                </p>
              </div>

              <button
                type="button"
                className="flex w-full justify-center rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                Open Email App
              </button>

              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Didn’t receive the email?{" "}
                <span className="font-medium text-primary hover:underline cursor-pointer">
                  Click to resend
                </span>
              </div>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-sm font-medium text-primary hover:underline flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    arrow_back
                  </span>
                  Back to Log In
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
