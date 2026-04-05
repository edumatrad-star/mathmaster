import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, signInWithPopup, googleProvider, signOut, db, doc, getDoc, setDoc, onSnapshot, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, handleFirestoreError, OperationType, writeBatch, arrayUnion } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, username: string, selectedLevels: string[]) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  suggestUsernames: (baseUsername: string) => Promise<string[]>;
  addChild: (studentName: string, studentUsername: string, studentEmail: string, studentPassword?: string) => Promise<void>;
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

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) return false;
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      return !usernameDoc.exists();
    } catch (err) {
      console.error("Error checking username availability:", err);
      // If we can't check, we assume it's not available to be safe, 
      // or we could throw and let the UI handle it.
      // Let's throw a simpler error so it's caught by the UI.
      throw err;
    }
  };

  const suggestUsernames = async (baseUsername: string) => {
    const suggestions: string[] = [];
    let attempts = 0;
    while (suggestions.length < 3 && attempts < 10) {
      const suggestion = `${baseUsername}${Math.floor(Math.random() * 900) + 100}`;
      const isAvailable = await checkUsernameAvailability(suggestion);
      if (isAvailable && !suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
      attempts++;
    }
    return suggestions;
  };

  const loginWithEmail = async (identifier: string, password: string) => {
    try {
      let emailToUse = identifier;

      // Check if identifier is not an email (doesn't contain @)
      if (!identifier.includes('@')) {
        // Look up the username in the usernames collection
        const usernameDoc = await getDoc(doc(db, 'usernames', identifier.toLowerCase()));
        if (usernameDoc.exists()) {
          const uid = usernameDoc.data().uid;
          // Get the user document to find the email
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists() && userDoc.data().email) {
            emailToUse = userDoc.data().email;
          } else {
            throw new Error("Nie znaleziono adresu email dla tej nazwy użytkownika.");
          }
        } else {
          throw new Error("Nie znaleziono użytkownika o takiej nazwie.");
        }
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (error: any) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string, username: string, selectedLevels: string[]) => {
    try {
      // Check username availability one last time
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        throw new Error("Nazwa użytkownika jest już zajęta.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      // Update Firebase Auth profile first so onAuthStateChanged can see the name
      await updateProfile(currentUser, { displayName });
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const usernameDocRef = doc(db, 'usernames', username.toLowerCase());
      
      const newProfile = {
        uid: currentUser.uid,
        username: username.toLowerCase(),
        email: currentUser.email,
        displayName: displayName || 'Użytkownik',
        photoURL: '',
        role: 'parent', // Default role for new users
        selectedLevels: selectedLevels,
        childrenUids: [],
        isPremium: false,
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

      // Atomic operations using batch
      const batch = writeBatch(db);
      batch.set(usernameDocRef, { uid: currentUser.uid });
      batch.set(userDocRef, newProfile);
      batch.set(doc(db, 'public_profiles', currentUser.uid), publicProfile);
      
      await batch.commit().catch(err => handleFirestoreError(err, OperationType.WRITE, `register/${currentUser.uid}`));
      setProfile(newProfile);
    } catch (error: any) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const addChild = async (studentName: string, studentUsername: string, studentEmail: string, studentPassword?: string) => {
    if (!user || !profile || profile.role !== 'parent') {
      throw new Error("Tylko rodzic może dodać konto ucznia.");
    }

    try {
      // Check username availability
      const isAvailable = await checkUsernameAvailability(studentUsername);
      if (!isAvailable) {
        throw new Error("Nazwa użytkownika dla ucznia jest już zajęta.");
      }

      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/parent/add-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          displayName: studentName,
          username: studentUsername,
          email: studentEmail,
          password: studentPassword || 'MathMaster123!' // Default password if not provided
        })
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Wystąpił błąd podczas dodawania ucznia.');
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON response from add-child:", text);
        throw new Error(`Błąd serwera (${response.status}): Otrzymano nieprawidłowy format odpowiedzi.`);
      }
      
    } catch (error: any) {
      console.error("Failed to add child", error);
      throw error;
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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithEmail, 
      register, 
      checkUsernameAvailability,
      suggestUsernames,
      addChild,
      loginAsAdmin, 
      logout, 
      profile 
    }}>
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
