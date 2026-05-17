"use client";

import { FormEvent, useEffect, useState } from "react";
import type { UserProfile } from "../../lib/types";
import { useAuthStore } from "../../lib/authStore";
import { DEFAULT_PROFILE, inferPersona } from "../../lib/personalization";
import { buildProfile, useCommerceStore } from "../../lib/userStore";

type ProfileForm = Omit<UserProfile, "persona"> & { persona: UserProfile["persona"] | "auto" };

export default function ProfilePage() {
  const { profile, saveProfile, setPersona, counts } = useCommerceStore();
  const { activeAccount, isUser, updateActiveUserProfile } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>({ ...DEFAULT_PROFILE, persona: "auto" });
  const inferred = inferPersona(form);

  useEffect(() => {
    setForm({ ...profile, persona: profile.persona });
  }, [profile.name]);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextProfile = buildProfile({
      ...form,
      persona: form.persona === "auto" ? inferred : form.persona,
    });
    saveProfile(nextProfile);
    if (isUser) {
      updateActiveUserProfile(nextProfile);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 md:p-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight">Kullanıcı profili</h1>
          <p className="mt-2 text-gray-500">
            Persona motoru cinsiyet, yaş grubu, kupon hassasiyeti, fit ve stil tercihlerini birlikte kullanır.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-8 shadow-sm lg:col-span-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">İsim</span>
              <input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-blue-500"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-gray-400">Cinsiyet</span>
                <select
                  value={form.gender}
                  onChange={(event) => update("gender", event.target.value as UserProfile["gender"])}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none"
                >
                  <option value="Women">Kadın</option>
                  <option value="Men">Erkek</option>
                  <option value="Unisex">Unisex / fark etmez</option>
                  <option value="Kids">Çocuk</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-gray-400">Yaş grubu</span>
                <select
                  value={form.age_group}
                  onChange={(event) => update("age_group", event.target.value as UserProfile["age_group"])}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none"
                >
                  <option value="teen">Genç</option>
                  <option value="young_adult">Genç yetişkin</option>
                  <option value="adult">Yetişkin</option>
                  <option value="senior">Konfor öncelikli</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">Persona seçimi</span>
              <select
                value={form.persona}
                onChange={(event) => update("persona", event.target.value as ProfileForm["persona"])}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none"
              >
                <option value="auto">Sorulara göre otomatik: {inferred}</option>
                <option value="style">Style</option>
                <option value="comfort">Comfort</option>
                <option value="budget">Budget</option>
              </select>
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["style_sensitive", "Stil ve kombin benim için önemli"],
                ["comfort_sensitive", "Konfor ve günlük kullanım önemli"],
                ["budget_sensitive", "Fiyat/performans arıyorum"],
                ["coupon_sensitive", "Kupon ve indirim kararımı etkiler"],
                ["fit_sensitive", "Kalıp ve iade riski benim için kritik"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof ProfileForm])}
                    onChange={(event) => update(key as keyof ProfileForm, event.target.checked as never)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <button className="w-full rounded-2xl bg-black px-6 py-4 font-black text-white" type="submit">
              Profili kaydet
            </button>
          </form>

          <aside className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black">Aktif profil</h2>
            <div className="mt-6 space-y-4 text-sm">
              <p><strong>Hesap:</strong> {activeAccount?.username || "Misafir"}</p>
              <p><strong>Persona:</strong> {profile.persona}</p>
              <p><strong>Cinsiyet:</strong> {profile.gender}</p>
              <p><strong>Yaş grubu:</strong> {profile.age_group}</p>
              <p><strong>Favori:</strong> {counts.favorites}</p>
              <p><strong>Sepet:</strong> {counts.cart}</p>
              <p><strong>İade kodu:</strong> {counts.returns}</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {(["style", "comfort", "budget"] as const).map((persona) => (
                <button
                  key={persona}
                  onClick={() => setPersona(persona)}
                  className={`rounded-xl px-3 py-2 text-xs font-black ${
                    profile.persona === persona ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                  }`}
                  type="button"
                >
                  {persona}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
