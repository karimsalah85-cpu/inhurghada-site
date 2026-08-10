"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent, type AnalyticsEventName, type AnalyticsEventData } from "@/lib/analytics";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "onClick"> & {
  event: Extract<AnalyticsEventName, "whatsapp_click" | "google_review_click" | "phone_click" | "email_click">;
  eventData?: AnalyticsEventData;
  children: ReactNode;
};

export default function TrackedExternalLink({ event, eventData, children, ...props }: Props) {
  return <a {...props} onClick={() => trackEvent(event, eventData)}>{children}</a>;
}
