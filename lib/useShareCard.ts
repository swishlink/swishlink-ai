"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renderShareCardFile } from "@/lib/generateCard";
import { SITE_DOMAIN } from "@/lib/siteUrl";
import type { PlayerProfile } from "@/lib/playerProfile";

// Why this exists at all: an `<a download>` blob URL does not reach the iOS
// photo library. Safari routes it to Files, so players could never post the
// card to a story — which is the whole point of the card. The native share
// sheet is the only path that offers "Save Image", Messages and Instagram.
//
// The awkward shape of this hook is entirely about ONE iOS constraint:
// navigator.share() must be called while the tap's user activation is still
// live. Rendering a 1080x1920 canvas and encoding a PNG takes long enough that
// awaiting it inside the handler loses the activation and iOS throws
// NotAllowedError. So the card is rendered ahead of the tap and parked in a
// ref, and `share()` is a plain synchronous function with no `await` ahead of
// the navigator.share() call.

export type ShareCardStatus = "preparing" | "ready" | "error";

type UseShareCard = {
  status: ShareCardStatus;
  /** Call directly from an onClick. Must not be awaited or wrapped in async. */
  share: () => void;
  /** Attach to the share button so the card renders once it nears the screen. */
  observeShareButton: (node: HTMLElement | null) => void;
  /** Belt-and-braces prime on pointer intent, in case the observer missed. */
  prime: () => void;
  /** Object URL for the fallback viewer; null when it should be closed. */
  fallbackUrl: string | null;
  closeFallback: () => void;
};

export function useShareCard(
  profile: PlayerProfile,
  username: string | undefined
): UseShareCard {
  const [status, setStatus] = useState<ShareCardStatus>("preparing");
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  // The dashboard clip library mounts one card per saved clip. Rendering all
  // of them up front would burn ~220KB and a full PNG encode each on page
  // load, which is exactly the wrong trade on a mid-range phone. So the render
  // is deferred until a card nears the viewport — still comfortably ahead of
  // any tap, which is all the iOS constraint actually requires.
  const [primed, setPrimed] = useState(false);

  // Held in a ref, not state: `share()` reads it synchronously during the tap.
  const fileRef = useRef<File | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    archetype,
    nbaComparison,
    comparisonReason,
    confidence,
    ratings: { threePoint, finishing, handles },
  } = profile;

  useEffect(() => {
    if (!username || !primed) return;

    let cancelled = false;

    renderShareCardFile(profile, username).then(
      (file) => {
        if (cancelled) return;
        fileRef.current = file;
        setStatus("ready");
      },
      () => {
        if (cancelled) return;
        setStatus("error");
      }
    );

    return () => {
      cancelled = true;
    };
    // Keyed off the fields the card actually draws: parents rebuild `profile`
    // as a fresh object on each render, so depending on its identity would
    // re-render the canvas continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    username,
    primed,
    archetype,
    nbaComparison,
    comparisonReason,
    confidence,
    threePoint,
    finishing,
    handles,
  ]);

  const prime = useCallback(() => setPrimed(true), []);

  // Ref callback rather than an effect: it re-attaches automatically if the
  // button remounts, and tears the observer down when it unmounts.
  const observeShareButton = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setPrimed(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setPrimed(true);
        io.disconnect();
        observerRef.current = null;
      },
      // Start rendering a screenful before the button is actually reachable,
      // so the file is ready by the time a thumb gets there.
      { rootMargin: "400px" }
    );
    io.observe(node);
    observerRef.current = io;
  }, []);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  // Revoke the fallback object URL only on unmount. Revoking on close would
  // break a long-press save still in flight.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const openFallback = useCallback(() => {
    const file = fileRef.current;
    if (!file) return;
    if (!objectUrlRef.current) {
      objectUrlRef.current = URL.createObjectURL(file);
    }
    setFallbackUrl(objectUrlRef.current);
  }, []);

  const closeFallback = useCallback(() => setFallbackUrl(null), []);

  const share = useCallback(() => {
    const file = fileRef.current;
    if (!file) return;

    // Everything from here to navigator.share() is synchronous on purpose.
    const canNativeShare =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      // canShare({ files }) is the only reliable signal — navigator.share
      // exists on some browsers that then reject file payloads.
      navigator.canShare?.({ files: [file] }) === true;

    if (!canNativeShare) {
      openFallback();
      return;
    }

    navigator
      .share({
        files: [file],
        title: "My SwishLink card",
        text: `Know your game. ${SITE_DOMAIN}`,
      })
      .catch((err: unknown) => {
        // The user dismissing the sheet is a normal outcome, not a failure —
        // dropping them into the fallback viewer would be obnoxious.
        if ((err as DOMException)?.name === "AbortError") return;
        openFallback();
      });
  }, [openFallback]);

  return { status, share, observeShareButton, prime, fallbackUrl, closeFallback };
}
