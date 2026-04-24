import {
  doc, setDoc, getDoc, updateDoc,
  collection, addDoc, query, where,
  orderBy, onSnapshot, deleteDoc,
  serverTimestamp, Timestamp, arrayUnion,
} from 'firebase/firestore';
import { db } from './config';
import { Transaction, Goal, Subscription, User } from '@/types';

// ── USER ────────────────────────────────────────────────
export const createUserDoc = async (uid: string, data: Partial<User>) => {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    subscriptionStatus: 'free',
    currency: 'TRY',
    createdAt: serverTimestamp(),
  });
};

export const getUserDoc = async (uid: string) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
};

export const updateUserDoc = async (uid: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), data);
};

// ── TRANSACTIONS ─────────────────────────────────────────
export const addTransaction = async (uid: string, tx: Omit<Transaction, 'id'>) => {
  const ref = collection(db, 'users', uid, 'transactions');
  await addDoc(ref, { ...tx, createdAt: serverTimestamp() });
};

export const deleteTransaction = async (uid: string, txId: string) => {
  await deleteDoc(doc(db, 'users', uid, 'transactions', txId));
};

export const updateTransaction = async (
  uid: string,
  txId: string,
  data: Partial<{ label: string; amount: number; category: string; type: string }>
) => {
  await updateDoc(doc(db, 'users', uid, 'transactions', txId), data);
};

export const subscribeTransactions = (
  uid: string,
  cb: (txs: Transaction[]) => void
) => {
  const q = query(
    collection(db, 'users', uid, 'transactions'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    cb(txs);
  });
};

// ── GOALS ────────────────────────────────────────────────
export const addGoal = async (uid: string, goal: Omit<Goal, 'id'>) => {
  const ref = collection(db, 'users', uid, 'goals');
  await addDoc(ref, { ...goal, createdAt: serverTimestamp() });
};

export const updateGoal = async (uid: string, goalId: string, data: Partial<Goal>) => {
  await updateDoc(doc(db, 'users', uid, 'goals', goalId), data);
};

export const subscribeGoals = (uid: string, cb: (goals: Goal[]) => void) => {
  const q = query(collection(db, 'users', uid, 'goals'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
  });
};

// ── SUBSCRIPTIONS ────────────────────────────────────────
export const addSubscription = async (uid: string, sub: Omit<Subscription, 'id'>) => {
  const ref = collection(db, 'users', uid, 'subscriptions');
  await addDoc(ref, { ...sub, createdAt: serverTimestamp() });
};

export const updateSubscription = async (
  uid: string, subId: string, data: Partial<Subscription>
) => {
  await updateDoc(doc(db, 'users', uid, 'subscriptions', subId), data);
};

export const subscribeSubscriptions = (
  uid: string,
  cb: (subs: Subscription[]) => void
) => {
  const q = query(collection(db, 'users', uid, 'subscriptions'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscription)));
  });
};

// ── DAILY LIMIT ──────────────────────────────────────────
export async function setDailyLimit(uid: string, limit: number) {
  await setDoc(doc(db, 'users', uid), { dailyLimit: limit }, { merge: true });
}

export async function getDailyLimit(uid: string): Promise<number> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.data()?.dailyLimit ?? 1200;
}

// ── STREAK ───────────────────────────────────────────────
export interface StreakData {
  current: number;
  best: number;
  done: boolean[]; // 7 elemanlı, pazartesi=0
  lastCheckedDate?: string; // YYYY-MM-DD
}

export async function getStreak(uid: string): Promise<StreakData> {
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data();
  return {
    current: data?.streakCurrent ?? 0,
    best: data?.streakBest ?? 0,
    done: data?.streakDone ?? [false, false, false, false, false, false, false],
    lastCheckedDate: data?.streakLastChecked ?? null,
  };
}

