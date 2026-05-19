"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthRole } from "../../lib/types";
import { DEFAULT_PROFILE, inferPersona, personaLabel } from "../../lib/personalization";
import { useAuthStore } from "../../lib/authStore";
import { buildProfile, useCommerceStore } from "../../lib/userStore";

type LoginMode = "login" | "register";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-950 dark:bg-gray-950 dark:text-white md:p-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight">Giriş ve kayıt</h1>
          <p className="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">
            Alışveriş deneyimi kullanıcı profiline göre kişiselleşir; satıcı paneli ise mağaza, ürün, iade ve kârlılık yönetimi için ayrı çalışır.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AuthCard role="user" title="Kullanıcı hesabı" subtitle="Mağaza, favoriler, sepet, iade kodu ve persona önerileri için giriş yap." />
          <AuthCard role="seller" title="Satıcı hesabı" subtitle="Mağaza seçimi, ürün yükleme, finans ve NoBrainer düzenleme önerileri için giriş yap." />
        </div>
      </div>
    </main>
  );
}

function AuthCard({ role, title, subtitle }: { role: AuthRole; title: string; subtitle: string }) {
  const router = useRouter();
  const { login, registerUser, registerSeller } = useAuthStore();
  const { saveProfile } = useCommerceStore();
  const [mode, setMode] = useState<LoginMode>("login");
  const [username, setUsername] = useState(role === "user" ? "kullanici" : "satici");
  const [password, setPassword] = useState("123456");
  const [name, setName] = useState(role === "user" ? "Yeni Kullanıcı" : "Yeni Satıcı");
  const [storeName, setStoreName] = useState("Yeni Mağaza");
  const [message, setMessage] = useState("");
  const [profileForm, setProfileForm] = useState({
    ...DEFAULT_PROFILE,
    name: "Yeni Kullanıcı",
    persona: "auto" as "auto" | "style" | "comfort" | "budget",
  });

  const inferredPersona = inferPersona(profileForm);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (mode === "login") {
      const result = login(role, username, password);
      setMessage(result.message);
      if (result.ok) {
        if (result.account?.role === "user") {
          saveProfile(result.account.profile);
        }
        router.push(role === "seller" ? "/seller" : "/shop");
      }
      return;
    }

    if (role === "user") {
      const profile = buildProfile({
        ...profileForm,
        name,
        persona: profileForm.persona === "auto" ? inferredPersona : profileForm.persona,
      });
      const result = registerUser(username, password, profile);
      setMessage(result.message);
      if (result.ok) {
        saveProfile(profile);
        router.push("/shop");
      }
      return;
    }

    const result = registerSeller(username, password, name, storeName);
    setMessage(result.message);
    if (result.ok) {
      router.push("/seller");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{subtitle}</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-950">
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-xl px-4 py-3 text-sm font-black ${mode === item ? "bg-white text-gray-950 shadow-sm dark:bg-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
          >
            {item === "login" ? "Giriş" : "Kayıt"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-gray-400">Ad</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none dark:border-gray-700 dark:bg-gray-950" />
          </label>
          {role === "seller" && (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">İlk mağaza</span>
              <input value={storeName} onChange={(event) => setStoreName(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none dark:border-gray-700 dark:bg-gray-950" />
            </label>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-gray-400">Kullanıcı adı</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none dark:border-gray-700 dark:bg-gray-950" />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-gray-400">Şifre</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none dark:border-gray-700 dark:bg-gray-950" />
        </label>
      </div>

      {mode === "register" && role === "user" && (
        <div className="mt-6 rounded-2xl bg-gray-50 p-5 dark:bg-gray-950">
          <h3 className="mb-4 text-lg font-black">Persona soruları</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <select value={profileForm.gender} onChange={(event) => setProfileForm((current) => ({ ...current, gender: event.target.value as never }))} className="rounded-xl border border-gray-200 px-4 py-3 font-bold dark:border-gray-700 dark:bg-gray-900">
              <option value="Women">Kadın</option>
              <option value="Men">Erkek</option>
              <option value="Kids">Çocuk</option>
              <option value="Unisex">Fark etmez</option>
            </select>
            <select value={profileForm.age_group} onChange={(event) => setProfileForm((current) => ({ ...current, age_group: event.target.value as never }))} className="rounded-xl border border-gray-200 px-4 py-3 font-bold dark:border-gray-700 dark:bg-gray-900">
              <option value="teen">Genç</option>
              <option value="young_adult">Genç yetişkin</option>
              <option value="adult">Yetişkin</option>
              <option value="senior">Konfor öncelikli</option>
            </select>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              ["style_sensitive", "Stil ve kombin önemli"],
              ["comfort_sensitive", "Konfor önemli"],
              ["budget_sensitive", "Fiyat/performans önemli"],
              ["coupon_sensitive", "Kupon kararımı etkiler"],
              ["fit_sensitive", "Kalıp ve iade riski önemli"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-bold dark:bg-gray-900">
                <input
                  type="checkbox"
                  checked={Boolean(profileForm[key as keyof typeof profileForm])}
                  onChange={(event) => setProfileForm((current) => ({ ...current, [key]: event.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm font-black text-blue-600">Otomatik persona: {personaLabel(inferredPersona)}</p>
        </div>
      )}

      {message && <p className="mt-5 rounded-xl bg-gray-100 p-4 text-sm font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{message}</p>}

      <button className="mt-6 w-full rounded-2xl bg-black px-6 py-4 font-black text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-black" type="submit">
        {mode === "login" ? "Giriş yap" : "Kayıt oluştur"}
      </button>

      <p className="mt-4 text-center text-xs font-bold text-gray-400">
        Demo: {role === "user" ? "kullanici / 123456" : "satici / 123456"}
      </p>
    </form>
  );
}
