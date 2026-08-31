# Priority-tour conversion audit

Status legend: **implemented** is changed in this working tree; **already present** was visible in the current catalogue/live experience; **external** requires an account or publication step; **unverified** needs operational confirmation.

| Area | Orange Bay | Dolphin House Hurghada | Full-day diving | Desert safari | Marsa Mubarak |
| --- | --- | --- | --- | --- | --- |
| Exact direct URL | Already present | Already present | Already present | Already present | Already present |
| Price visible before request | Already present | Already present | Already present | Already present | Already present |
| Product-specific inclusions | Already present | Already present | Implemented/expanded | Implemented | Already present |
| Pickup explanation | Already present | Already present | Already present | Implemented | Already present |
| Wildlife/certification limitation | Not applicable | Already present | Implemented/expanded | Not applicable | Already present |
| Product-specific FAQ | Already present in English catalogue | Existing facts retained | Implemented | Implemented | Already present in all catalogue locales |
| Owned/action photography | Already present | Already present | Already present | Already present | Already present |
| Accurate Offer schema | Already present | Already present | Already present | Already present | Already present |
| Rating schema only with numeric evidence | Implemented globally | No synthetic rating emitted | No synthetic rating emitted | No synthetic rating emitted | No synthetic rating emitted |
| Google Business Profile activity link | External package prepared | External package prepared | External package prepared | External package prepared | External package prepared |
| Search ad group | Draft prepared | Draft prepared | Draft prepared | Draft prepared | Draft prepared |
| Local reel concept | Draft prepared | Draft prepared | Draft prepared | Draft prepared | Draft prepared |

## Important findings

- The live site already uses owned, action-led imagery, visible prices, pickup messaging, and direct booking. Replacing those components wholesale would add risk without clear benefit.
- Product-specific localized FAQs were being replaced by generic FAQs on non-English routes. The rendering logic now prefers localized catalogue FAQs when they exist and retains translated generic fallbacks otherwise.
- Static labels such as `New` are not emitted as review evidence. Aggregate-rating schema is now generated only when both the rating and review count are numeric and positive.
- The full-day diving page needed a clearer certification gate and equipment-price disclosure.
- The general desert safari entry had thin inclusions, preparation guidance, FAQs, and metadata compared with the other priority tours.

## Unverified operational items

- Do not publish Google Business Profile changes until the signed-in profile exposes the Activities editor and each landing page is accepted.
- Do not publish Google Ads changes without a final search-terms, location, budget, network, conversion-action, and policy review.
- Do not imply that Google Things to do advertising is available for Egypt or Saudi Arabia unless Google’s official availability list changes.
- Do not change tour prices, supplier relationships, cancellation promises, pickup zones, or wildlife probabilities without current operational confirmation.
