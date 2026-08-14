import { ToursPage, metadata } from "@/components/pages/ToursPage";

export { metadata };

export default function Page(props: { searchParams?: Promise<{ search?: string; destination?: string }> }) {
  return <ToursPage {...props} />;
}
