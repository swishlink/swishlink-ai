"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { generateShareCard } from "@/lib/generateCard";
import ShareBar from "@/components/ShareBar";
export type { PlayerProfile } from "@/lib/playerProfile";
export { getProfile } from "@/lib/playerProfile";

import type { PlayerProfile } from "@/lib/playerProfile";
import { confidenceLabel } from "@/lib/playerProfile";

const RATING_COLORS: Record<string, string> = {
  "3PT": "bg-orange-400",
  Finishing: "bg-sky-400",
  Handles: "bg-emerald-400",
};

const CONFIDENCE_LABEL_COLORS: Record<string, string> = {
  high: "text-emerald-400",
  medium: "text-sky-400",
  low: "text-amber-400",
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

  const readLabel = confidenceLabel(profile.confidence);
  const readColor = CONFIDENCE_LABEL_COLORS[profile.confidence ?? "medium"];

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-[#0a1120] text-white p-6 mt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          {username ? (
            <p className="text-2xl sm:text-3xl font-extrabold text-orange-400 tracking-tight">
              @{username}
            </p>
          ) : (
            <span />
          )}
          {username && (
            <button
              onClick={handleDownload}
              className="shrink-0 rounded-md border border-white/10 hover:border-orange-500/40 hover:text-orange-400 transition-colors px-3 py-1.5 text-xs text-gray-500"
            >
              Download Card
            </button>
          )}
        </div>

        {/* HERO — identity is the largest element on the card */}
        <div className="mt-5 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Your Basketball Identity
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            {profile.archetype}
          </h2>
          <p className="mt-2 text-xs text-gray-600">
            Based on AI analysis of your uploaded game footage.
          </p>
        </div>

        {profile.confidence === "low" && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-amber-300/90 leading-relaxed">
              Analysis confidence: low — try uploading a clearer clip where
              you&apos;re easy to spot.
              {profile.confidenceNote ? ` ${profile.confidenceNote}` : ""}
            </p>
          </div>
        )}

        {/* Closest NBA match */}
        <div className="mt-6 rounded-lg border border-white/8 bg-white/3 px-4 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Closest NBA Match
          </p>
          <p className="mt-1 text-xl font-bold text-white">
            {profile.nbaComparison}
          </p>
          <p className={`mt-2 text-[10px] font-semibold uppercase tracking-widest ${readColor}`}>
            {readLabel}
          </p>
          {profile.comparisonReason && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              {profile.comparisonReason}
            </p>
          )}
        </div>

        {/* Skills — below the identity, in support of it */}
        <div className="mt-6 grid grid-cols-3 gap-6">
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
