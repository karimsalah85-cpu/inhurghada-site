import {
  DestinationPage,
  generateMetadata,
  generateStaticParams,
} from "@/components/pages/destinations/DestinationPage";

export { generateMetadata, generateStaticParams };

export default function Page(props: { params: Promise<{ destination: string }> }) {
  return <DestinationPage {...props} />;
}
