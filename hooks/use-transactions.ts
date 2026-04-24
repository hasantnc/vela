import { useEffect } from 'react';
import { subscribeTransactions } from '@/lib/firebase/firestore';
import { useUserStore } from '@/store/user-store';

export const useTransactions = () => {
  const { user, transactions, setTransactions } = useUserStore();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeTransactions(user.uid, setTransactions);
    return unsub;
  }, [user?.uid]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return { transactions, totalIncome, totalExpense, balance };
};