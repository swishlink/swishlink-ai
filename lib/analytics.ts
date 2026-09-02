import { SupabaseClient } from "@supabase/supabase-js";

// Note for anyone querying the events table: rows written before 2026-09-01
// use "card_downloaded" for what is now "card_shared". The card used to be a
// file download; it is now a native share-sheet handoff. Historical rows were
// left untouched, so a full-history funnel needs both values.
export type EventType =
  | "card_viewed"
  | "card_shared"
  | "link_copied"
  | "share_clicked";

export async function trackEvent(
  supabase: SupabaseClient,
  eventType: EventType,
  userId: string,
  videoId?: string
) {
  try {
    const { error } = await supabase.from("events").insert({
      user_id: userId,
      event_type: eventType,
      video_id: videoId ?? null,
    });
    // supabase-js reports database errors in the response rather than
    // throwing, so without this a rejected row — a new event_type the table
    // won't accept, say — would vanish with no trace and quietly flatline the
    // metric. Still never blocks the UI; it just stops being invisible.
    if (error) {
      console.warn(`trackEvent(${eventType}) failed:`, error.message);
    }
  } catch (err) {
    console.warn(`trackEvent(${eventType}) threw:`, err);
  }
}
