"use client";

import { useEffect, useState } from "react";

/** Preview-only device comparison, deliberately in normal page flow. */
export default function SafariToolbarPreview() {
  const [gap, setGap] = useState("0");
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--safari-test-gap", `${gap}px`);
    root.dataset.safariToolbarTest = "true";
    return () => {
      root.style.removeProperty("--safari-test-gap");
      delete root.dataset.safariToolbarTest;
    };
  }, [gap]);
  return (
    <aside className="mx-4 my-6 rounded-2xl border border-line bg-white p-4 text-ink" aria-label="Safari toolbar comparison">
      <h2 className="text-lg font-bold">Safari glass comparison</h2>
      <p className="mt-2 text-sm">Keep the Daily Red Sea toolbar. Change its spacing, then scroll until a photograph sits behind Safari’s address bar. Compare at the same scroll position with Safari’s controls expanded.</p>
      <label className="mt-3 block text-sm font-semibold">
        Space beneath our toolbar
        <select value={gap} onChange={(event) => setGap(event.target.value)} className="mt-1 block min-h-12 w-full rounded-lg border border-line bg-white px-3">
          <option value="0">A — At the bottom edge</option>
          <option value="24">B — 24px above the edge</option>
          <option value="48">C — 48px above the edge</option>
        </select>
      </label>
      <p className="mt-3 text-sm">This preview keeps the toolbar visible while scrolling. Look for real photo detail through Safari’s own address bar, not just a change in colour. These are test positions, not a final layout.</p>
    </aside>
  );
}
