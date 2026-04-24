import { create } from 'zustand';
import { User, Transaction, Goal, Subscription } from '@/types';

interface UserStore {
  user: User | null;
  transactions: Transaction[];
  goals: Goal[];
  subscriptions: Subscription[];
  setUser: (user: User | null) => void;
  setTransactions: (txs: Transaction[]) => void;
  setGoals: (goals: Goal[]) => void;
  setSubscriptions: (subs: Subscription[]) => void;
}

export const useUserStore = create<UserStore>(set => ({
  user: null,
  transactions: [],
  goals: [],
  subscriptions: [],
  setUser: user => set({ user }),
  setTransactions: transactions => set({ transactions }),
  setGoals: goals => set({ goals }),
  setSubscriptions: subscriptions => set({ subscriptions }),
}));