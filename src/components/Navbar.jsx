import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db } from "../firebase";
import { automations as templateAutomations } from "../data/automations";

export default function Navbar({ title, subtitle, onMenuClick, showBackButton, onBack }) {
  const navigate = useNavigate();
  const [themeOpen, setThemeOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const [userAutomations, setUserAutomations] = useState([]);

  const themeBtnRef = useRef(null);
  const themeMenuRef = useRef(null);
  const profileBtnRef = useRef(null);
  const profileMenuRef = useRef(null);

  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 0, left: 0 });
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth(); // Auth Hook

  const ADMIN_EMAILS = ["mohammedaffanrazvi604@gmail.com"];
  const [dailyCredits, setDailyCredits] = useState(20);
  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Support both old monthlyCredits (legacy) and new dailyCredits
        const credits = data.dailyCredits !== undefined ? data.dailyCredits : (data.monthlyCredits || 0);
        setDailyCredits(credits);
      }
    });

    // Ping /credits on mount to trigger server-side daily reset if date has changed
    const pingCredits = async () => {
      try {
        const { auth: firebaseAuth } = await import("../firebase");
        const idToken = await firebaseAuth.currentUser?.getIdToken();
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
        if (idToken) fetch(`${API_BASE}/automations/credits`, { headers: { Authorization: `Bearer ${idToken}` } });
      } catch (_) {}
    };
    pingCredits();

    const unsubAutomations = onSnapshot(
      collection(db, "users", user.uid, "automations"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setUserAutomations(data);
      }
    );

    return () => {
      unsubUser();
      unsubAutomations();
    };
  }, [user]);

  // Avatar Logic
  const avatarSrc = user?.photoURL
    ? user.photoURL
    // Option 1: The Sci-Fi Droid (Robohash Set 3)
    // : `https://robohash.org/${encodeURIComponent(user?.email || "user")}.png?set=set3&bgset=bg1`;

    // Option 2: Retro Pixel Art (DiceBear)
    : `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user?.email || "user")}`;

  // Option 3: Abstract Rings (DiceBear)
  // : `https://api.dicebear.com/9.x/rings/svg?seed=${encodeURIComponent(user?.email || "user")}`;



  /* ---------------- OUTSIDE CLICK (THEME) ---------------- */
  useEffect(() => {
    const handler = (e) => {
      // Theme Dropdown Outside Click
      if (
        themeOpen &&
        !themeMenuRef.current?.contains(e.target) &&
        !themeBtnRef.current?.contains(e.target)
      ) {
        setThemeOpen(false);
      }

      // Profile Dropdown Outside Click
      if (
        profileOpen &&
        !profileMenuRef.current?.contains(e.target) &&
        !profileBtnRef.current?.contains(e.target)
      ) {
        setProfileOpen(false);
      }

      // Search Dropdown Outside Click
      if (searchOpen && !searchRef.current?.contains(e.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [themeOpen, profileOpen, searchOpen]);

  // Handle Search filtering
  const searchTerm = search.toLowerCase().trim();
  const searchResults = searchTerm ? {
    user: userAutomations.filter(a => a.name?.toLowerCase().includes(searchTerm) || a.title?.toLowerCase().includes(searchTerm) || a.description?.toLowerCase().includes(searchTerm)),
    templates: templateAutomations.filter(t => t.title?.toLowerCase().includes(searchTerm) || t.description?.toLowerCase().includes(searchTerm))
  } : { user: [], templates: [] };

  const hasResults = searchTerm && (searchResults.user.length > 0 || searchResults.templates.length > 0);

  const openThemeDropdown = () => {
    const rect = themeBtnRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 180),
    });
    setThemeOpen((p) => !p);
  };

  const openProfileDropdown = () => {
    const rect = profileBtnRef.current.getBoundingClientRect();
    const dropdownWidth = 320; // 20rem / w-80
    const margin = 16;

    // Calculate left: Align right edge of dropdown with right edge of button, but ensure it fits in window
    let left = rect.right - dropdownWidth;

    // Ensure it doesn't go off-screen to the left (unlikely for profile btn) or right
    if (left + dropdownWidth > window.innerWidth - margin) {
      left = window.innerWidth - dropdownWidth - margin;
    }

    setProfileMenuPos({
      top: rect.bottom + 12, // Slight gap
      left: left,
    });
    setProfileOpen((p) => !p);
  };

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-6 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark relative z-30 transition-colors duration-200">

      {/* LEFT */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <span className="material-symbols-rounded text-2xl text-text-secondary-light dark:text-text-secondary-dark">
            menu
          </span>
        </button>

        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-text-secondary-light hover:text-text-primary-light dark:text-text-secondary-dark dark:hover:text-text-primary-dark transition-colors"
          >
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
        )}

        {!mobileSearchOpen && (
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* CENTER SEARCH — DESKTOP */}
      <div className="hidden md:flex flex-1 justify-center px-6" ref={searchRef}>
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-base">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
               setSearch(e.target.value);
               if (e.target.value.trim() !== "") setSearchOpen(true);
               else setSearchOpen(false);
            }}
            onFocus={() => {
               if (search.trim() !== "") setSearchOpen(true);
            }}
            placeholder="Search automations..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm
                       bg-gray-100 dark:bg-black/20
                       border border-transparent dark:border-border-dark
                       text-text-primary-light dark:text-text-primary-dark
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
          />

          {/* Search Dropdown Results */}
          {searchOpen && searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-border-light dark:border-border-dark rounded-xl shadow-xl overflow-hidden z-50 max-h-[25rem] overflow-y-auto">
              {hasResults ? (
                <>
                  {searchResults.user.length > 0 && (
                     <div className="py-2">
                        <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark bg-gray-50 dark:bg-black/20">
                           My Automations
                        </div>
                        {searchResults.user.map(auto => (
                           <button
                             key={auto.id}
                             onClick={() => {
                               navigate(`/automations/${auto.id}`);
                               setSearchOpen(false);
                               setSearch("");
                             }}
                             className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                           >
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                 <span className="material-symbols-rounded text-primary text-sm">{auto.icon || "bolt"}</span>
                              </div>
                              <div className="min-w-0">
                                 <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">{auto.name || auto.title}</p>
                                 <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark truncate">{auto.description || "Custom Automation"}</p>
                              </div>
                           </button>
                        ))}
                     </div>
                  )}

                  {searchResults.templates.length > 0 && (
                     <div className="py-2 border-t border-border-light dark:border-border-dark">
                        <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark bg-gray-50 dark:bg-black/20">
                           Explore Templates
                        </div>
                        {searchResults.templates.map(tmpl => (
                           <button
                             key={tmpl.id}
                             onClick={() => {
                               navigate("/canvas-automation", { state: { template: tmpl } });
                               setSearchOpen(false);
                               setSearch("");
                             }}
                             className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                           >
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                 <span className="material-symbols-rounded text-primary text-sm">{tmpl.icon}</span>
                              </div>
                              <div className="min-w-0">
                                 <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">{tmpl.title}</p>
                                 <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark truncate">{tmpl.description}</p>
                              </div>
                           </button>
                        ))}
                     </div>
                  )}
                </>
              ) : (
                 <div className="p-6 text-center text-text-secondary-light dark:text-text-secondary-dark text-sm">
                   No automations found matching "{searchTerm}"
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 flex-shrink-0">

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex px-4 py-2 rounded-lg text-sm bg-primary text-white hover:bg-primary-hover gap-1 items-center font-medium shadow-sm transition-colors"
            >
              Docs
              <ExternalLink size={14} />
            </a>
          </button>
        </div>

        <button
          ref={themeBtnRef}
          onClick={openThemeDropdown}
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark transition-colors"
        >
          <span className="material-symbols-rounded text-[22px]">
            dark_mode
          </span>
        </button>

        <button
          ref={profileBtnRef}
          onClick={openProfileDropdown}
          className="w-10 h-10 rounded-full bg-[#f0f0f0] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition border border-border-light dark:border-border-dark ring-2 ring-transparent hover:ring-primary/20"
        >
          <img
            src={avatarSrc}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </button>
      </div>

      {/* THEME DROPDOWN */}
      {
        themeOpen && (
          <div
            ref={themeMenuRef}
            className="fixed z-50 w-44 rounded-xl border border-border-light dark:border-border-dark
                     bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
            style={menuPos}
          >
            {[
              { id: "system", label: "System", icon: "devices" },
              { id: "light", label: "Light", icon: "light_mode" },
              { id: "dark", label: "Dark", icon: "dark_mode" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setTheme(item.id);
                  setThemeOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                hover:bg-gray-50 dark:hover:bg-white/5
                ${theme === item.id
                    ? "font-semibold text-primary"
                    : "text-text-secondary-light dark:text-text-secondary-dark"
                  }`}
              >
                <span className="material-symbols-rounded text-base">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        )
      }

      {/* PROFILE DROPDOWN */}
      {
        profileOpen && (
          <div
            ref={profileMenuRef}
            className="fixed z-50 w-80 rounded-2xl border border-border-light dark:border-border-dark
                     bg-white dark:bg-zinc-900 shadow-2xl p-4 ring-1 ring-black/5"
            style={profileMenuPos}
          >
            <div className="flex items-start gap-3 mb-5 pb-4 border-b border-border-light dark:border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm border border-border-light dark:border-zinc-700">
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 pt-0.5">
                <span className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate text-base">
                  {user?.name || "WebPilot User"}
                </span>
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate mb-1">
                  {user?.email || "user@example.com"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm w-fit">
                  Pro Plan
                </span>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => {
                  navigate("/settings");
                  setProfileOpen(false);
                }}
                className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl
                         bg-gray-50 dark:bg-white/5
                         hover:bg-indigo-50 dark:hover:bg-primary/20
                         border border-transparent hover:border-indigo-100 dark:hover:border-primary/30
                         transition-all duration-200"
              >
                <span className="material-symbols-rounded text-2xl text-gray-500 group-hover:text-primary dark:text-gray-400 dark:group-hover:text-primary transition-colors">
                  settings
                </span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-primary dark:text-gray-300 dark:group-hover:text-primary">
                  Settings
                </span>
              </button>
              <button
                onClick={async () => {
                  await logout();
                  setProfileOpen(false);
                }}
                className="group flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl
                         bg-gray-50 dark:bg-white/5
                         hover:bg-red-50 dark:hover:bg-red-900/20
                         border border-transparent hover:border-red-100 dark:hover:border-red-900/30
                         transition-all duration-200"
              >
                <span className="material-symbols-rounded text-2xl text-gray-500 group-hover:text-red-500 dark:text-gray-400 dark:group-hover:text-red-400 transition-colors">
                  logout
                </span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-red-600 dark:text-gray-300 dark:group-hover:text-red-400">
                  Logout
                </span>
              </button>
            </div>

            {/* USAGE STATS */}
            <div className="mb-5 bg-gradient-to-br from-gray-50 to-white dark:from-white/5 dark:to-white/10 rounded-xl p-4 border border-border-light dark:border-border-dark shadow-sm relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <span className="material-symbols-rounded text-6xl text-black dark:text-white">bolt</span>
              </div>

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  Daily Credits
                </span>
                <span className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                  {isAdmin ? "∞" : dailyCredits}
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 mb-2 relative z-10">
                <div
                  className={`h-2 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)] ${
                    isAdmin
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500 w-full"
                      : dailyCredits > 10
                        ? "bg-gradient-to-r from-primary to-primary-hover"
                        : dailyCredits > 5
                          ? "bg-gradient-to-r from-amber-400 to-amber-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                  style={{ width: isAdmin ? "100%" : `${Math.min(100, (dailyCredits / 20) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center relative z-10">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  {isAdmin ? "Admin — Unlimited" : "Resets daily at midnight UTC"}
                </p>
                {!isAdmin && (
                  <div
                    onClick={() => { navigate("/pricing"); setProfileOpen(false); }}
                    className="text-[10px] text-primary dark:text-primary font-bold cursor-pointer hover:underline"
                  >
                    Upgrade Plan
                  </div>
                )}
              </div>
            </div>

            {/* MENU ITEMS */}
            <div className="space-y-1">
              {[
                { label: "Billing & Plans", icon: "credit_card", path: "/pricing" },
                { label: "Help Center", icon: "help", path: "/support" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm group
                           hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-[20px] text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors">
                      {item.icon}
                    </span>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium group-hover:text-text-primary-light dark:group-hover:text-text-primary-dark">{item.label}</span>
                  </div>
                  <span className="material-symbols-rounded text-gray-300 text-lg group-hover:text-primary group-hover:translate-x-0.5 transition-all">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )
      }
    </header >
  );
}