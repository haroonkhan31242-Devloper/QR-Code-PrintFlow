import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Shop, NotificationItem, ShopCategory } from '../types';
import { storage, DEMO_USERS } from '../services/storage';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}


interface AppContextType {
  currentUser: User;
  switchUser: (user: User) => void;
  activeRole: 'super_admin' | 'shop_admin' | 'customer';
  setActiveRole: (role: 'super_admin' | 'shop_admin' | 'customer') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  currentShop: Shop | null;
  setCurrentShopId: (shopId: string) => void;
  shops: Shop[];
  reloadShops: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
  selectedShopIdForDetails: string | null;
  setSelectedShopIdForDetails: (id: string | null) => void;
  selectedOrderIdForReview: string | null;
  setSelectedOrderIdForReview: (id: string | null) => void;
  customerShopToken: string;
  setCustomerShopToken: (token: string) => void;
  customerTrackingOrderId: string;
  setCustomerTrackingOrderId: (id: string) => void;
  resetPlatformData: () => void;
  loginShopOwner: (user: User, shop: Shop) => void;
  logoutShopOwner: () => void;
  categories: ShopCategory[];
  reloadCategories: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(() => storage.getCurrentUser());
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => storage.getTheme());
  const [activeRole, setActiveRoleState] = useState<'super_admin' | 'shop_admin' | 'customer'>(
    currentUser.role
  );
  const [shops, setShops] = useState<Shop[]>(() => storage.getShops());
  const [categories, setCategories] = useState<ShopCategory[]>(() => storage.getCategories());
  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/shop/login' || window.location.hash === '#/shop/login') {
        return 'shop_login';
      }
    }
    return 'dashboard';
  });
  const [selectedShopIdForDetails, setSelectedShopIdForDetails] = useState<string | null>(null);
  const [selectedOrderIdForReview, setSelectedOrderIdForReview] = useState<string | null>(null);

  // Customer portal direct context
  const [customerShopToken, setCustomerShopToken] = useState<string>('tok_apex_gulberg_92a');
  const [customerTrackingOrderId, setCustomerTrackingOrderId] = useState<string>('ORD-8941');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Calculate currentShop from currentUser if shop_admin
  const currentShop =
    currentUser.role === 'shop_admin' && currentUser.shopId
      ? shops.find((s) => s.id === currentUser.shopId) || null
      : shops[0] || null;

  // Listen for browser popstate or pathname changes
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/shop/login' || window.location.hash === '#/shop/login') {
        setActiveView('shop_login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const reloadCategories = () => {
    setCategories(storage.getCategories());
  };

  const loginShopOwner = (user: User, shop: Shop) => {
    storage.setCurrentUser(user);
    setCurrentUserState(user);
    setActiveRoleState('shop_admin');
    setActiveView('dashboard');
    setSelectedShopIdForDetails(null);
    setSelectedOrderIdForReview(null);
    addToast('success', `Welcome back, ${user.name}!`, `Logged into ${shop.name} (${shop.id})`);
  };

  const logoutShopOwner = () => {
    const customerUser: User = {
      id: 'USR-CUSTOMER-GUEST',
      name: 'Customer Guest',
      email: 'customer@printflow.io',
      role: 'customer',
    };
    storage.setCurrentUser(customerUser);
    setCurrentUserState(customerUser);
    setActiveRoleState('customer');
    setActiveView('shop_login');
    setSelectedShopIdForDetails(null);
    setSelectedOrderIdForReview(null);
    addToast('info', 'Logged Out', 'You have securely signed out of your shop administrator session.');
  };


  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const reloadShops = () => {
    const list = storage.getShops();
    setShops(list);
  };

  const switchUser = (user: User) => {
    storage.setCurrentUser(user);
    setCurrentUserState(user);
    setActiveRoleState(user.role);
    setActiveView('dashboard');
    setSelectedShopIdForDetails(null);
    setSelectedOrderIdForReview(null);
    addToast('info', `Switched account to ${user.name}`, `Role: ${user.role.replace('_', ' ').toUpperCase()}${user.shopId ? ` (${user.shopId})` : ''}`);
  };

  const setActiveRole = (role: 'super_admin' | 'shop_admin' | 'customer') => {
    setActiveRoleState(role);
    if (role === 'super_admin') {
      const superUser = DEMO_USERS.find((u) => u.role === 'super_admin')!;
      storage.setCurrentUser(superUser);
      setCurrentUserState(superUser);
      setActiveView('dashboard');
    } else if (role === 'shop_admin') {
      // Find shop 1 admin
      const shopAdmin = DEMO_USERS.find((u) => u.role === 'shop_admin')!;
      storage.setCurrentUser(shopAdmin);
      setCurrentUserState(shopAdmin);
      setActiveView('dashboard');
    } else if (role === 'customer') {
      setActiveView('customer_portal');
    }
  };

  const setCurrentShopId = (shopId: string) => {
    const matchedUser = DEMO_USERS.find((u) => u.shopId === shopId);
    if (matchedUser) {
      switchUser(matchedUser);
    } else {
      // User with shopId
      const genericUser: User = {
        id: `USR-${shopId}`,
        name: `Admin (${shopId})`,
        email: `admin.${shopId.toLowerCase()}@printflow.io`,
        role: 'shop_admin',
        shopId,
      };
      switchUser(genericUser);
    }
  };

  // Sync notifications for current role
  useEffect(() => {
    if (activeRole === 'customer') {
      setNotifications([]);
      return;
    }
    const notifs = storage.getNotifications(
      activeRole,
      currentUser.role === 'shop_admin' ? currentUser.shopId : undefined
    );
    setNotifications(notifs);
  }, [activeRole, currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    storage.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    storage.markAllNotificationsRead(
      activeRole === 'super_admin' ? 'super_admin' : 'shop_admin',
      currentUser.shopId
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('success', 'Notifications cleared');
  };

  const resetPlatformData = () => {
    storage.resetAllData();
    reloadShops();
    const defaultUser = DEMO_USERS[1];
    storage.setCurrentUser(defaultUser);
    setCurrentUserState(defaultUser);
    setActiveRoleState(defaultUser.role);
    setActiveView('dashboard');
    addToast('success', 'Demonstration data successfully reset to initial pristine state!');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUser,
        activeRole,
        setActiveRole,
        theme,
        toggleTheme,
        activeView,
        setActiveView,
        currentShop,
        setCurrentShopId,
        shops,
        reloadShops,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        toasts,
        addToast,
        removeToast,
        selectedShopIdForDetails,
        setSelectedShopIdForDetails,
        selectedOrderIdForReview,
        setSelectedOrderIdForReview,
        customerShopToken,
        setCustomerShopToken,
        customerTrackingOrderId,
        setCustomerTrackingOrderId,
        resetPlatformData,
        loginShopOwner,
        logoutShopOwner,
        categories,
        reloadCategories,
      }}
    >

      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
