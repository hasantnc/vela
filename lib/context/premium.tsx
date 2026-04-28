import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/lib/firebase/auth";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";

interface PurchasesPackage {
  identifier: string;
  packageType: string;
  product: {
    priceString: string;
    title: string;
  };
}

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
  packages: PurchasesPackage[];
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  loading: true,
  packages: [],
  purchasePackage: async () => false,
  restorePurchases: async () => false,
});

const ENTITLEMENT_ID = "VELA Pro";

const MOCK_PACKAGES: PurchasesPackage[] = [
  {
    identifier: "vela_premium_monthly",
    packageType: "MONTHLY",
    product: { priceString: "₺149,99", title: "VELA Premium Aylık" },
  },
  {
    identifier: "vela_premium_yearly",
    packageType: "ANNUAL",
    product: { priceString: "₺1.199,99", title: "VELA Premium Yıllık" },
  },
];

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    if (isExpoGo) {
      setPackages(MOCK_PACKAGES);
      setLoading(false);
      return;
    }

    const initRevenueCat = async () => {
      try {
        const Purchases = require("react-native-purchases").default;
        const { LOG_LEVEL } = require("react-native-purchases");

        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        if (Platform.OS === "android") {
          await Purchases.configure({
            apiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID!,
            appUserID: user?.uid,
          });
        } else {
          await Purchases.configure({
            apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS!,
            appUserID: user?.uid,
          });
        }

        const customerInfo = await Purchases.getCustomerInfo();
        setIsPremium(
          typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
        );

        const offerings = await Purchases.getOfferings();
        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        console.log("RevenueCat init error:", e);
      } finally {
        setLoading(false);
      }
    };

    initRevenueCat();
  }, [user]);

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    if (isExpoGo) {
      setIsPremium(true);
      return true;
    }
    try {
      const Purchases = require("react-native-purchases").default;
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      setIsPremium(active);
      return active;
    } catch (e: any) {
      if (!e.userCancelled) console.log("Purchase error:", e);
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (isExpoGo) return false;
    try {
      const Purchases = require("react-native-purchases").default;
      const customerInfo = await Purchases.restorePurchases();
      const active = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      setIsPremium(active);
      return active;
    } catch (e) {
      console.log("Restore error:", e);
      return false;
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, loading, packages, purchasePackage, restorePurchases }}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => useContext(PremiumContext);