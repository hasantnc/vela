import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { onAuthChange } from '@/lib/firebase/auth';
import { getUserDoc } from '@/lib/firebase/firestore';
import { useUserStore } from '@/store/user-store';

export const useAuth = () => {
  const { setUser } = useUserStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthChange(async firebaseUser => {
      if (firebaseUser) {
        const doc = await getUserDoc(firebaseUser.uid);
        setUser(doc);
        const inAuth = segments[0] === '(auth)' || segments[0] === '(onboarding)';
        if (inAuth) router.replace('/(tabs)/(home)');
      } else {
        setUser(null);
        router.replace('/(auth)/login');
      }
    });
    return unsub;
  }, []);
};