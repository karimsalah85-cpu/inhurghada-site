import type { Metadata } from "next";

export const siteUrl = "https://dailyredsea.com";
export const siteName = "Daily Red Sea";
export const defaultDescription =
  "Book Hurghada tours, Red Sea boat trips, diving experiences, desert adventures, and private transfers with local support.";
export const defaultSocialImage = "/og-image.svg";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  image = defaultSocialImage,
  noIndex = false,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      siteName,
      locale: "en_US",
      type: "website",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
