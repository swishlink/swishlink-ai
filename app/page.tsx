import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Upload a clip",
    desc: "Drop in any highlight reel — a full game, a few possessions, or just your best plays.",
  },
  {
    n: "02",
    title: "AI analyzes your game",
    desc: "SwishLink breaks down your shot selection, finishing, and ball-handling tendencies.",
  },
  {
    n: "03",
    title: "Get your player DNA",
    desc: "Receive your archetype, skill ratings, and the NBA player you play most like.",
  },
];

const PREVIEW_RATINGS = [
  { label: "3PT", value: 88, color: "bg-orange-400" },
  { label: "Finishing", value: 62, color: "bg-sky-400" },
  { label: "Handles", value: 71, color: "bg-emerald-400" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
      </div>

      <div className="relative flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <span className="text-lg font-bold tracking-tight">SwishLink</span>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-400 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-400 mb-8">
            AI-Powered Player Analysis
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-[1.05] tracking-tight mb-6 max-w-3xl">
            Upload your game.
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              Discover your DNA.
            </span>
          </h1>

          <p className="max-w-md text-gray-400 text-lg leading-relaxed mb-10">
            Drop in a highlight reel and get your shooting rating, finishing grade,
            playmaking score, and NBA player comparison — in seconds.
          </p>

          <Link
            href="/signup"
            className="rounded-lg bg-orange-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-orange-400 shadow-lg shadow-orange-500/20"
          >
            Get Started Free
          </Link>
          <p className="mt-4 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-400 hover:text-white underline underline-offset-2">
              Log in
            </Link>
          </p>
        </section>

        {/* Player card preview */}
        <section className="px-6 pb-24 flex justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur p-7 shadow-2xl shadow-black/50">
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">
              Player Profile
            </span>
            <h3 className="text-2xl font-bold mt-1">Sharpshooter</h3>
            <p className="text-sm text-gray-400 mt-1 mb-7">
              NBA Comparison:{" "}
              <span className="font-semibold text-white">Klay Thompson</span>
            </p>
            <div className="grid grid-cols-3 gap-5">
              {PREVIEW_RATINGS.map(({ label, value, color }) => (
                <div key={label}>
                  <div className="text-4xl font-bold text-white">{value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                    {label}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-800">
                    <div
                      className={`h-1.5 rounded-full ${color}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 px-6 py-24">
          <h2 className="text-center text-2xl font-bold mb-2">How it works</h2>
          <p className="text-center text-gray-500 mb-14 text-sm">Three steps from raw footage to player DNA.</p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-xl border border-white/8 bg-white/3 p-6 hover:border-orange-500/30 transition-colors"
              >
                <div className="text-3xl font-bold text-orange-400/60 mb-4 font-mono">
                  {step.n}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-700">
          © 2026 SwishLink. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
