import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PlayerProfileCard from "@/components/PlayerProfileCard";
import type { PlayerProfile } from "@/lib/playerProfile";

type Props = { params: Promise<{ username: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, profile_public")
    .eq("username", username)
    .single();

  const isPrivate = !profile || !profile.profile_public;

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <nav className="px-8 py-5 border-b border-white/5">
          <Link href="/">
            <Image src="/swishlink-logo.png" alt="SwishLink" width={140} height={40} className="object-contain" />
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5 mb-5">
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2">This player&apos;s profile is private.</h1>
            <p className="text-sm text-gray-500">
              They haven&apos;t made their card public yet.
            </p>
            <Link href="/signup" className="inline-block mt-6 rounded-lg bg-orange-500 hover:bg-orange-400 transition-colors px-6 py-2.5 text-sm font-semibold text-white">
              Get your own card
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch most recent video with profile data
  const { data: video } = await supabase
    .from("videos")
    .select("id, archetype, rating_3pt, rating_3pt_observed, rating_finishing, rating_finishing_observed, rating_handles, rating_handles_observed, nba_comparison, comparison_reason, confidence, confidence_note")
    .eq("user_id", profile.id)
    .not("archetype", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <nav className="px-8 py-5 border-b border-white/5">
          <Link href="/">
            <Image src="/swishlink-logo.png" alt="SwishLink" width={140} height={40} className="object-contain" />
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5 mb-5">
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2">This player card is no longer available.</h1>
            <p className="text-sm text-gray-500">
              @{profile.username} hasn&apos;t uploaded a clip yet, or it was removed.
            </p>
            <Link href="/signup" className="inline-block mt-6 rounded-lg bg-orange-500 hover:bg-orange-400 transition-colors px-6 py-2.5 text-sm font-semibold text-white">
              Create your own card
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const playerProfile: PlayerProfile = {
    archetype: video.archetype,
    ratings: {
      threePoint: video.rating_3pt,
      finishing: video.rating_finishing,
      handles: video.rating_handles,
    },
    observed: {
      threePoint: video.rating_3pt_observed ?? true,
      finishing: video.rating_finishing_observed ?? true,
      handles: video.rating_handles_observed ?? true,
    },
    nbaComparison: video.nba_comparison,
    comparisonReason: video.comparison_reason ?? "",
    confidence: video.confidence ?? undefined,
    confidenceNote: video.confidence_note ?? undefined,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <Link href="/">
          <Image src="/swishlink-logo.png" alt="SwishLink" width={140} height={40} className="object-contain" />
        </Link>
        <Link href="/signup" className="rounded-md bg-orange-500 hover:bg-orange-400 transition-colors px-4 py-1.5 text-sm font-semibold text-white">
          Get your card
        </Link>
      </nav>

      <div className="max-w-md mx-auto px-6 py-10">
        <div className="text-center mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Player Card</p>
          <p className="text-lg font-bold mt-1">@{profile.username}</p>
        </div>

        <PlayerProfileCard
          profile={playerProfile}
          username={profile.username}
        />

        <p className="text-center text-xs text-gray-600 mt-8">
          Know your game at{" "}
          <Link href="/" className="text-gray-500 hover:text-white underline underline-offset-2">
            swishlink-ai.vercel.app
          </Link>
        </p>
      </div>
    </div>
  );
}
