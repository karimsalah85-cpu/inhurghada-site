/** Existing $30 extras, expressed in the trip currency using the legacy catalogue EUR rate. */
export function optionalExtraPrice(usdPrice: number, currency: string = "USD") {
  return currency === "EUR" ? Math.round(usdPrice * 0.876691 * 100) / 100 : usdPrice;
}