export async function updateStreak(uid: string, streak: StreakData) {
  await setDoc(doc(db, 'users', uid), {
    streakCurrent: streak.current,
    streakBest: streak.best,
    streakDone: streak.done,
    streakLastChecked: streak.lastCheckedDate,
  }, { merge: true });
}

export function subscribeStreak(uid: string, cb: (s: StreakData) => void) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    const data = snap.data();
    cb({
      current: data?.streakCurrent ?? 0,
      best: data?.streakBest ?? 0,
      done: data?.streakDone ?? [false, false, false, false, false, false, false],
      lastCheckedDate: data?.streakLastChecked ?? null,
    });
  });
}

// ── BADGES & XP ──────────────────────────────────────────
export interface BadgeData {
  earnedIds: string[];
  xp: number;
}

export async function getBadges(uid: string): Promise<BadgeData> {
  const snap = await getDoc(doc(db, 'users', uid));
  const data = snap.data();
  return {
    earnedIds: data?.earnedBadges ?? [],
    xp: data?.xp ?? 0,
  };
}

export async function earnBadge(uid: string, badgeId: string, xpReward = 25) {
  await setDoc(doc(db, 'users', uid), {
    earnedBadges: arrayUnion(badgeId),
    xp: (await getBadges(uid)).xp + xpReward,
  }, { merge: true });
}

export async function addXP(uid: string, amount: number) {
  const current = (await getBadges(uid)).xp;
  await setDoc(doc(db, 'users', uid), { xp: current + amount }, { merge: true });
}

export function subscribeBadges(uid: string, cb: (b: BadgeData) => void) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    const data = snap.data();
    cb({
      earnedIds: data?.earnedBadges ?? [],
      xp: data?.xp ?? 0,
    });
  });
}

// ── REGRET ───────────────────────────────────────────────
export async function setRegretScore(uid: string, txId: string, score: number) {
  await updateDoc(doc(db, 'users', uid, 'transactions', txId), {
    regretScore: score,
  });
}

export function subscribeRegretTransactions(
  uid: string,
  cb: (txs: Transaction[]) => void
) {
  // Son 30 günün expense işlemleri
  const q = query(
    collection(db, 'users', uid, 'transactions'),
    where('type', '==', 'expense'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
  });
}
export async function checkAndUpdateStreak(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.data();

  const today = new Date().toISOString().split("T")[0];
  if (data?.streakLastChecked === today) return;

  const current: number = data?.streakCurrent ?? 0;
  const best: number = data?.streakBest ?? 0;
  const done: boolean[] = data?.streakDone ?? [false,false,false,false,false,false,false];

  const dayIdx = (new Date().getDay() + 6) % 7;
  const newDone = [...done];
  newDone[dayIdx] = true;

  const newCurrent = current + 1;
  const newBest = Math.max(best, newCurrent);

  await setDoc(doc(db, "users", uid), {
    streakCurrent: newCurrent,
    streakBest: newBest,
    streakDone: newDone,
    streakLastChecked: today,
  }, { merge: true });
}
// ── CATEGORY LIMITS ──────────────────────────────────────────────────────────

export async function setCategoryLimits(uid: string, limits: Record<string, number>) {
  await setDoc(doc(db, 'users', uid), { categoryLimits: limits }, { merge: true });
}

export async function getCategoryLimits(uid: string): Promise<Record<string, number>> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.data()?.categoryLimits ?? {};
}

export function subscribeCategoryLimits(
  uid: string,
  cb: (limits: Record<string, number>) => void
) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    cb(snap.data()?.categoryLimits ?? {});
  });
}

// ── PAYDAY — firestore.ts dosyasının sonuna ekle ─────────────────────────────

export function subscribePayday(uid: string, cb: (daysLeft: number) => void) {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    const paydayData = snap.data()?.payday;
    const dayOfMonth: number = paydayData?.paydayDay ?? 15;
    const today = new Date();
    const next = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    if (next <= today) next.setMonth(next.getMonth() + 1);
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    cb(diff);
  });
}