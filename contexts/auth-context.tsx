"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  clearCookie,
  DASHBOARD_PATH_COOKIE,
  NEWS_SLUG_COOKIE,
  SITE_VIEW_COOKIE,
} from "@/lib/masked-routing";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  enrolledCourses: string[];
  completedCourses: string[];
  streak: number;
  points: number;
  lastActivityDate?: string;
  courseProgress?: Record<string, number>;
  role: "student" | "tutor" | "admin";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authReady: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresEmailVerification?: boolean;
  }>;
  oauthLogin: (
    provider: "google" | "github",
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  enrollCourse: (courseId: string) => Promise<void>;
  completeCourse: (courseId: string) => Promise<void>;
  updateCourseProgress: (courseId: string, progress: number) => void;
  refreshUser: (options?: { retries?: number }) => Promise<void>;
}
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Turn low-level network/config failures into a clear, actionable message.
const describeAuthError = (err: unknown, fallback: string): string => {
  const message = err instanceof Error ? err.message : String(err ?? "");
  if (/fetch failed|failed to fetch|networkerror|ENOTFOUND|getaddrinfo/i.test(message)) {
    return "Can't reach the authentication server. Check your internet connection, and make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local point to a valid Supabase project.";
  }
  return fallback;
};

const fetchUserProfileWithRetry = async (userId: string, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (data && !error) return data;

    // Do not delay after the final attempt.
    if (i < retries) {
      await sleep(300 * (i + 1));
    }
  }

  return null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to build user object from profile
const buildUserFromProfile = (profile: any): User => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
  avatar: profile.avatar || "",
  createdAt: profile.created_at,
  enrolledCourses: profile.enrolled_courses || [],
  completedCourses: profile.completed_courses || [],
  streak: profile.streak ?? 0,
  points: profile.points ?? 0,
  lastActivityDate: profile.last_activity_date,
  courseProgress: profile.course_progress || {},
  role: profile.role === "agent" ? "admin" : (profile.role || "student"),
});

const withAuthEmail = (userData: User, authEmail?: string | null): User => {
  if (String(userData.email || "").trim()) return userData
  const email = String(authEmail || "").trim()
  return email ? { ...userData, email } : userData
}

