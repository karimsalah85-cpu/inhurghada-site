# Analytics setup

The application does not send optional analytics or advertising requests until a visitor chooses consent in the cookie banner. Leave an ID unset to disable that integration.

Add these values in `.env.local` for local testing and in Vercel **Project → Settings → Environment Variables** for Production, Preview, and Development as appropriate:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_CONVERSIONS_API_ACCESS_TOKEN=meta_conversions_api_token
META_GRAPH_API_VERSION=vXX.X
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-123456789
NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION_LABEL=booking_label
NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_CONVERSION_LABEL=whatsapp_label
NEXT_PUBLIC_GOOGLE_ADS_PHONE_CONVERSION_LABEL=phone_label
NEXT_PUBLIC_GOOGLE_ADS_EMAIL_CONVERSION_LABEL=email_label
```

## Google Ads admin reporting

The protected admin dashboard can retrieve live campaign reporting separately from browser conversion tracking. Add these server-only variables in Vercel; never prefix them with `NEXT_PUBLIC_`:

Daily Red Sea's developer token has Google Ads API Basic Access under the **Advertiser** company type and **internal reporting** tool type. The integration is therefore limited to employees or an authorized consultant and to reporting operations only. Do not add API features that create, edit, pause, remove, or publish campaigns. Basic Access is limited to 15,000 operations per day.

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890
GOOGLE_ADS_CLIENT_ID=oauth_client_id
GOOGLE_ADS_CLIENT_SECRET=oauth_client_secret
GOOGLE_ADS_REFRESH_TOKEN=oauth_refresh_token
GOOGLE_ADS_API_VERSION=v25
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
```

OAuth is recommended when Google Cloud organization policy disables persistent service-account keys. As an alternative, configure `GOOGLE_ADS_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_ADS_SERVICE_ACCOUNT_PRIVATE_KEY`, then grant that service-account email access to Google Ads. `GOOGLE_ADS_LOGIN_CUSTOMER_ID` is the manager account ID. The admin endpoint remains unavailable unless the developer token, customer ID, and one complete authentication method are configured.

The visitor dashboard uses the same OAuth client and refresh token. Enable the Google Analytics Data API, add `https://www.googleapis.com/auth/analytics.readonly` to the OAuth consent screen, regenerate the refresh token with both the Analytics and Ads scopes, and set the numeric GA4 property ID as `GOOGLE_ANALYTICS_PROPERTY_ID`.

Do not expose `META_CONVERSIONS_API_ACCESS_TOKEN` in any `NEXT_PUBLIC_` variable. Set `META_GRAPH_API_VERSION` to the active version shown in Meta Events Manager when the token is created.

## Provider configuration

1. Create a GA4 Web data stream for `https://dailyredsea.com` and add its Measurement ID.
2. Create a GTM Web container and add its Container ID. Use the website events below as Custom Event triggers. Do not also create a GA4 Configuration tag in GTM if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, otherwise GA4 page and event data would be duplicated.
3. Create a Meta Pixel and a Conversions API access token in Events Manager. The browser Pixel and `/api/analytics/meta` use the same event ID for browser/server deduplication. Add the active Meta Graph API version as `META_GRAPH_API_VERSION`.
4. In Google Ads, create website conversions and copy each event label. The app emits Google Ads `conversion` events only when the matching label and consent are present.
5. Configure GTM tags with consent checks: GA4 requires analytics consent; Meta/Google Ads tags require marketing consent. The application sends Google Consent Mode v2 values for analytics storage, ad storage, ad user data, and ad personalization.

## Event map

| App event | Trigger | Meta event | Suggested Google Ads conversion |
| --- | --- | --- | --- |
| `page_view` | each client-side route view after analytics consent | Pixel base `PageView` | none |
| `tour_view` | tour detail page | `ViewContent` | optional |
| `search` | home tour search | none | none |
| `booking_start` | booking navigation, customer moves to details, or request submission | `InitiateCheckout` (existing mapping) | none recommended for bidding |
| `checkout_started` | validated tour selection moves to checkout; also emits GA4 `begin_checkout` | none | optional |
| `booking_complete` | booking API responds successfully; also emits GA4 `generate_lead` | `Lead` | booking lead conversion |
| `whatsapp_click` | WhatsApp CTA | `Contact` | WhatsApp conversion |
| `phone_click` | call CTA | `Contact` | phone conversion |
| `email_click` | email CTA | `Contact` | email conversion |

Cash-on-arrival requests are intentionally sent as leads, not purchases. The browser retains `booking_complete` for internal reports and also emits GA4 `generate_lead`. Its value describes the requested booking, not collected revenue. Never sum both events as separate leads. The actual tour checkout transition emits `checkout_started` plus GA4 `begin_checkout`; `booking_start` also occurs on navigation clicks and must not be mapped to GA4 checkout entry.

No browser `purchase` is emitted on request submission. A paid-sale integration must be implemented separately from trusted payment records, with transaction-ID deduplication and actual amount/currency; marking a booking paid in admin does not by itself prove a purchase event was delivered. Before deployment, coordinate GA4/Google Ads mappings: remove any external rule that converts `booking_complete` into `purchase`, use one lead action for bidding, and verify the selected primary conversion. Existing purchase imports will not receive these lead events automatically. Review the legacy `/cart/cart` action definition; the current cart is `/cart` and direct tour checkout is inline. Do not treat a cart page view as checkout completion.

## Validation

- Run `npx vitest run tests/booking-tracking.test.ts` to check lead semantics, checkout mapping, consent, Google Ads labels, and Meta browser/server event identity.
- In a test environment, check GA4 DebugView for `checkout_started` + `begin_checkout` when entering tour checkout, then `booking_complete` + `generate_lead` after a successful unpaid request. Verify no `purchase` event appears. A booking navigation click must not emit `begin_checkout`.
- Use Google Tag Assistant to verify the Consent Mode v2 state and prevent duplicate GA4 tags.
- Use Meta Events Manager Test Events to verify Pixel and Conversions API events deduplicate by `event_id`.
- Use Google Ads Tag Diagnostics to verify each configured click/booking conversion.
