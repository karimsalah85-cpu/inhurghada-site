import { Fragment } from "react";
import Link from "next/link";
import { siteUrl } from "@/lib/seo";

// Article imports are plain text with inline Markdown links. Render anchors
// without accepting raw HTML or executable URL schemes from the publisher.
export default function BlogInlineText({ text }: { text: string }) {
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\(([^\s)]+)\)/g)) {
    parts.push(text.slice(cursor, match.index));
    const [, label, rawHref] = match;
    let href: string | undefined;
    try {
      const url = new URL(rawHref, siteUrl);
      if (url.protocol === "https:" || url.protocol === "http:") {
        href = url.origin === siteUrl ? `${url.pathname}${url.search}${url.hash}` : url.href;
      }
    } catch { /* Invalid publisher links remain readable text. */ }
    parts.push(href ? <Link key={match.index} href={href} className="font-semibold text-ocean-dark underline underline-offset-4">{label}</Link> : label);
    cursor = match.index! + match[0].length;
  }
  parts.push(text.slice(cursor));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}
