import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth";

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
}

const PremiumContext = createContext<PremiumContextValue>({ isPremium: false, loading: true });

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const status = snap.data()?.subscriptionStatus;
      // Test için: "pro" veya "test" değeri premium sayılır
      setIsPremium(status === "pro" || status === "test");
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return (
    <PremiumContext.Provider value={{ isPremium, loading }}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => useContext(PremiumContext);
