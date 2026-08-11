import { describe, expect, it } from "vitest";
import { assertDeploymentEnvironment, deploymentEnvironmentIssues } from "@/lib/environment";

const validEnvironment = {
  VERCEL_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://project-ref.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-key",
};

describe("deployment environment", () => {
  it("accepts a complete production configuration", () => {
    expect(deploymentEnvironmentIssues(validEnvironment)).toEqual([]);
    expect(() => assertDeploymentEnvironment(validEnvironment)).not.toThrow();
  });

  it("fails a deployment when a required variable is missing", () => {
    const environment = { ...validEnvironment, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" };
    expect(() => assertDeploymentEnvironment(environment)).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("rejects a malformed Supabase URL", () => {
    expect(deploymentEnvironmentIssues({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.com",
    })).toContain("NEXT_PUBLIC_SUPABASE_URL must be an https://*.supabase.co URL");
  });

  it("does not require deployment credentials for ordinary unit tests", () => {
    expect(() => assertDeploymentEnvironment({ NODE_ENV: "test" })).not.toThrow();
  });
});
