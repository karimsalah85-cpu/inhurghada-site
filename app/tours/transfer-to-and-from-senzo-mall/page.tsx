import { permanentRedirect } from "next/navigation";

// Retains the original public URL while preventing duplicate Senzo content.
export default function LegacySenzoMallTransferPage() {
  permanentRedirect("/tours/senzo-transfer");
}
