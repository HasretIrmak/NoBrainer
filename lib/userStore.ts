"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem, Persona, ReturnRecord, UserProfile } from "./types";
import { DEFAULT_PROFILE, inferPersona } from "./personalization";

const STORAGE_KEY = "adaptive-commerce-user-state-v1";
const STATE_EVENT = "adaptive-commerce-user-state-changed";

type CommerceState = {
  profile: UserProfile | null;
  favorites: string[];
  cart: CartItem[];
  returns: ReturnRecord[];
};

const initialState: CommerceState = {
  profile: null,
  favorites: [],
  cart: [],
  returns: [],
};

function readState(): CommerceState {
  if (typeof window === "undefined") return initialState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

function writeState(state: CommerceState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: state }));
}

export function buildProfile(input: Omit<UserProfile, "persona"> & { persona?: Persona }): UserProfile {
  return {
    ...DEFAULT_PROFILE,
    ...input,
    persona:
      input.persona ||
      inferPersona({
        style_sensitive: input.style_sensitive,
        comfort_sensitive: input.comfort_sensitive,
        budget_sensitive: input.budget_sensitive,
        coupon_sensitive: input.coupon_sensitive,
        fit_sensitive: input.fit_sensitive,
      }),
  };
}

export function useCommerceStore() {
  const [state, setState] = useState<CommerceState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readState());
    setReady(true);

    const sync = () => setState(readState());
    window.addEventListener("storage", sync);
    window.addEventListener(STATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(STATE_EVENT, sync);
    };
  }, []);

  const commit = useCallback((updater: (current: CommerceState) => CommerceState) => {
    setState((current) => {
      const next = updater(current);
      writeState(next);
      return next;
    });
  }, []);

  const saveProfile = useCallback(
    (profile: UserProfile) => commit((current) => ({ ...current, profile })),
    [commit]
  );

  const setPersona = useCallback(
    (persona: Persona) =>
      commit((current) => ({
        ...current,
        profile: { ...(current.profile || DEFAULT_PROFILE), persona },
      })),
    [commit]
  );

  const toggleFavorite = useCallback(
    (productId: string) =>
      commit((current) => ({
        ...current,
        favorites: current.favorites.includes(productId)
          ? current.favorites.filter((id) => id !== productId)
          : [...current.favorites, productId],
      })),
    [commit]
  );

  const addToCart = useCallback(
    (productId: string) =>
      commit((current) => {
        const existing = current.cart.find((item) => item.product_id === productId);
        return {
          ...current,
          cart: existing
            ? current.cart.map((item) =>
                item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item
              )
            : [...current.cart, { product_id: productId, quantity: 1 }],
        };
      }),
    [commit]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) =>
      commit((current) => ({
        ...current,
        cart:
          quantity <= 0
            ? current.cart.filter((item) => item.product_id !== productId)
            : current.cart.map((item) =>
                item.product_id === productId ? { ...item, quantity } : item
              ),
      })),
    [commit]
  );

  const clearCart = useCallback(
    () => commit((current) => ({ ...current, cart: [] })),
    [commit]
  );

  const createReturn = useCallback(
    (record: Omit<ReturnRecord, "id" | "created_at" | "code">) => {
      const createdRecord: ReturnRecord = {
        ...record,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        code: `IAD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      };
      commit((current) => ({ ...current, returns: [createdRecord, ...current.returns] }));
      return createdRecord;
    },
    [commit]
  );

  const counts = useMemo(
    () => ({
      favorites: state.favorites.length,
      cart: state.cart.reduce((total, item) => total + item.quantity, 0),
      returns: state.returns.length,
    }),
    [state.cart, state.favorites.length, state.returns.length]
  );

  return {
    ready,
    ...state,
    profile: state.profile || DEFAULT_PROFILE,
    hasProfile: Boolean(state.profile),
    counts,
    saveProfile,
    setPersona,
    toggleFavorite,
    addToCart,
    updateCartQuantity,
    clearCart,
    createReturn,
  };
}
