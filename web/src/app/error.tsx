'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-3xl mb-6">
        ⚠️
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Something went wrong
      </h1>

      <p className="text-gray-400 max-w-md mb-8 text-sm md:text-base">
        An unexpected error occurred while processing this request. Our autonomous monitoring system has logged this incident.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0080FF] text-black font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
