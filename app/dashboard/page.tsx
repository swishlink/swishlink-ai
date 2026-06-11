"use client";

import { useEffect, useState, ChangeEvent, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PlayerProfileCard, { getProfile } from "@/components/PlayerProfileCard";
import type { PlayerProfile } from "@/lib/playerProfile";

type VideoRecord = {
  id: string;
  file_path: string;
  created_at: string;
  archetype: string | null;
  rating_3pt: number | null;
  rating_finishing: number | null;
  rating_handles: number | null;
  nba_comparison: string | null;
};

function profileFromRecord(video: VideoRecord): PlayerProfile | null {
  if (!video.archetype || video.rating_3pt == null) return null;
  return {
    archetype: video.archetype,
    ratings: {
      threePoint: video.rating_3pt,
      finishing: video.rating_finishing!,
      handles: video.rating_handles!,
    },
    nbaComparison: video.nba_comparison!,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [profilePublic, setProfilePublic] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [lastUploadedProfile, setLastUploadedProfile] = useState<PlayerProfile | null>(null);
  const [lastUploadedVideoId, setLastUploadedVideoId] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setUserEmail(user.email || "");
      setUserId(user.id);

      // Fetch or create username + public flag
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("username, profile_public")
        .eq("id", user.id)
        .single();

      if (profile?.username) {
        setUsername(profile.username);
        setProfilePublic(profile.profile_public ?? false);
      } else if (!profileErr || profileErr.code === "PGRST116") {
        // Row not found — create it
        const generated = "player_" + user.id.slice(0, 8);
        const { error: upsertErr } = await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          username: generated,
          profile_public: false,
        });
        if (!upsertErr) setUsername(generated);
      }
    };
    init();
  }, [router]);

  const fetchVideos = async (uid: string) => {
    const { data, error } = await supabase
      .from("videos")
      .select("id, file_path, created_at, archetype, rating_3pt, rating_finishing, rating_handles, nba_comparison")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (!error) setVideos(data || []);
  };

  useEffect(() => { if (userId) fetchVideos(userId); }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleTogglePublic = async () => {
    setTogglingPublic(true);
    const next = !profilePublic;
    const { error } = await supabase
      .from("profiles")
      .update({ profile_public: next })
      .eq("id", userId);
    if (error) {
      alert("Could not update profile visibility: " + error.message);
    } else {
      setProfilePublic(next);
    }
    setTogglingPublic(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;
    setUploading(true);
    setLastUploadedProfile(null);

    const fileExt = selectedFile.name.split(".").pop();
    const filePath = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("videos").upload(filePath, selectedFile);
    if (uploadError) {
      alert("Upload failed: " + uploadError.message + "\n\nCheck that your Supabase storage bucket has an upload policy for authenticated users.");
      setUploading(false);
      return;
    }

    const profile = getProfile(filePath);

    const { data: inserted, error: dbError } = await supabase
      .from("videos")
      .insert([{
        user_id: userId,
        file_path: filePath,
        archetype: profile.archetype,
        rating_3pt: profile.ratings.threePoint,
        rating_finishing: profile.ratings.finishing,
        rating_handles: profile.ratings.handles,
        nba_comparison: profile.nbaComparison,
      }])
      .select("id")
      .single();
    if (dbError) {
      alert("Database error: " + dbError.message + "\n\nCheck that the videos table has all required columns (archetype, rating_3pt, rating_finishing, rating_handles, nba_comparison).");
      setUploading(false);
      return;
    }

    setLastUploadedProfile(profile);
    setLastUploadedVideoId(inserted?.id);
    setSelectedFile(null);
    setUploading(false);
    fetchVideos(userId);
  };

  const getVideoUrl = (filePath: string) =>
    `https://iqdergebussgqfofcolv.supabase.co/storage/v1/object/public/videos/${filePath}`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <Image src="/swishlink-logo.png" alt="SwishLink" width={160} height={45} className="object-contain" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-white/10 px-4 py-1.5 text-sm text-gray-300 hover:border-white/30 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Profile settings */}
        <section className="mb-8 rounded-xl border border-white/8 bg-white/3 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-200">
              @{username || "…"}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {profilePublic
                ? "Your profile is public — anyone can view your card."
                : "Your profile is private — only you can see your card."}
            </p>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={togglingPublic || !userId}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
              profilePublic
                ? "bg-white/10 hover:bg-white/20 text-gray-300"
                : "bg-orange-500 hover:bg-orange-400 text-white"
            }`}
          >
            {profilePublic ? "Make Private" : "Make Profile Public"}
          </button>
        </section>

        {/* Upload section */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
            Analyze a clip
          </h2>

          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-white/10 bg-white/3 hover:border-orange-500/40 hover:bg-orange-500/5 transition-colors p-12 flex flex-col items-center gap-3 text-center group"
            >
              <div className="rounded-full bg-white/5 p-4 group-hover:bg-orange-500/10 transition-colors">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-300 group-hover:text-white transition-colors">Choose a video to upload</p>
                <p className="text-sm text-gray-600 mt-1">MP4, MOV, AVI — any highlight reel</p>
              </div>
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/3 p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-lg bg-orange-500/10 p-2.5 shrink-0">
                  <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setSelectedFile(null)} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  Remove
                </button>
                <button onClick={handleUpload} disabled={uploading} className="rounded-md bg-orange-500 hover:bg-orange-400 disabled:opacity-50 px-4 py-1.5 text-sm font-semibold text-white transition-colors">
                  {uploading ? "Uploading…" : "Analyze"}
                </button>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />

          {lastUploadedProfile && (
            <PlayerProfileCard
              profile={lastUploadedProfile}
              username={username}
              userId={userId}
              videoId={lastUploadedVideoId}
              showSharePrompt={true}
              trackView={true}
            />
          )}
        </section>

        {/* Video library */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
            Your clips
          </h2>

          {videos.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/2 py-16 text-center">
              <p className="text-gray-600 text-sm">No clips uploaded yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {videos.map((video) => {
                const savedProfile = profileFromRecord(video);
                return (
                  <li key={video.id} className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                    <video controls className="w-full max-h-72 bg-black" src={getVideoUrl(video.file_path)} />
                    <div className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate text-gray-200">
                          {video.file_path.split("-").slice(2).join("-") || video.file_path}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(video.created_at)}</p>
                      </div>
                      <a href={getVideoUrl(video.file_path)} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 rounded-md border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:border-white/30 hover:text-white transition-colors">
                        Open
                      </a>
                    </div>
                    {savedProfile && (
                      <div className="px-5 pb-5">
                        <PlayerProfileCard
                          profile={savedProfile}
                          username={username}
                          userId={userId}
                          videoId={video.id}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
