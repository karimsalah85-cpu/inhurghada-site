"use client";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
export default function SiteAnnouncement(){const{setting}=useSiteSettings();const text=setting<string>("announcement","");const active=setting<boolean>("announcement_active",false);if(!active||!text)return null;return <div className="bg-amber-300 px-4 py-2 text-center text-sm font-bold text-amber-950">{text}</div>}
