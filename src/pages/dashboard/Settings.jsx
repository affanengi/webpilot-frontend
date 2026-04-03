import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase";

import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { useTheme } from "../../context/ThemeContext";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setTheme: setGlobalTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: "Light Mode",
    language: "English (US)",
    timezone: "(UTC-05:00) Eastern Time",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setBio(data.bio || "");
            setIs2FAEnabled(data.is2FAEnabled || false);

            const prefs = data.preferences || {};
            setPreferences({
              theme: prefs.theme === "light" ? "Light Mode" : (prefs.theme || "Light Mode"),
              language: prefs.language === "en" ? "English (US)" : (prefs.language || "English (US)"),
              timezone: prefs.timezone === "UTC" ? "(UTC+00:00) UTC" : (prefs.timezone || "(UTC-05:00) Eastern Time")
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Update Profile in Auth
      if (name !== user.displayName) {
        await updateProfile(user, {
          displayName: name,
        });
      }

      // 2. Update Firestore Doc
      const userDocRef = doc(db, "users", user.uid);

      await setDoc(userDocRef, {
        displayName: name,
        bio: bio
      }, { merge: true });

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Check your email to reset password.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      alert("Failed to send password reset email.");
    }
  };

  const handleToggle2FA = async () => {
    const newValue = !is2FAEnabled;
    setIs2FAEnabled(newValue); // Optimistic UI update

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { is2FAEnabled: newValue });
    } catch (error) {
      console.error("Error updating 2FA:", error);
      setIs2FAEnabled(!newValue); // Revert on failure
      alert("Failed to update 2FA settings. Please try again.");
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    if (key === "theme") {
      const mode = value === "Dark Mode" ? "dark" : value === "System Default" ? "system" : "light";
      setGlobalTheme(mode);
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { preferences: newPrefs });
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <div className="xl:col-span-8 space-y-8">

            {/* PROFILE SETTINGS */}
            <section className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">person</span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Profile Settings
                  </h2>
                </div>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-full h-auto w-auto"
                    title="Edit Profile"
                  >
                    <span className="material-symbols-rounded">edit</span>
                  </Button>
                )}
              </div>

              <div className="p-4 sm:p-8 space-y-8">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="relative flex-shrink-0 group">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-white dark:border-border-dark shadow-md"
                      />
                    ) : (
                      <img
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user?.email || "default")}`}
                        alt="Profile"
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-white dark:border-border-dark bg-gray-100 dark:bg-card-dark shadow-md"
                      />
                    )}
                  </div>

                  <div className="pt-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                      {name || "User"}
                    </h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">
                      Update your photo and personal details to showcase your identity.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      Full Name
                    </span>
                    {isEditing ? (
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    ) : (
                      <p className="min-h-[44px] flex items-center text-text-primary-light dark:text-text-primary-dark font-medium px-4">
                        {name}
                      </p>
                    )}
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      Email Address
                    </span>
                    <Input
                      disabled
                      value={user?.email || ""}
                      className="cursor-not-allowed opacity-75"
                    />
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      Contact support to change email.
                    </span>
                  </label>

                  <label className="md:col-span-2 flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      Bio
                    </span>
                    {isEditing ? (
                      <Textarea
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us a little about yourself..."
                      />
                    ) : (
                      <p className="min-h-[6rem] p-4 text-text-secondary-light dark:text-text-secondary-dark whitespace-pre-wrap text-sm leading-relaxed">
                        {bio || "No bio set."}
                      </p>
                    )}
                  </label>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3 pt-6 border-t border-border-light dark:border-border-dark">
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setName(user?.displayName || "");
                      }}
                      variant="ghost"
                      className="px-5 py-2.5 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      variant="primary"
                      className="px-5 py-2.5 text-sm font-bold"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>
            </section>

            {/* ACCOUNT PREFERENCES */}
            {/* Added relative z-10 for dropdowns, Removed overflow-hidden */}
            <section className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm relative z-20">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5 rounded-t-2xl">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">tune</span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Account Preferences
                  </h2>
                </div>
              </div>

              <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <label className="flex flex-col gap-2 relative z-30">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    <span className="material-symbols-rounded text-gray-400">palette</span>
                    Appearance
                  </span>
                  <CustomSelect
                    value={preferences.theme}
                    options={["Light Mode", "Dark Mode", "System Default"]}
                    onChange={(val) => handlePreferenceChange("theme", val)}
                  />
                </label>

                <label className="flex flex-col gap-2 relative z-20">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    <span className="material-symbols-rounded text-gray-400">language</span>
                    Language
                  </span>
                  <CustomSelect
                    value={preferences.language}
                    options={["English (US)", "Spanish", "French", "German"]}
                    onChange={(val) => handlePreferenceChange("language", val)}
                  />
                </label>

                <label className="flex flex-col gap-2 relative z-10">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    <span className="material-symbols-rounded text-gray-400">schedule</span>
                    Time Zone
                  </span>
                  <CustomSelect
                    value={preferences.timezone}
                    options={[
                      "(UTC-05:00) Eastern Time",
                      "(UTC-08:00) Pacific Time",
                      "(UTC+00:00) UTC",
                      "(UTC+05:30) India Standard Time"
                    ]}
                    onChange={(val) => handlePreferenceChange("timezone", val)}
                  />
                </label>
              </div>
            </section>

            {/* SECURITY SETTINGS */}
            <section className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm overflow-hidden z-0">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">security</span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Security Settings
                  </h2>
                </div>
              </div>

              <div className="p-4 sm:p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={is2FAEnabled}
                      onChange={handleToggle2FA}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border-light dark:border-border-dark">
                  <div>
                    <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
                      Password
                    </p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                      Last changed 3 months ago.
                    </p>
                  </div>
                  <Button
                    onClick={handlePasswordReset}
                    variant="outline"
                    className="px-4 py-2 text-sm"
                  >
                    Change Password
                  </Button>
                </div>

                <div className="pt-4 border-t border-border-light dark:border-border-dark">
                  <div className="flex justify-between mb-4">
                    <p className="font-bold text-text-primary-light dark:text-text-primary-dark">
                      Active Sessions
                    </p>
                    <Button variant="ghost" className="text-error text-sm hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-1 h-auto">
                      Log out all devices
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {[
                      ["desktop_mac", "MacBook Pro (Current)", "San Francisco, US • 192.168.1.1", true],
                      ["smartphone", "iPhone 13", "San Francisco, US • 2 days ago", false],
                    ].map(([icon, title, subtitle, active]) => (
                      <div
                        key={title}
                        className="flex items-center gap-4 p-3 rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-black/20"
                      >
                        <span className="material-symbols-rounded text-gray-500 dark:text-gray-400">
                          {icon}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">
                            {title}
                          </p>
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                            {subtitle}
                          </p>
                        </div>
                        {active && <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* CONNECTED ACCOUNTS */}
            <section className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">hub</span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Connected Accounts
                  </h2>
                </div>
              </div>

              <div className="p-4 sm:p-8 space-y-4">
                {["Google", "Slack", "GitHub"].map((app) => (
                  <div
                    key={app}
                    className="flex justify-between items-center p-4 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* You could add icons here */}
                      <p className="font-bold text-text-primary-light dark:text-text-primary-dark">{app}</p>
                    </div>
                    <Button variant="outline" className="px-4 py-2 text-xs h-auto bg-transparent">
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-4 space-y-6 sticky top-6 self-start">

            {/* PLAN CARD (REDESIGNED) */}
            <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">verified</span>
                  </div>
                  <h3 className="font-bold text-text-primary-light dark:text-text-primary-dark">
                    Current Plan
                  </h3>
                </div>
                <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full bg-primary/10 text-primary border border-primary/20">
                  Active
                </span>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-3xl font-black tracking-tight text-text-primary-light dark:text-text-primary-dark mb-1">
                    Pro Plan
                  </h3>
                  <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    $49/month • Renews on Nov 1st
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {["Unlimited Workflows", "Priority Support", "5 Team Members"].map((t) => (
                    <div key={t} className="flex items-center gap-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="material-symbols-rounded text-emerald-500 text-[20px]">check_circle</span>
                      {t}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate("/pricing")}
                  variant="primary"
                  className="w-full font-bold shadow-lg shadow-primary/20"
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>

            {/* HELP */}
            <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">help</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Help & Support
                  </h3>
                </div>
              </div>

              <div className="p-6 pt-2">
                <div className="space-y-2 mt-4">
                  {[
                    ["description", "Documentation", "/docs"],
                    ["support_agent", "Contact Support", "/support/contact"],
                    ["bug_report", "Report a Bug", "/support/report-bug"],
                  ].map(([icon, label, path]) => (
                    <div
                      key={label}
                      onClick={() => navigate(path, { state: { from: "/settings" } })}
                      className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-rounded text-gray-400 group-hover:text-primary transition-colors">{icon}</span>
                        <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{label}</span>
                      </div>
                      <span className="material-symbols-rounded text-gray-400 text-sm">chevron_right</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark text-center text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark opacity-60">
                  WebPilot v2.4.0
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
