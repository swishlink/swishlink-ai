// Client-side frame extraction. Loads a video File into a hidden <video>
// element, seeks to evenly-spaced timestamps across the clip, and captures
// each frame as a base64 JPEG (no data-URL prefix) suitable for the
// Anthropic vision API.

export type ExtractedFrame = { data: string; mediaType: "image/jpeg" };

const FRAME_COUNT = 12; // 10–15 range, spread evenly across the clip
const MAX_EDGE = 1024; // downscale long edge to keep the payload reasonable
const JPEG_QUALITY = 0.72;

export async function extractFrames(
  file: File,
  count: number = FRAME_COUNT
): Promise<ExtractedFrame[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await once(video, "loadedmetadata");

    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) {
      throw new Error("Could not read video duration.");
    }

    // Evenly spaced timestamps, nudged inside the clip to avoid black
    // first/last frames and encoder padding.
    const timestamps: number[] = [];
    for (let i = 0; i < count; i++) {
      const t = (duration * (i + 0.5)) / count;
      timestamps.push(Math.min(Math.max(t, 0.05), Math.max(duration - 0.05, 0)));
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale) || MAX_EDGE;
    canvas.height = Math.round(video.videoHeight * scale) || MAX_EDGE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported.");

    const frames: ExtractedFrame[] = [];
    for (const t of timestamps) {
      await seek(video, t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      frames.push({ data: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

function once(el: HTMLMediaElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error(`Failed to load video (${event}).`));
    };
    const cleanup = () => {
      el.removeEventListener(event, onOk);
      el.removeEventListener("error", onErr);
    };
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("Failed while seeking video."));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onErr);
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onErr, { once: true });
    video.currentTime = time;
  });
}
