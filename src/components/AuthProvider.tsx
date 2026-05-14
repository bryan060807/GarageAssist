import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAppStore, UserProfile } from '../store/useAppStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setAuthLoading } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const profile = userSnap.data() as UserProfile;
          setProfile(profile);
        } else {
          // Create new user profile
          const isAdminEmail = firebaseUser.email === 'bryan060807@gmail.com';
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'New Mechanic',
            role: isAdminEmail ? 'manager' : 'mechanic',
            createdAt: Date.now()
          };
          
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }

        // Listen for profile changes (real-time role updates)
        const unsubProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        });

        setAuthLoading(false);
        return () => unsubProfile();
      } else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setAuthLoading]);

  return <>{children}</>;
}
