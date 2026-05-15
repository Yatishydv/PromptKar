"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebase";
import { toast } from "react-hot-toast";

import { MilestoneModal } from "@/components/modals/MilestoneModal";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, username: string, avatar: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  registerWithEmail: async () => {},
  loginWithEmail: async () => {},
  logout: async () => {},
  refreshUserData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockedMilestone, setUnlockedMilestone] = useState<number | null>(null);

  const fetchUserData = async (uid: string) => {
    try {
      const res = await fetch(`/api/users/${uid}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      }
    } catch (err) {
      console.error("Error fetching user data from MongoDB:", err);
    }
  };

  const refreshUserData = async () => {
    if (user) await fetchUserData(user.uid);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          // Sync/Create in MongoDB
          const syncIdentity = async () => {
            try {
              const isAdminUser = firebaseUser.email === "yatishydv@gmail.com";
              
              // 1. Check existing
              const checkRes = await fetch(`/api/users/${firebaseUser.uid}`, { cache: 'no-store' });
              let existingMongoData = null;
              if (checkRes.ok) {
                existingMongoData = await checkRes.json();
              }

              const isNewUser = !existingMongoData || !existingMongoData.firebaseUid;

              const payload: any = {
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
              };

              if (isNewUser) {
                payload.name = firebaseUser.displayName || "User";
                payload.username = (firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '_') || firebaseUser.email?.split('@')[0].toLowerCase() || "user");
                if (firebaseUser.photoURL) payload.avatar = firebaseUser.photoURL;
              }

              // Only force username for admin, not the display name
              if (isAdminUser) {
                payload.username = "yatishydv";
                payload.isAdmin = true;
              }

              await fetch(`/api/users/${firebaseUser.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              await fetchUserData(firebaseUser.uid);
            } catch (err) {
              console.error("MongoDB Identity Sync Error:", err);
            }
          };

          await syncIdentity();
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error("Auth State Changed Error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error("Google Sign-in Error:", error);
      toast.error(error.message || "Failed to sign in. Check if pop-ups are blocked.");
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, username: string, avatar: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { 
        displayName: name,
        photoURL: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366F1&color=fff`
      });
      toast.success("Account created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out.");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const isAdmin = user?.email === "yatishydv@gmail.com" || userData?.isAdmin === true;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData,
      loading, 
      isAdmin,
      signInWithGoogle, 
      registerWithEmail, 
      loginWithEmail, 
      logout,
      refreshUserData
    }}>
      {children}
      <MilestoneModal 
        isOpen={unlockedMilestone !== null} 
        streak={unlockedMilestone || 0} 
        onClose={() => setUnlockedMilestone(null)} 
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
