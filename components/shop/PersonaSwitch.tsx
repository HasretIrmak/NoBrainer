"use client";
import { motion } from 'framer-motion';

export default function PersonaSwitch({ current, setPersona }: { current: string, setPersona: any }) {
  const tabs = [
    { id: 'style', label: 'Stil Odaklı', icon: '✨' },
    { id: 'comfort', label: 'Konfor Odaklı', icon: '☁️' },
    { id: 'budget', label: 'Bütçe Dostu', icon: '💰' }
  ];

  return (
    <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setPersona(tab.id)}
          className="relative px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          {current === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-xl shadow-sm"
              transition={{ type: "spring", duration: 0.5 }}
            />
          )}
          <span className={`relative z-10 ${current === tab.id ? 'text-blue-600' : 'text-gray-500'}`}>
            {tab.icon} {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}