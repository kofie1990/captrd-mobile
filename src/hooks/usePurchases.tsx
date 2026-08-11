import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { isClip } from 'react-native-app-clip';

let Purchases: any = null;
if (!isClip()) {
  Purchases = require('react-native-purchases').default;
}
import { useAuth } from './useAuth';

// Use API keys from .env
const APIKeys = {
  apple: process.env.EXPO_PUBLIC_RC_APPLE_API_KEY || "",
  google: process.env.EXPO_PUBLIC_RC_GOOGLE_API_KEY || "",
};

interface PurchasesContextType {
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isReady: boolean;
}

const PurchasesContext = createContext<PurchasesContextType>({
  customerInfo: null,
  currentOffering: null,
  isReady: false,
});

export const PurchasesProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initPurchases = async () => {
      if (isClip()) {
        setIsReady(true);
        return;
      }
      try {
        if (Platform.OS === 'ios' && APIKeys.apple) {
          Purchases.configure({ apiKey: APIKeys.apple, appUserID: session?.user?.id });
        } else if (Platform.OS === 'android' && APIKeys.google) {
          Purchases.configure({ apiKey: APIKeys.google, appUserID: session?.user?.id });
        } else {
          console.warn("No RevenueCat API key provided for this platform, skipping configuration.");
        }

        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setCurrentOffering(offerings.current);
        }

        Purchases.addCustomerInfoUpdateListener((info) => {
          setCustomerInfo(info);
        });
      } catch (error) {
        console.error("Error initializing RevenueCat:", error);
      } finally {
        setIsReady(true);
      }
    };

    initPurchases();
  }, [session?.user?.id]);

  return (
    <PurchasesContext.Provider value={{ customerInfo, currentOffering, isReady }}>
      {children}
    </PurchasesContext.Provider>
  );
};

export const usePurchases = () => {
  return useContext(PurchasesContext);
};
