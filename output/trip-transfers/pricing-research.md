# Hurghada excursion sedan transfers — 17 October 2026

Authorized scope: research taxi prices and add a per-car round-trip sedan supplement for customers staying in El Gouna or Makadi Bay and joining Hurghada excursions.

## Published benchmarks checked

- Albatross Taxi: Hurghada City / Sheraton Road → El Gouna from EUR 14 per car, with sedan capacity up to three passengers. https://www.albatross-taxi.com/
- Sinai Taxi: Makadi → Hurghada economy sedan, three passengers, USD 25–35; the page does not explicitly establish whether this is one-way or return, so do not treat it as a confirmed round-trip quote. https://blog.sinaitaxi.com/2025/05/24/makadi-to-hurghada-transfer-guide/
- HRG Driver: family sedan destination list from Hurghada lists El Gouna and Makadi Bay at EUR 10; leg direction and waiting terms are not explicit. https://hrgdriver.com/
- Private Taxi Hurghada: airport-route sedan benchmarks EUR 25 for El Gouna and Makadi Bay, up to three passengers. These are airport benchmarks, not excursion contracts. https://privatetaxihurghada.com/hurghada-taxi-prices/

## Implemented retail policy

EUR 40 per sedan for the complete hotel ↔ Hurghada excursion return journey, for either El Gouna or Makadi Bay. This is our selected selling rate informed by the published market range; no operator was contacted and no supplier price was contracted. No full-day waiting or extra stops are promised. Pickup and return times are coordinated by WhatsApp.

Up to three passengers per sedan, including children and infants. More passengers allocate ceil(passengers / 3) sedans; fee is per car, not per guest. Each separately booked excursion gets its own return transfer charge. USD catalogue tours use the existing fixed catalogue EUR conversion (eurToUsd); displayed currencies follow the existing site exchange-rate selector.

Unpriced existing areas retain a clearly disclosed manual-quote request, outside the trip total. Saudi, Marsa Alam, and meeting-point products do not gain the new remote-pickup option.

## Live baseline

The public site returned HTTP 200. Orange Bay advertises Hurghada hotel pickup; the ordinary-trip booking code previously lacked a transfer option. Claude Code completed an independent read-only flow review and confirmed the cart request was dropped from server-generated booking notes. The change now builds transfer notes server-side and keeps them after the Customer note marker to preserve historical trip parsing.

## Release state

Local implementation in isolated feature/trip-transfers-20261017 checkout. No production deployment, production booking, supplier contact, or database migration performed.
