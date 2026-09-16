import HomePage from "@/components/home/HomePage";
import { getLiveTours } from "@/lib/live-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <HomePage initialTours={await getLiveTours()} />;
}
