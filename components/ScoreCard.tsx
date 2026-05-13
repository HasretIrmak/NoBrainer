"use client";

import { useEffect, useState } from "react";

interface ScoreCardProps {
  label: string;
  value: number;
  prefix?: string;
}

export default function ScoreCard({ label, value, prefix = "" }: ScoreCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 45;

    const animate = () => {
      frame += 1;
      const nextValue = value * Math.min(frame / totalFrames, 1);
      setDisplayValue(Number(nextValue.toFixed(1)));

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value]);

  const getCardStyle = () => {
    if (label.toLowerCase().includes("risk")) {
      if (value > 60) return "border-red-500 bg-red-50";
      if (value > 30) return "border-yellow-500 bg-yellow-50";
      return "border-green-500 bg-green-50";
    }

    return "border-gray-100 bg-white";
  };

  return (
    <div className={`rounded-3xl border-2 p-6 shadow-sm transition-all duration-500 ${getCardStyle()}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
      <h3 className="text-4xl font-black text-gray-900">
        <span className="mr-1 text-sm font-medium text-gray-400">{prefix}</span>
        {displayValue}
      </h3>
    </div>
  );
}
