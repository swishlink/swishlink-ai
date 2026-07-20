"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { generateShareCard } from "@/lib/generateCard";
import type { PlayerProfile } from "@/lib/playerProfile";

type Props = {
  profile: PlayerProfile;
  username: string;
  userId: string;
  videoId?: string;
  // Delay before the panel reveals itself, in ms. Defaults to a short
  // "reveal" pause for the just-analyzed card; pass 0 for cards a user is
  // revisiting later (e.g. the clip library), where it should show at once.
  revealDelayMs?: number;
};

export default function ShareBar({
  profile,
  username,
  userId,
  videoId,
  revealDelayMs = 4000,
}: Props) {
  const [visible, setVisible] = useState(revealDelayMs === 0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (revealDelayMs === 0) return;
    const t = setTimeout(() => setVisible(true), revealDelayMs);
    return () => clearTimeout(t);
  }, [revealDelayMs]);

  const profileUrl = `https://swishlink-ai.vercel.app/player/${username}`;
  const igCaption = `Just found out I'm a ${profile.archetype} 🏀 Plays like ${profile.nbaComparison}. Get your player DNA 👉 ${profileUrl}`;
  const ttCaption = `I'm a ${profile.archetype} — plays like ${profile.nbaComparison} 🏀🔥 Drop your clip at ${profileUrl} #basketball #SwishLink`;

  const handleDownload = async () => {
    setDownloading(true);
    trackEvent(supabase, "card_downloaded", userId, videoId);
    await generateShareCard(profile, username);
    setDownloading(false);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    trackEvent(supabase, "link_copied", userId, videoId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareIG = async () => {
    trackEvent(supabase, "share_clicked", userId, videoId);
    await navigator.clipboard.writeText(igCaption);
    alert("Instagram caption copied — paste it when you share your card.");
  };

  const handleShareTT = async () => {
    trackEvent(supabase, "share_clicked", userId, videoId);
    await navigator.clipboard.writeText(ttCaption);
    alert("TikTok caption copied — paste it when you post your card.");
  };

  return (
    <div
      style={{
        // Generous cap so the two-row mobile grid (grid-cols-2) isn't
        // clipped by overflow:hidden — the old 120px only fit the
        // single-row desktop layout (sm:grid-cols-4).
        maxHeight: visible ? "260px" : "0px",
        opacity: visible ? 1 : 0,
        marginTop: visible ? "12px" : "0px",
        transition: "max-height 0.5s ease, opacity 0.5s ease, margin-top 0.5s ease",
        overflow: "hidden",
      }}
    >
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Share your card
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 transition-colors px-3 py-2 text-xs font-semibold text-white"
          >
            {downloading ? "Generating…" : "Download Card"}
          </button>
          <button
            onClick={handleCopyLink}
            className="rounded-lg border border-white/10 hover:border-white/30 transition-colors px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={handleShareIG}
            className="rounded-lg border border-white/10 hover:border-white/30 transition-colors px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white"
          >
            Share to IG
          </button>
          <button
            onClick={handleShareTT}
            className="rounded-lg border border-white/10 hover:border-white/30 transition-colors px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white"
          >
            Share to TikTok
          </button>
        </div>
      </div>
    </div>
  );
}
