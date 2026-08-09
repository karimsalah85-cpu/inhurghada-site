import { redirect } from "next/navigation";

export default async function AdminMarketingRedirect({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const requested = Number((await searchParams).range || 30);
  const range = [7, 30, 90].includes(requested) ? requested : 30;
  redirect(`/admin?range=${range}#analytics`);
}
