import type { Tour } from "@/data/tours";

export type SiteContent = { tours: Tour[]; settings: Record<string, unknown> };

let inFlight: Promise<SiteContent | null> | null = null;

/**
 * Client-side reader for `/api/site-content`. The homepage (live tour prices)
 * and SiteSettingsContext (public settings) both need this on first paint;
 * memoising the promise means the payload is fetched and parsed once per page
 * load instead of once per caller. The request is intentionally not abortable
 * from any single caller so an unmounting consumer cannot cancel it for the
 * others.
 */
export function fetchSiteContent(): Promise<SiteContent | null> {
  if (!inFlight) {
    inFlight = fetch("/api/site-content")
      .then((response) => (response.ok ? (response.json() as Promise<SiteContent>) : null))
      .catch(() => null)
      .finally(() => {
        // Allow a later navigation / retry to fetch fresh data.
        setTimeout(() => {
          inFlight = null;
        }, 0);
      });
  }
  return inFlight;
}
