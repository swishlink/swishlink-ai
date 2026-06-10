"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import PlayerProfileCard from "@/components/PlayerProfileCard";

type VideoRecord = {
  id: string;
  file_path: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userId, setUserId] = useState("");
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [lastUploadedPath, setLastUploadedPath] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
      } else {
        setUserEmail(user.email || "");
        setUserId(user.id);
      }
    };

    getUser();
  }, [router]);

  const fetchVideos = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setVideos(data || []);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchVideos(userId);
    }
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      alert("Please select a file first");
      return;
    }

    const fileExt = selectedFile.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, selectedFile);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { error: dbError } = await supabase.from("videos").insert([
      {
        user_id: userId,
        file_path: filePath,
      },
    ]);

    if (dbError) {
      alert(dbError.message);
      return;
    }

    setLastUploadedPath(filePath);
    setSelectedFile(null);
    fetchVideos(userId);
  };

  const getVideoUrl = (filePath: string) => {
    return `https://iqdergebussgqfofcolv.supabase.co/storage/v1/object/public/videos/${filePath}`;
  };

  return (
    <main className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Logged in as: {userEmail}</p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Log Out
        </button>
      </div>

      <div className="border rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload a video</h2>

        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="mb-4"
        />

        {selectedFile && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-3">
              Selected file: {selectedFile.name}
            </p>

            <button
              onClick={handleUpload}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Upload Video
            </button>
          </div>
        )}

        {lastUploadedPath && (
          <PlayerProfileCard videoId={lastUploadedPath} />
        )}
      </div>

      <div className="border rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Your uploaded videos</h2>

        {videos.length === 0 ? (
          <p className="text-gray-500">No videos uploaded yet.</p>
        ) : (
          <ul className="space-y-6">
            {videos.map((video) => (
              <li key={video.id} className="border rounded p-4">
                <p className="font-medium mb-2">{video.file_path}</p>
                <p className="text-sm text-gray-500 mb-3">{video.created_at}</p>

                <video
                  controls
                  className="w-full max-w-md rounded border"
                  src={getVideoUrl(video.file_path)}
                />

                <a
                  href={getVideoUrl(video.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline block mt-3"
                >
                  Open video in new tab
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}