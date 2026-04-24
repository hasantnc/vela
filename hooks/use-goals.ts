import { useEffect } from 'react';
import { subscribeGoals } from '@/lib/firebase/firestore';
import { useUserStore } from '@/store/user-store';

export const useGoals = () => {
  const { user, goals, setGoals } = useUserStore();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeGoals(user.uid, setGoals);
    return unsub;
  }, [user?.uid]);

  return { goals };
};