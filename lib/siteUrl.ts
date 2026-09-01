// Single source of truth for the public hostname. The share card and the
// profile footer always print the custom domain — that text is marketing and
// should never show a deployment URL.
export const SITE_DOMAIN = "swishlink.ai";

// Used for links people actually click (share captions, copy-link). Defaults
// to the custom domain; set NEXT_PUBLIC_SITE_URL to pin it somewhere else
// (e.g. back to the vercel.app deployment) if DNS isn't cut over yet.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${SITE_DOMAIN}`;
