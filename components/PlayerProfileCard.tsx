"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { generateShareCard } from "@/lib/generateCard";
import ShareBar from "@/components/ShareBar";
export type { PlayerProfile } from "@/lib/playerProfile";
export { getProfile } from "@/lib/playerProfile";

import type { PlayerProfile } from "@/lib/playerProfile";

const RATING_COLORS: Record<string, string> = {
  "3PT": "bg-orange-400",
  Finishing: "bg-sky-400",
  Handles: "bg-emerald-400",
};

type Props = {
  profile: PlayerProfile;
  username?: string;
  userId?: string;
  videoId?: string;
  showSharePrompt?: boolean;
  trackView?: boolean;
};

export default function PlayerProfileCard({
  profile,
  username,
  userId,
  videoId,
  showSharePrompt = false,
  trackView = false,
}: Props) {
  useEffect(() => {
    if (trackView && userId) {
      trackEvent(supabase, "card_viewed", userId, videoId);
    }
  }, [trackView, userId, videoId]);

  const handleDownload = async () => {
    if (!username) return;
    if (userId) trackEvent(supabase, "card_downloaded", userId, videoId);
    await generateShareCard(profile, username);
  };

  const ratings = [
    { label: "3PT", value: profile.ratings.threePoint },
    { label: "Finishing", value: profile.ratings.finishing },
    { label: "Handles", value: profile.ratings.handles },
  ];

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-[#0a1120] text-white p-6 mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">
              Player Profile
            </span>
            {username && (
              <p className="text-xs text-gray-600 mt-0.5">@{username}</p>
            )}
          </div>
          {username && (
            <button
              onClick={handleDownload}
              className="shrink-0 rounded-md border border-white/10 hover:border-orange-500/40 hover:text-orange-400 transition-colors px-3 py-1.5 text-xs text-gray-500"
            >
              Download Card
            </button>
          )}
        </div>

        <h3 className="text-2xl font-bold mt-2">{profile.archetype}</h3>
        <p className="text-sm text-gray-400 mt-1">
          NBA Comparison:{" "}
          <span className="font-semibold text-white">{profile.nbaComparison}</span>
        </p>
        {profile.comparisonReason && (
          <p className="text-xs text-gray-500 leading-relaxed mt-2 mb-6">
            {profile.comparisonReason}
          </p>
        )}
        {!profile.comparisonReason && <div className="mb-6" />}

        <div className="grid grid-cols-3 gap-6">
          {ratings.map(({ label, value }) => (
            <div key={label}>
              <div className="text-4xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                {label}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-800">
                <div
                  className={`h-1.5 rounded-full ${RATING_COLORS[label]}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSharePrompt && username && userId && (
        <ShareBar
          profile={profile}
          username={username}
          userId={userId}
          videoId={videoId}
        />
      )}
    </div>
  );
}
