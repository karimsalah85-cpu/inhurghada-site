import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mergeTourMedia, type MediaAssetRow, type MediaLocalizationRow, type MediaUsageRow } from "@/lib/live-content";
import type { Tour } from "@/data/tours";

const migration = readFileSync("supabase/migrations/202608120001_media_asset_governance.sql", "utf8");
const collectionRoute = readFileSync("app/api/admin/control-center/route.ts", "utf8");
const recordRoute = readFileSync("app/api/admin/control-center/[resource]/[id]/route.ts", "utf8");

describe("media governance migration contract", () => {
  it("is additive and preserves legacy media URL columns", () => {
    expect(migration).toMatch(/alter table public\.media_assets\s+add column if not exists source_url/i);
    expect(migration).not.toMatch(/\b(drop table|truncate|alter column|rename column)\b/i);
    expect(migration).not.toMatch(/delete from public\.media_assets/i);
    expect(migration).not.toMatch(/\b(storage_path|public_url)\b/);
  });

  it("uses safe defaults and constrained governance values", () => {
    expect(migration).toMatch(/rights_status text not null default 'unverified'/i);
    expect(migration).toMatch(/authenticity text not null default 'unknown'/i);
    expect(migration).toMatch(/focal_x numeric\(5,4\) not null default 0\.5/i);
    expect(migration).toMatch(/focal_y numeric\(5,4\) not null default 0\.5/i);
    expect(migration).toMatch(/focal_x between 0 and 1 and focal_y between 0 and 1/i);
  });

  it("keeps localization and usage references relationally valid", () => {
    expect(migration).toMatch(/asset_id uuid not null references public\.media_assets\(id\) on delete cascade/i);
    expect(migration).toMatch(/asset_id uuid not null references public\.media_assets\(id\) on delete restrict/i);
    expect(migration).toMatch(/unique \(asset_id, owner_type, owner_key, role, sort_order\)/i);
    expect(migration).toMatch(/create index if not exists media_usages_asset_id_idx/i);
    expect(migration).toMatch(/enable row level security/gi);
  });
});

describe("media administration safety contract", () => {
  it("accepts the governed metadata fields and validates focal points", () => {
    for (const field of ["source_url", "creator", "license_type", "license_url", "attribution_text", "attribution_required", "rights_status", "authenticity", "focal_x", "focal_y"]) {
      expect(collectionRoute).toContain(field);
      expect(recordRoute).toContain(field);
    }
    expect(collectionRoute).toContain("Focal points must be between 0 and 1.");
  });

  it("blocks all control-center mutations in Vercel previews", () => {
    expect(collectionRoute).toContain('process.env.VERCEL_ENV === "preview"');
    expect(recordRoute).toContain('process.env.VERCEL_ENV === "preview"');
    expect(collectionRoute).toMatch(/export async function POST[\s\S]*?previewMutationBlocked\(\)/);
    expect(recordRoute).toMatch(/export async function PATCH[\s\S]*?previewMutationBlocked\(\)/);
    expect(recordRoute).toMatch(/export async function DELETE[\s\S]*?previewMutationBlocked\(\)/);
  });

  it("fails closed when explicit or legacy usage checks fail", () => {
    expect(recordRoute).toContain("Image usage could not be verified, so deletion was blocked.");
    expect(recordRoute).toContain("Legacy image usage could not be verified, so deletion was blocked.");
    expect(recordRoute).toContain("This image is still in use and cannot be deleted.");
  });

  it("replaces localization and usage collections through one database transaction", () => {
    expect(migration).toContain("replace_media_governance");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("admin_has_permission('content')");
    expect(recordRoute).toContain('supabase.rpc("replace_media_governance"');
  });
});

describe("public curated media", () => {
  it("uses localized alt fallback, stable ordering, and safe focal defaults", () => {
    const tour = { slug: "synthetic-tour", title: "Synthetic tour", image: "/legacy.jpg", galleryImages: ["/legacy-gallery.jpg"] } as Tour;
    const assets: MediaAssetRow[] = [
      { id: "featured", public_url: "/featured.jpg", storage_path: "/featured.jpg", alt_text: "Legacy featured alt", focal_x: "0.25", focal_y: "invalid" },
      { id: "gallery-a", public_url: "/a.jpg", storage_path: "/a.jpg", alt_text: null, focal_x: 2, focal_y: -1 },
      { id: "gallery-b", public_url: null, storage_path: "/b.jpg", alt_text: "Existing B alt", focal_x: 0.7, focal_y: 0.8 },
    ];
    const usages: MediaUsageRow[] = [
      { asset_id: "featured", owner_key: tour.slug, role: "featured", sort_order: 0 },
      { asset_id: "gallery-a", owner_key: tour.slug, role: "gallery", sort_order: 2 },
      { asset_id: "gallery-b", owner_key: tour.slug, role: "gallery", sort_order: 1 },
    ];
    const localizations: MediaLocalizationRow[] = [
      { asset_id: "featured", locale: "en", alt_text: "English featured alt" },
      { asset_id: "featured", locale: "ar", alt_text: "وصف عربي" },
      { asset_id: "gallery-a", locale: "en", alt_text: "English A alt" },
    ];
    const [merged] = mergeTourMedia([tour], usages, assets, localizations, "ar");
    expect(merged.image).toBe("/featured.jpg");
    expect(merged.imageAlt).toBe("وصف عربي");
    expect(merged.imageFocalPoint).toEqual({ x: 0.25, y: 0.5 });
    expect(merged.galleryImages).toEqual(["/b.jpg", "/a.jpg"]);
    expect(merged.galleryImageAlts).toEqual(["Existing B alt", "English A alt"]);
    expect(merged.galleryImageFocalPoints).toEqual([{ x: 0.7, y: 0.8 }, { x: 0.5, y: 0.5 }]);
  });

  it("preserves static media when no authoritative assignments exist", () => {
    const tour = { slug: "legacy", title: "Legacy", image: "/legacy.jpg", galleryImages: ["/gallery.jpg"] } as Tour;
    expect(mergeTourMedia([tour], [], [], [], "de")).toEqual([tour]);
  });
});
