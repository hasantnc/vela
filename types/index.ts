export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  label: string;
  emoji: string;
  date: string;
  category: string;
  time: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  sub: SubCategory[];
}

export interface SubCategory {
  id: string;
  label: string;
  emoji: string;
  details: string[];
}

export interface Goal {
  id: string;
  emoji: string;
  label: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
}

export interface Subscription {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  used: boolean;
  lastUsed: string;
  color: string;
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  earned: boolean;
  date: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  characterType?: 'impulsive' | 'planner' | 'social' | 'saver';
  subscriptionStatus?: 'free' | 'pro';
  currency?: 'TRY' | 'USD';
}
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  label: string;
  emoji: string;
  date: string;
  category: string;
  time: string;
  description?: string;           // ekle
  createdAt?: {                   // ekle
    toDate: () => Date;
  } | Date;
}