"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { getAdminProfile, watchAuthState, type AdminProfile } from "@/lib/services/authService";

type AuthContextValue = {
  firebaseUser: User | null;
  adminProfile: AdminProfile | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  adminProfile: null,
  isLoading: true,
  isSuperAdmin: false,
});

const publicRoutes = ["/login", "/signup"];

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setAdminProfile(null);
        setIsLoading(false);
        if (!isPublicRoute) router.replace("/login");
        return;
      }

      const profile = await getAdminProfile(user.uid);
      setAdminProfile(profile);
      setIsLoading(false);

      if (!profile && !isPublicRoute) {
        router.replace("/login");
        return;
      }

      if (isPublicRoute && profile) router.replace("/");
    });

    return () => unsubscribe();
  }, [isPublicRoute, router]);

  const value = useMemo(
    () => ({
      firebaseUser,
      adminProfile,
      isLoading,
      isSuperAdmin: adminProfile?.role === "super_admin",
    }),
    [adminProfile, firebaseUser, isLoading]
  );

  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 text-sm font-semibold text-gray-600 shadow-sm">
          Loading CityVoice admin...
        </div>
      </div>
    );
  }

  if (!isPublicRoute && (!firebaseUser || !adminProfile)) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
