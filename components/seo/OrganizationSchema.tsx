import { absoluteUrl, siteName } from "@/lib/seo";

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${absoluteUrl() }#organization`,
    name: siteName,
    url: absoluteUrl(),
    logo: absoluteUrl("/images/logo.png"),
    image: absoluteUrl("/og-image.svg"),
    email: "info@dailyredsea.com",
    telephone: "+201004933150",
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
      telephone: "+201004933150",
      contactType: "customer service",
      availableLanguage: ["English", "Arabic", "German", "Russian", "Polish", "Chinese"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  );
}
