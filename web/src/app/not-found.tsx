import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6">
        <div className="text-8xl font-black bg-gradient-to-r from-[#00F0FF] via-[#7928CA] to-[#FF0080] bg-clip-text text-transparent">
          404
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Page Not Found
      </h1>

      <p className="text-gray-400 max-w-md mb-8 text-sm md:text-base">
        The page or career opportunity you are looking for may have expired, moved, or never existed in this dimension.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0080FF] text-black font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
        >
          Return Home
        </Link>
        <Link
          href="/jobs"
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
        >
          Explore Vacancies
        </Link>
      </div>
    </div>
  );
}
