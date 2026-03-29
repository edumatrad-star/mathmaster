import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, signInWithPopup, googleProvider, signOut, db, doc, getDoc, setDoc, onSnapshot, signInWithEmailAndPassword, createUserWithEmailAndPassword, handleFirestoreError, OperationType } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginAsAdmin: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  profile: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        // Initial fetch to ensure profile exists
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef).catch(err => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`));
          
          if (!userDoc.exists()) {
            const isAdminEmail = currentUser.email?.toLowerCase() === 'edumatrad@gmail.com' || currentUser.email?.toLowerCase() === 'admin@mathmaster.pl';
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || (currentUser.email === 'admin@mathmaster.pl' ? 'Administrator' : 'Użytkownik'),
              photoURL: currentUser.photoURL,
              role: isAdminEmail ? 'admin' : 'user',
              isPremium: isAdminEmail,
              createdAt: new Date().toISOString(),
              streak: 1,
              lastActiveDate: new Date().toISOString().split('T')[0],
              totalPoints: 0,
              totalTimeSpent: 0,
              weakTopics: [],
              notificationFrequency: 'none',
              alertOnMissingLogin: false,
              completedStudyTopics: []
            };
            
            const publicProfile = {
              uid: currentUser.uid,
              displayName: newProfile.displayName,
              photoURL: newProfile.photoURL,
              totalPoints: newProfile.totalPoints,
              streak: newProfile.streak
            };

            await setDoc(userDocRef, newProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
            await setDoc(doc(db, 'public_profiles', currentUser.uid), publicProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `public_profiles/${currentUser.uid}`));
            setProfile(newProfile);
          } else {
            const currentData = userDoc.data();
            setProfile(currentData);
            // Check if admin role needs to be assigned to existing user
            const isAdminEmail = currentUser.email?.toLowerCase() === 'edumatrad@gmail.com' || currentUser.email?.toLowerCase() === 'admin@mathmaster.pl';
            if (isAdminEmail && currentData.role !== 'admin') {
              const updatedData = { ...currentData, role: 'admin', isPremium: true };
              await setDoc(userDocRef, updatedData, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
              setProfile(updatedData);
            }
            
            // Ensure public profile exists and is updated
            const publicProfile = {
              uid: currentUser.uid,
              displayName: currentData.displayName || currentUser.displayName || 'Użytkownik',
              photoURL: currentData.photoURL || currentUser.photoURL || '',
              totalPoints: currentData.totalPoints || 0,
              streak: currentData.streak || 0
            };
            await setDoc(doc(db, 'public_profiles', currentUser.uid), publicProfile, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `public_profiles/${currentUser.uid}`));
          }

          // Set up real-time listener for profile
          unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setProfile(doc.data());
            }
          }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`));
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const loginAsAdmin = async (password: string) => {
    if (password === 'admin') {
      try {
        // Sign in with a dedicated admin account
        await signInWithEmailAndPassword(auth, 'admin@mathmaster.pl', 'admin123');
        return true;
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          try {
            // Create the admin account if it doesn't exist
            await createUserWithEmailAndPassword(auth, 'admin@mathmaster.pl', 'admin123');
            return true;
          } catch (createError) {
            console.error("Failed to create admin account", createError);
            return false;
          }
        }
        console.error("Admin login failed", error);
        return false;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsAdmin, logout, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
