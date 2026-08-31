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

export function subscribeToAdminBookingChanges(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
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