const buildFallbackUser = (authUser: any): User => ({
  id: authUser.id,
  name:
    authUser.user_metadata?.name ||
    (authUser.email ? String(authUser.email).split("@")[0] : "User"),
  email: authUser.email || "",
  avatar: authUser.user_metadata?.avatar_url || "",
  createdAt: authUser.created_at || new Date().toISOString(),
  enrolledCourses: [],
  completedCourses: [],
  streak: 0,
  points: 0,
  lastActivityDate: undefined,
  courseProgress: {},
  role: "student",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();

  // Load user from localStorage on mount (instant, no flicker)
  useEffect(() => {
    const storedUser = localStorage.getItem("nexus_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("nexus_user");
      }
    }
    setIsLoading(false);
    setAuthReady(true);
  }, []);

  // Single auth check on mount + session listener for real-time sync
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;

        const authUser = data?.user;
        if (!authUser) {
          setUser(null);
          localStorage.removeItem("nexus_user");
          setIsLoading(false);
          return;
        }

        const profile = await fetchUserProfileWithRetry(authUser.id);
        if (!isMounted) return;

        if (profile) {
          const userData = withAuthEmail(buildUserFromProfile(profile), authUser.email);
          setUser(userData);
          localStorage.setItem("nexus_user", JSON.stringify(userData));
        } else {
          const fallbackUser = buildFallbackUser(authUser);
          setUser(fallbackUser);
          localStorage.setItem("nexus_user", JSON.stringify(fallbackUser));
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsLoading(false);
        setAuthReady(true); // ✅ ADD THIS
      }
    };

    checkAuth();

    // Listen for auth state changes (session restore, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        localStorage.removeItem("nexus_user");
        setIsLoading(false);
        setAuthReady(true);
        return;
      }

      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        const profile = await fetchUserProfileWithRetry(session.user.id);
        if (isMounted && profile) {
          const userData = withAuthEmail(buildUserFromProfile(profile), session.user.email);
          setUser(userData);
          localStorage.setItem("nexus_user", JSON.stringify(userData));
        } else if (isMounted && session.user) {
          const fallbackUser = buildFallbackUser(session.user);
          setUser(fallbackUser);
          localStorage.setItem("nexus_user", JSON.stringify(fallbackUser));
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (!data?.user) {
        setIsLoading(false);
        return { success: false, error: "No user returned" };
      }

      // Fetch profile and set user immediately.
      // If the users row is missing (trigger delay/misconfiguration), fall back to auth user
      // so route guards don't bounce a valid session back to /login.
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile) {
        const userData = withAuthEmail(buildUserFromProfile(profile), data.user.email);
        setUser(userData);
        localStorage.setItem("nexus_user", JSON.stringify(userData));
      } else {
        const fallbackUser = buildFallbackUser(data.user);
        setUser(fallbackUser);
        localStorage.setItem("nexus_user", JSON.stringify(fallbackUser));
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: describeAuthError(err, "Login failed") };
    }
  };

  const oauthLogin = async (
    provider: "google" | "github",
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window === "undefined") {
        return {
          success: false,
          error: "OAuth login must be run in the browser",
        };
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("OAuth login failed:", error);
        return { success: false, error: error.message };
      }

      if (data?.url) {
        window.location.assign(data.url);
        return { success: true };
      }

      return { success: true };
    } catch (error) {
      console.error("OAuth login error:", error);
      return { success: false, error: "OAuth login failed" };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        setIsLoading(false);
        return {
          success: false,
          error: "An account with this email already exists. Please sign in instead.",
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        setIsLoading(false);
        const message = error.message || "Signup failed";
        const duplicate =
          /already registered|already exists|duplicate/i.test(message);
        return {
          success: false,
          error: duplicate
            ? "An account with this email already exists. Please sign in instead."
            : message,
        };
      }

      if (data?.user && data.session) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile) {
          const userData = buildUserFromProfile(profile);
          setUser(userData);
          // Save to localStorage for instant access
          localStorage.setItem("nexus_user", JSON.stringify(userData));
        } else {
          const fallbackUser = buildFallbackUser(data.user);
          setUser(fallbackUser);
          localStorage.setItem("nexus_user", JSON.stringify(fallbackUser));
        }
      }

      setIsLoading(false);
      if (!data?.session) {
        return {
          success: true,
          requiresEmailVerification: true,
        };
      }
      return { success: true, requiresEmailVerification: false };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: describeAuthError(err, "Signup failed") };
    }
  };

  const logout = async () => {
    // Optimistic — clear UI immediately (no full-page loading spinner)
    setUser(null);
    localStorage.removeItem("nexus_user");
    clearCookie(SITE_VIEW_COOKIE);
    clearCookie(DASHBOARD_PATH_COOKIE);
    clearCookie(NEWS_SLUG_COOKIE);

    // Clear session cookies in parallel; don't block navigation on network calls
    void supabase.auth.signOut();
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch((err) => console.error("Server logout failed:", err));

    if (typeof window !== "undefined") {
      window.location.assign("/");
      return;
    }
    router.push("/");
  };

  const refreshUser = useCallback(async (options?: { retries?: number }) => {
    const { data } = await supabase.auth.getUser();
    const authUser = data?.user;
    if (!authUser) return;
    const profile = await fetchUserProfileWithRetry(authUser.id, options?.retries ?? 2);
    if (profile) {
      const userData = buildUserFromProfile(profile);
      setUser(userData);
      localStorage.setItem("nexus_user", JSON.stringify(userData));
    }
  }, []);

  const enrollCourse = async (courseId: string) => {
    if (!user) return;

    try {
      const res = await fetch("/api/enrollments/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId }),
      });

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Payment required for this course");
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Enrollment failed");
      }

      await refreshUser();
    } catch (error) {
      console.error("Failed to save enrollment:", error);
      throw error;
    }
  };

  const completeCourse = async (courseId: string) => {
    if (!user) return;

    const today = new Date().toDateString();
    const lastActivityDate = user.lastActivityDate
      ? new Date(user.lastActivityDate).toDateString()
      : null;

    let newStreak = user.streak;
    if (lastActivityDate !== today) {
      if (lastActivityDate) {
        const lastDate = new Date(user.lastActivityDate!);
        const currentDate = new Date();
        const diffDays = Math.floor(
          (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        newStreak =
          diffDays === 1 ? user.streak + 1 : diffDays === 0 ? user.streak : 1;
      } else {
        newStreak = 1;
      }
    }

    const completedCourses = user.completedCourses.includes(courseId)
      ? user.completedCourses
      : [...user.completedCourses, courseId];

    const courseProgress = { ...(user.courseProgress || {}), [courseId]: 100 };
    const points = (completedCourses.length * 100) + (newStreak * 10);

    const updatedUser = {
      ...user,
      completedCourses,
      courseProgress,
      streak: newStreak,
      lastActivityDate: new Date().toISOString(),
    };

    setUser(updatedUser);
    localStorage.setItem("nexus_user", JSON.stringify(updatedUser));

    try {
      await supabase
        .from("users")
        .update({
          completed_courses: completedCourses,
          course_progress: courseProgress,
          streak: newStreak,
          points,
          last_activity_date: updatedUser.lastActivityDate,
        })
        .eq("id", user.id);

      await supabase
        .from("enrollments")
        .update({ status: "completed", progress: 100, completed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("course_id", courseId);

      // Issue a certificate (server-side, idempotent)
      await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
    } catch (error) {
      console.error("Failed to persist course completion:", error);
    }
  };

  const updateCourseProgress = useCallback(
    (courseId: string, progress: number) => {
      let didChange = false;
      let snapshot: User | null = null;

      setUser((prevUser) => {
        if (!prevUser) return prevUser;

        const normalizedProgress = Math.min(Math.max(progress, 0), 100);
        const currentProgress = prevUser.courseProgress?.[courseId] ?? 0;
        if (currentProgress === normalizedProgress) {
          return prevUser;
        }

        const courseProgress = {
          ...(prevUser.courseProgress || {}),
          [courseId]: normalizedProgress,
        };

        const updatedUser = { ...prevUser, courseProgress };
        localStorage.setItem("nexus_user", JSON.stringify(updatedUser));
        didChange = true;
        snapshot = updatedUser;
        return updatedUser;
      });

      if (didChange && snapshot) {
        const u = snapshot as User;
        const normalizedProgress = Math.min(Math.max(progress, 0), 100);
        void supabase
          .from("users")
          .update({ course_progress: u.courseProgress })
          .eq("id", u.id)
          .then(() => {
            void supabase
              .from("enrollments")
              .update({ progress: normalizedProgress })
              .eq("user_id", u.id)
              .eq("course_id", courseId);
          });
      }
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup, // ✅ FIXED (was signUp mismatch risk)
        oauthLogin,
        logout,
        isAuthenticated: !!user,
        enrollCourse,
        completeCourse,
        updateCourseProgress,
        refreshUser,
        authReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
