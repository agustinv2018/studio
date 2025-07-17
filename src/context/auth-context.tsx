"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { TerminalSquare } from "lucide-react";

interface UserData {
  uid: string;
  email: string | null;
  nombre: string;
  rol: 'admin' | 'usuario';
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
            const docRef = doc(db, 'usuarios', firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const userData = docSnap.data();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                rol: userData.rol || 'usuario',
                nombre: userData.nombre || 'Usuario',
              });
            } else {
                console.warn(`No se encontró documento de usuario para UID: ${firebaseUser.uid}. Creando uno...`);
                 // Esto puede pasar si un usuario se crea en la consola de Firebase sin documento en Firestore
                const newUser = {
                    nombre: firebaseUser.displayName || 'Usuario',
                    email: firebaseUser.email,
                    rol: 'usuario',
                }
                await setDoc(doc(db, "usuarios", firebaseUser.uid), newUser);
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    rol: 'usuario',
                    nombre: firebaseUser.displayName || 'Usuario'
                });
            }
        } catch (error) {
            console.error("Error al obtener los datos del usuario:", error);
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
    
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (!user && !isAuthPage) {
      router.push('/login');
    }
    if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        setUser(null);
        router.push('/login');
    } catch (error) {
        console.error("Error al cerrar sesión:", error)
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
            <TerminalSquare className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario y no estamos en una página de autenticación,
  // el efecto anterior se encargará de redirigir, pero podemos mostrar un loader mientras.
  if (!user && pathname !== '/login' && pathname !== '/register') {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="flex flex-col items-center gap-4">
                <TerminalSquare className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Redirigiendo a inicio de sesión...</p>
            </div>
        </div>
      )
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
