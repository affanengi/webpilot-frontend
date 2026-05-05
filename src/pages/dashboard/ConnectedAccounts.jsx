

import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ACCOUNT_PROVIDERS = [
  {
    id: "google",
    name: "Google",
    colorIcon: "text-[#4285F4]",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.956 0 8.327-3.453 8.327-8.529a6.437 6.437 0 0 0-.214-1.898z" />
      </svg>
    ),
  },
  {
    id: "gmail",
    name: "Gmail",
    colorIcon: "",
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="size-6 object-contain" />
    ),
  },
  {
    id: "youtube",
    name: "YouTube",
    colorIcon: "text-[#FF0000]",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    colorIcon: "text-[#0077B5]",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  {
    id: "notion",
    name: "Notion",
    colorIcon: "text-black dark:text-white",
    icon: <span className="text-xl font-bold">N</span>,
  },
  {
    id: "google_drive",
    name: "Google Drive",
    colorIcon: "", // Removed standard color string as the image provides color
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="size-6 object-contain" />
    ),
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    colorIcon: "",
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" alt="Google Sheets" className="size-6 object-contain" />
    ),
  },
  {
    id: "instagram",
    name: "Instagram",
    colorIcon: "text-pink-500",
    icon: <span className="material-symbols-rounded">photo_camera</span>,
  },
  {
    id: "google_docs",
    name: "Google Docs",
    colorIcon: "",
    icon: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg" alt="Google Docs" className="size-6 object-contain" />
    ),
  },
  {
    id: "github",
    name: "GitHub",
    colorIcon: "text-black dark:text-white",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    id: "google_forms",
    name: "Google Forms",
    colorIcon: "text-purple-600",
    icon: (
      <span className="material-symbols-rounded text-[24px]">assignment</span>
    ),
  }
];

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [disconnectConfirm, setDisconnectConfirm] = useState(null); // { providerId, providerName }

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "connected_accounts"),
      (snapshot) => {
        const accounts = {};
        snapshot.forEach((doc) => {
          accounts[doc.id] = doc.data();
        });
        setConnectedAccounts(accounts);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleConnect = async (providerId) => {
    if (!user) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const returnUrl = encodeURIComponent(window.location.href);
      const url = `${API_BASE}/auth/${providerId}/login?token=${idToken}&returnUrl=${returnUrl}`;
      window.location.href = url;
    } catch (error) {
      console.error("Error initiating connection:", error);
    }
  };

  const handleDisconnect = async (providerId) => {
    if (!user) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_BASE}/auth/${providerId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${idToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to disconnect: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect account. Please try again.");
    } finally {
      setDisconnectConfirm(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {ACCOUNT_PROVIDERS.map((provider) => {
          const accountData = connectedAccounts[provider.id];
          const isConnected = !!accountData;

          return (
            <AccountCard
              key={provider.id}
              name={provider.name}
              status={isConnected ? "connected" : "disconnected"}
              identifier={isConnected ? (accountData.email || accountData.identifier || "Connected") : "No account connected"}
              colorIcon={provider.colorIcon}
              icon={provider.icon}
              requiresReconnect={isConnected && !!accountData.requiresReconnect}
              onConnect={() => handleConnect(provider.id)}
              onDisconnect={() => setDisconnectConfirm({ providerId: provider.id, providerName: provider.name })}
            />
          );
        })}
      </div>

      {/* -------- Disconnect Confirmation Modal -------- */}
      {disconnectConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setDisconnectConfirm(null)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border-light dark:border-border-dark p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setDisconnectConfirm(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <span className="material-symbols-rounded text-[22px]">close</span>
            </button>

            {/* Warning icon + title */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <span className="material-symbols-rounded text-red-500 text-[30px]">link_off</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  Disconnect {disconnectConfirm.providerName}?
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 max-w-xs mx-auto">
                  Are you sure you want to disconnect your{" "}
                  <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {disconnectConfirm.providerName}
                  </span>{" "}
                  connection? All workflows linked to{" "}
                  <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {disconnectConfirm.providerName}
                  </span>{" "}
                  will stop working until you reconnect.
                </p>
              </div>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
              <span className="material-symbols-rounded text-amber-500 text-[20px] shrink-0 mt-0.5">warning</span>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This action cannot be undone without re-authenticating. Any active automations using this account will be paused immediately.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDisconnectConfirm(null)}
                className="flex-1 h-11 text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDisconnect(disconnectConfirm.providerId)}
                className="flex-1 h-11 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white border-0"
              >
                Yes, Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Reusable Card ---------- */

function AccountCard({ name, status, identifier, icon, colorIcon, onConnect, onDisconnect, requiresReconnect }) {
  const isConnected = status === "connected";

  return (
    <div className="group bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col gap-6 border border-border-light dark:border-border-dark hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center rounded-xl bg-gray-50 dark:bg-black/20 size-12 ${colorIcon} group-hover:scale-105 transition-transform`}
          >
            {icon}
          </div>
          <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">{name}</h2>
        </div>

        <div className="flex items-center gap-2">
          {requiresReconnect ? (
            <>
              <div className="size-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Reconnect Required
              </span>
            </>
          ) : (
            <>
              <div
                className={`size-2.5 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-gray-300 dark:bg-gray-600"
                  }`}
              />
              <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                {isConnected ? "Connected" : "Not Connected"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Reconnect warning banner */}
      {requiresReconnect && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 -mt-2">
          <span className="material-symbols-rounded text-amber-500 text-[18px] shrink-0 mt-0.5">warning</span>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Session expired. Reconnect this account to restore your workflows.
          </p>
        </div>
      )}

      <div className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark truncate px-1">
        {identifier}
      </div>

      {isConnected ? (
        <Button
          variant="ghost"
          onClick={onDisconnect}
          className="mt-auto w-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 text-sm font-semibold h-11 border border-transparent dark:border-red-900/10"
        >
          Disconnect
        </Button>
      ) : (
        <Button onClick={onConnect} className="mt-auto w-full h-11 text-sm font-semibold shadow-sm" variant="primary">
          Connect
        </Button>
      )}
    </div>
  );
}