import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6">
        <span className="text-xl font-bold tracking-tight">SwishLink</span>
        <Link
          href="/login"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Log in
        </Link>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 pb-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-400 mb-8">
          AI-Powered Player Analysis
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
          Upload your game.
          <br />
          <span className="text-orange-400">Discover your DNA.</span>
        </h1>

        <p className="max-w-lg text-gray-400 text-lg leading-relaxed mb-10">
          Drop in a highlight reel and get your shooting rating, finishing grade,
          playmaking score, and NBA player comparison — in seconds.
        </p>

        <Link
          href="/signup"
          className="rounded-lg bg-orange-500 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-orange-400"
        >
          Get Started Free
        </Link>

        <p className="mt-5 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-400 underline hover:text-white">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
