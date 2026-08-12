import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202608120001_media_asset_governance.sql", "utf8");
const collectionRoute = readFileSync("app/api/admin/control-center/route.ts", "utf8");
const recordRoute = readFileSync("app/api/admin/control-center/[resource]/[id]/route.ts", "utf8");

describe("media governance migration contract", () => {
  it("is additive and preserves legacy media URL columns", () => {
    expect(migration).toMatch(/alter table public\.media_assets\s+add column if not exists source_url/i);
    expect(migration).not.toMatch(/\b(drop table|truncate|delete from|alter column|rename column)\b/i);
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
});
