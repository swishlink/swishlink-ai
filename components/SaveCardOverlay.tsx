"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Object URL of the rendered card, or null when closed. */
  url: string | null;
  onClose: () => void;
};

// Shown when the browser can't take a file through the native share sheet —
// in practice desktop, plus older mobile browsers. The card is presented at
// full size so it can be saved directly off the screen. It deliberately does
// not fall back to the `<a download>` path, which is the bug this replaces.
export default function SaveCardOverlay({ url, onClose }: Props) {
  // Desktop users have no "press and hold", so don't tell them to do that.
  // Read lazily rather than in an effect. This is safe against a hydration
  // mismatch because the overlay renders nothing until `url` is set, which
  // only happens on a tap — long after hydration.
  const [isTouch] = useState(
    () => typeof navigator !== "undefined" && navigator.maxTouchPoints > 0
  );

  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Stop the page behind the overlay from scrolling under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save your card"
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/95 p-4"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Your SwishLink card"
        // Clicks on the image itself must not close the overlay — a long-press
        // save starts with a touch on the image.
        onClick={(e) => e.stopPropagation()}
        className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
      />
      <p className="px-4 text-center text-sm font-medium text-white">
        {isTouch
          ? "Press and hold the image to save it."
          : "Right-click the image and choose “Save image as…”"}
      </p>
      <button
        onClick={onClose}
        className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:border-white/40 hover:text-white"
      >
        Done
      </button>
    </div>
  );
}
