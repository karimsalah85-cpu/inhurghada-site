import { absoluteUrl, siteName } from "@/lib/seo";

export default function OrganizationSchema() {
  const organizationId = `${absoluteUrl()}#organization`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "Organization"],
        "@id": organizationId,
        name: siteName,
        url: absoluteUrl(),
        logo: absoluteUrl("/images/logo.png"),
        image: absoluteUrl("/og-image.svg"),
        email: "info@dailyredsea.com",
        telephone: "+201030809150",
        sameAs: [
          "https://www.facebook.com/profile.php?id=61592247695069",
          "https://www.instagram.com/dailyredsea.com7/",
        ],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hurghada",
          addressCountry: "EG",
        },
        areaServed: {
          "@type": "City",
          name: "Hurghada",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+201030809150",
          contactType: "customer service",
          availableLanguage: ["English", "Arabic", "German", "Russian", "Polish", "Chinese"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl()}#website`,
        url: absoluteUrl(),
        name: siteName,
        description: "Hurghada tours, Red Sea excursions, diving, desert safaris and private transfers.",
        inLanguage: ["en", "ar", "de", "ru", "pl", "zh"],
        publisher: { "@id": organizationId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  );
}
