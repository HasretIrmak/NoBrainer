"use client";
import { useEffect, useState } from "react";

export default function ScoreCard({ label, value, prefix = "" }: { label: string, value: number, prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000; 
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start * 10) / 10);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</h3>
      <p className="text-3xl font-black text-gray-800 mt-2">
        {prefix.includes('%') ? `${displayValue}%` : `${prefix}${displayValue}`}
      </p>
    </div>
  );
}