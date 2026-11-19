import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TransferQuotation from "@/components/admin/TransferQuotation";

describe("transfer quotation form", () => {
  it("asks for a price on a pending request and offers to email the customer", () => {
    const html = renderToStaticMarkup(<TransferQuotation bookingId="b1" currency="USD" amount={0} pending customerEmail="guest@example.com" hasPhone />);
    expect(html).toContain("Quotation needed");
    expect(html).toContain("Total price (USD)");
    expect(html).toContain("guest@example.com");
    expect(html).toContain("Save price and send quotation");
  });

  it("shows the current quote and explains a missing email", () => {
    const html = renderToStaticMarkup(<TransferQuotation bookingId="b1" currency="EUR" amount={120} pending={false} customerEmail={null} hasPhone />);
    expect(html).toContain("Quoted at €120.00");
    expect(html).toContain('value="120"');
    expect(html).toContain("No email address on this booking");
    expect(html).toContain("Save price");
  });
});
