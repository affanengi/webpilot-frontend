import { auth } from "../firebase";

export async function syncUserWithBackend() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("No authenticated Firebase user");
  }

  const token = await currentUser.getIdToken();

  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to sync user with backend");
  }

  return res.json();
}