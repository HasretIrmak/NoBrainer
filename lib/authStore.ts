"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthAccount, AuthRole, SellerAccount, SellerStore, UserAccount, UserProfile } from "./types";
import { DEFAULT_PROFILE } from "./personalization";

const AUTH_KEY = "nobrainer-auth-v1";
const AUTH_EVENT = "nobrainer-auth-changed";

type AuthState = {
  accounts: AuthAccount[];
  activeAccountId: string | null;
  activeRole: AuthRole | null;
  darkMode: boolean;
};

const defaultSellerStores = [
  {
    id: "store_sneaker_plus",
    seller_id: "seller_demo",
    name: "Sneaker Plus",
    category: "Spor Ayakkabı",
    shipping_fee: 49,
    marketplace_fee_rate: 0.12,
    fixed_expense: 3500,
  },
  {
    id: "store_daily_step",
    seller_id: "seller_demo",
    name: "Daily Step",
    category: "Günlük Ayakkabı",
    shipping_fee: 39,
    marketplace_fee_rate: 0.1,
    fixed_expense: 2200,
  },
  {
    id: "store_classic_line",
    seller_id: "seller_demo",
    name: "Classic Line",
    category: "Klasik Ayakkabı",
    shipping_fee: 59,
    marketplace_fee_rate: 0.14,
    fixed_expense: 2800,
  },
];

const demoUser: UserAccount = {
  id: "user_demo",
  username: "kullanici",
  password: "123456",
  role: "user",
  profile: {
    ...DEFAULT_PROFILE,
    name: "Demo Kullanıcı",
  },
};

const demoSeller: SellerAccount = {
  id: "seller_demo",
  username: "satici",
  password: "123456",
  role: "seller",
  display_name: "Demo Satıcı",
  stores: defaultSellerStores,
};

const initialState: AuthState = {
  accounts: [demoUser, demoSeller],
  activeAccountId: null,
  activeRole: null,
  darkMode: false,
};

function normalizeState(parsed: Partial<AuthState>): AuthState {
  const storedAccounts = parsed.accounts?.length ? parsed.accounts : [];
  const accountIds = new Set(storedAccounts.map((account) => account.id));
  const seededAccounts = [
    ...storedAccounts,
    ...initialState.accounts.filter((account) => !accountIds.has(account.id)),
  ];

  return {
    ...initialState,
    ...parsed,
    accounts: seededAccounts,
  };
}

function readState(): AuthState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : initialState;
  } catch {
    return initialState;
  }
}

function writeState(state: AuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  document.documentElement.classList.toggle("dark", state.darkMode);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: state }));
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useAuthStore() {
  const [state, setState] = useState<AuthState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = readState();
    setState(current);
    document.documentElement.classList.toggle("dark", current.darkMode);
    setReady(true);

    const sync = () => setState(readState());
    window.addEventListener("storage", sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_EVENT, sync);
    };
  }, []);

  const commit = useCallback((updater: (current: AuthState) => AuthState) => {
    setState((current) => {
      const next = updater(current);
      writeState(next);
      return next;
    });
  }, []);

  const activeAccount = useMemo(
    () => state.accounts.find((account) => account.id === state.activeAccountId) || null,
    [state.accounts, state.activeAccountId]
  );

  const login = useCallback(
    (role: AuthRole, username: string, password: string) => {
      const account = state.accounts.find(
        (item) => item.role === role && item.username === username && item.password === password
      );

      if (!account) {
        return { ok: false, message: "Kullanıcı adı veya şifre hatalı.", account: null };
      }

      commit((current) => ({
        ...current,
        activeAccountId: account.id,
        activeRole: role,
      }));

      return { ok: true, message: "Giriş başarılı.", account };
    },
    [commit, state.accounts]
  );

  const logout = useCallback(() => {
    commit((current) => ({ ...current, activeAccountId: null, activeRole: null }));
  }, [commit]);

  const registerUser = useCallback(
    (username: string, password: string, profile: UserProfile) => {
      if (state.accounts.some((account) => account.username === username)) {
        return { ok: false, message: "Bu kullanıcı adı zaten kullanılıyor." };
      }

      const account: UserAccount = {
        id: makeId("user"),
        username,
        password,
        role: "user",
        profile,
      };

      commit((current) => ({
        ...current,
        accounts: [...current.accounts, account],
        activeAccountId: account.id,
        activeRole: "user",
      }));

      return { ok: true, message: "Kullanıcı kaydı oluşturuldu." };
    },
    [commit, state.accounts]
  );

  const registerSeller = useCallback(
    (username: string, password: string, displayName: string, firstStoreName: string) => {
      if (state.accounts.some((account) => account.username === username)) {
        return { ok: false, message: "Bu kullanıcı adı zaten kullanılıyor." };
      }

      const sellerId = makeId("seller");
      const account: SellerAccount = {
        id: sellerId,
        username,
        password,
        role: "seller",
        display_name: displayName,
        stores: [
          {
            id: makeId("store"),
            seller_id: sellerId,
            name: firstStoreName || `${displayName} Mağazası`,
            category: "Ayakkabı",
            shipping_fee: 45,
            marketplace_fee_rate: 0.12,
            fixed_expense: 2500,
          },
        ],
      };

      commit((current) => ({
        ...current,
        accounts: [...current.accounts, account],
        activeAccountId: account.id,
        activeRole: "seller",
      }));

      return { ok: true, message: "Satıcı kaydı oluşturuldu." };
    },
    [commit, state.accounts]
  );

  const updateActiveUserProfile = useCallback(
    (profile: UserProfile) => {
      commit((current) => ({
        ...current,
        accounts: current.accounts.map((account) =>
          account.id === current.activeAccountId && account.role === "user"
            ? { ...account, profile }
            : account
        ),
      }));
    },
    [commit]
  );

  const addSellerStore = useCallback(
    (storeName: string) => {
      if (!activeAccount || activeAccount.role !== "seller") return null;

      const newStore: SellerStore = {
        id: makeId("store"),
        seller_id: activeAccount.id,
        name: storeName,
        category: "Ayakkabı",
        shipping_fee: 45,
        marketplace_fee_rate: 0.12,
        fixed_expense: 2500,
      };

      commit((current) => ({
        ...current,
        accounts: current.accounts.map((account) => {
          if (account.id !== current.activeAccountId || account.role !== "seller") return account;
          return {
            ...account,
            stores: [...account.stores, newStore],
          };
        }),
      }));

      return newStore;
    },
    [activeAccount, commit]
  );

  const toggleDarkMode = useCallback(() => {
    commit((current) => ({ ...current, darkMode: !current.darkMode }));
  }, [commit]);

  return {
    ready,
    accounts: state.accounts,
    activeAccount,
    activeRole: state.activeRole,
    isLoggedIn: Boolean(activeAccount),
    isUser: activeAccount?.role === "user",
    isSeller: activeAccount?.role === "seller",
    darkMode: state.darkMode,
    login,
    logout,
    registerUser,
    registerSeller,
    updateActiveUserProfile,
    addSellerStore,
    toggleDarkMode,
  };
}
