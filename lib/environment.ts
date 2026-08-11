const deploymentRequiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

type Environment = Record<string, string | undefined>;

export function deploymentEnvironmentIssues(environment: Environment) {
  const issues: string[] = [];

  for (const name of deploymentRequiredVariables) {
    if (!environment[name]?.trim()) issues.push(`Missing ${name}`);
  }

  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
        issues.push("NEXT_PUBLIC_SUPABASE_URL must be an https://*.supabase.co URL");
      }
    } catch {
      issues.push("NEXT_PUBLIC_SUPABASE_URL must be a valid URL");
    }
  }

  return issues;
}

export function assertDeploymentEnvironment(environment: Environment) {
  if (!environment.VERCEL_ENV) return;
  const issues = deploymentEnvironmentIssues(environment);
  if (issues.length) {
    throw new Error(`Deployment configuration is invalid:\n- ${issues.join("\n- ")}`);
  }
}

export { deploymentRequiredVariables };
