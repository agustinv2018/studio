"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { TerminalSquare } from "lucide-react";

interface UserData {
  uid: string;
  email: string;
  nombre: string;
  rol: "admin" | "usuario";
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const ref = doc(db, "usuarios", firebaseUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              nombre: data.nombre || "Usuario",
              rol: data.rol || "usuario",
            });
          } else {
            // This case handles users created via social providers or directly in the console
            // without a corresponding Firestore document.
            const newUser = {
              nombre: firebaseUser.displayName || "Usuario",
              email: firebaseUser.email || "",
              rol: "usuario",
            };
            await setDoc(ref, newUser);
            setUser({
              uid: firebaseUser.uid,
              ...newUser
            });
          }
        } catch (error) {
          console.error("Error getting user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const isAuthPage = pathname === "/login" || pathname === "/register";
    if (!user && !isAuthPage) {
        router.push("/login");
    }
    if (user && isAuthPage) {
        router.push("/");
    }
  }, [user, loading, pathname, router]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
            <TerminalSquare className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // Prevents flicker of content before redirect
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (!user && !isAuthPage) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex items-center gap-2">
                <TerminalSquare className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Redirigiendo a inicio de sesión...</p>
            </div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if(context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
