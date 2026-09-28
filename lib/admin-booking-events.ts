const bookingChangeEvent = "daily-red-sea:bookings-changed";
const bookingChangeStorageKey = "daily-red-sea:bookings-changed-at";

export function notifyAdminBookingsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(bookingChangeEvent));
  try {
    window.localStorage.setItem(bookingChangeStorageKey, String(Date.now()));
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

let refreshedForChangeAt = 0;

function lastBookingChangeAt() {
  try {
    return Number(window.localStorage.getItem(bookingChangeStorageKey)) || 0;
  } catch {
    return 0;
  }
}

// `dataLoadedAt` is when the page's booking data was read. Back/forward
// navigation reuses that cached page, so refresh it if bookings changed since.
export function subscribeToAdminBookingChanges(listener: () => void, dataLoadedAt?: number) {
  if (typeof window === "undefined") return () => undefined;
  const changedAt = lastBookingChangeAt();
  // Refresh once per change, so server/browser clock skew cannot loop refreshes.
  if (dataLoadedAt && changedAt > dataLoadedAt && changedAt !== refreshedForChangeAt) {
    refreshedForChangeAt = changedAt;
    listener();
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === bookingChangeStorageKey) listener();
  };
  window.addEventListener(bookingChangeEvent, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(bookingChangeEvent, listener);
    window.removeEventListener("storage", onStorage);
  };
}
