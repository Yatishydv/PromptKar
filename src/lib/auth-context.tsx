"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  EmailAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  linkWithCredential,
  updateProfile,
  getAdditionalUserInfo
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
  resetPassword: (email: string) => Promise<void>;
  setPasswordForGoogleUser: (newPassword: string) => Promise<void>;
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
  resetPassword: async () => {},
  setPasswordForGoogleUser: async () => {},
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
      const result = await signInWithPopup(auth, provider);
      toast.success("Signed in successfully!");
      
      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser && result.user.email) {
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.promptkar.site';
          await sendPasswordResetEmail(auth, result.user.email, {
            url: `${baseUrl}/login`,
            handleCodeInApp: false,
          });
          toast.success("Welcome! We've sent a password setup email to your inbox so you can also log in with email/password.");
        } catch (emailErr) {
          console.error("Failed to send welcome password setup email:", emailErr);
        }
      }
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
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error("Wrong password. If you signed up with Google, use Google Sign-In or reset your password.");
      } else if (error.code === 'auth/user-not-found') {
        toast.error("No account found with this email. Please register first.");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many attempts. Please try again later or reset your password.");
      } else {
        toast.error(error.message || "Invalid email or password.");
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.promptkar.site';
      await sendPasswordResetEmail(auth, email, {
        url: `${baseUrl}/login`,
        handleCodeInApp: false,
      });
      toast.success("Password reset email sent! Check your inbox (and spam folder).");
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      toast.error(error.message || "Failed to send reset email.");
      throw error;
    }
  };

  const setPasswordForGoogleUser = async (newPassword: string) => {
    if (!user || !user.email) {
      toast.error("You must be logged in to set a password.");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, newPassword);
      await linkWithCredential(user, credential);
      toast.success("Password set! You can now log in with email + password too.");
    } catch (error: any) {
      if (error.code === 'auth/provider-already-linked') {
        toast.error("Email/password login is already enabled. Use 'Forgot Password' on the login page to reset it.");
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error("For security, please sign out and sign back in with Google first, then try again.");
      } else {
        toast.error(error.message || "Failed to set password.");
      }
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
      resetPassword,
      setPasswordForGoogleUser,
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
