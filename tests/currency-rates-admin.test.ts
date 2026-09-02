import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const settingsContext = readFileSync("components/settings/SiteSettingsContext.tsx", "utf8");
const collectionRoute = readFileSync("app/api/admin/control-center/route.ts", "utf8");
const recordRoute = readFileSync("app/api/admin/control-center/[resource]/[id]/route.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260902132436_remove_currency_rates_setting.sql", "utf8");

describe("automatic currency rates", () => {
  it("does not read the obsolete admin currency-rate setting", () => {
    expect(settingsContext).not.toContain("publicSettings.currency_rates");
  });

  it("hides and rejects currency_rates in the admin API", () => {
    expect(collectionRoute).toContain('.neq("key", "currency_rates")');
    expect(collectionRoute).toContain('key === "currency_rates"');
    expect(recordRoute.match(/id === "currency_rates"/g)).toHaveLength(2);
  });

  it("removes the obsolete database record", () => {
    expect(migration).toContain("delete from public.site_settings");
    expect(migration).toContain("where key = 'currency_rates'");
  });
});
