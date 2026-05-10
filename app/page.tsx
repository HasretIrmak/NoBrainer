// app/page.tsx

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center bg-white">
      <h1 className="text-6xl font-extrabold mb-6 text-black">
        Adaptive Commerce <span className="text-blue-600 font-serif italic">Intelligence</span>
      </h1>
      <p className="text-xl mb-12 text-gray-500 max-w-2xl mx-auto">
        "Aynı sneaker, 3 farklı insan, 3 farklı deneyim." <br />
        Gemini AI destekli e-ticaret optimizasyon platformu.
      </p>
      <div className="flex gap-4">
        <Link href="/seller" className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg">
          Seller Dashboard
        </Link>
        <Link href="/shop" className="px-8 py-4 border-2 border-black text-black rounded-full hover:bg-black hover:text-white transition">
          Shop Experience
        </Link>
      </div>
    </main>
  );
}