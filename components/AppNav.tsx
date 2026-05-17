"use client";

import Link from "next/link";
import { useAuthStore } from "../lib/authStore";
import { useCommerceStore } from "../lib/userStore";

export default function AppNav() {
  const { counts, profile } = useCommerceStore();
  const { activeAccount, activeRole, darkMode, logout, toggleDarkMode } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white">
          Adaptive Commerce AI
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <Link className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" href="/shop">
            Mağaza
          </Link>
          {activeRole !== "seller" && (
            <>
              <Link className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" href="/favorites">
                Favoriler ({counts.favorites})
              </Link>
              <Link className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" href="/cart">
                Sepetim ({counts.cart})
              </Link>
              <Link className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" href="/returns">
                İade
              </Link>
            </>
          )}
          <Link className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" href="/seller">
            Satıcı
          </Link>
          <button
            className="rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={toggleDarkMode}
            type="button"
          >
            {darkMode ? "Aydınlık" : "Karanlık"}
          </button>

          {activeAccount ? (
            <>
              <Link
                className="rounded-xl bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
                href={activeRole === "seller" ? "/seller" : "/profile"}
              >
                {activeRole === "seller" ? "Satıcı" : profile.persona} · {activeAccount.username}
              </Link>
              <button
                className="rounded-xl border border-gray-200 px-3 py-2 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                onClick={logout}
                type="button"
              >
                Çıkış
              </button>
            </>
          ) : (
            <Link className="rounded-xl bg-black px-4 py-2 text-white dark:bg-white dark:text-black" href="/login">
              Giriş / Kayıt
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
