"use client";

import { motion } from "framer-motion";
import type { Persona } from "../../lib/types";

type PersonaTab = {
  id: Persona;
  label: string;
  short: string;
};

const tabs: PersonaTab[] = [
  { id: "style", label: "Stil Odaklı", short: "Stil" },
  { id: "comfort", label: "Konfor Odaklı", short: "Konfor" },
  { id: "budget", label: "Bütçe Dostu", short: "Bütçe" },
];

export default function PersonaSwitch({
  current,
  setPersona,
}: {
  current: Persona;
  setPersona: (persona: Persona) => void;
}) {
  return (
    <div className="mb-8 flex w-full max-w-xl gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setPersona(tab.id)}
          className="relative min-h-11 flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-colors"
          type="button"
          title={tab.label}
        >
          {current === tab.id && (
            <motion.div
              layoutId="active-persona-tab"
              className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-gray-950"
              transition={{ type: "spring", duration: 0.45 }}
            />
          )}
          <span className={`relative z-10 ${current === tab.id ? "text-blue-600" : "text-gray-500 dark:text-gray-300"}`}>
            {tab.short}
          </span>
        </button>
      ))}
    </div>
  );
}
