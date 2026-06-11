import { SupabaseClient } from "@supabase/supabase-js";

export type EventType =
  | "card_viewed"
  | "card_downloaded"
  | "link_copied"
  | "share_clicked";

export async function trackEvent(
  supabase: SupabaseClient,
  eventType: EventType,
  userId: string,
  videoId?: string
) {
  try {
    await supabase.from("events").insert({
      user_id: userId,
      event_type: eventType,
      video_id: videoId ?? null,
    });
  } catch {
    // Non-critical — never block the UI
  }
}
