import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { useAuth } from './useAuth';

// Use placeholders for API keys until they are added to .env
const APIKeys = {
  apple: process.env.EXPO_PUBLIC_RC_APPLE_API_KEY || "appl_placeholder",
  google: process.env.EXPO_PUBLIC_RC_GOOGLE_API_KEY || "goog_placeholder",
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
      try {
        if (Platform.OS === 'ios') {
          Purchases.configure({ apiKey: APIKeys.apple, appUserID: session?.user?.id });
        } else if (Platform.OS === 'android') {
          Purchases.configure({ apiKey: APIKeys.google, appUserID: session?.user?.id });
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
