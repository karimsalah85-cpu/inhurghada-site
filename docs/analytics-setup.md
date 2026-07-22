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
| `booking_start` | customer moves to booking details / submits transfer | `InitiateCheckout` | optional |
| `booking_complete` | booking API responds successfully | `Lead` | booking conversion |
| `whatsapp_click` | WhatsApp CTA | `Contact` | WhatsApp conversion |
| `phone_click` | call CTA | `Contact` | phone conversion |
| `email_click` | email CTA | `Contact` | email conversion |

Cash-on-arrival requests are intentionally sent as leads, not purchases. Mark a paid booking from the admin workflow only after payment is collected; do not configure `booking_complete` as a revenue purchase in Meta or Google Ads.

## Validation

- In GA4 DebugView, accept Analytics and check `page_view`, `tour_view`, `search`, `booking_start`, and `booking_complete`.
- Use Google Tag Assistant to verify the Consent Mode v2 state and prevent duplicate GA4 tags.
- Use Meta Events Manager Test Events to verify Pixel and Conversions API events deduplicate by `event_id`.
- Use Google Ads Tag Diagnostics to verify each configured click/booking conversion.
