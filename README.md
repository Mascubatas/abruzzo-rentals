# Abruzzo Rentals

A lightweight short-term rental site for properties in Parco Nazionale d'Abruzzo, Lazio e Molise. Plain HTML/CSS/JS frontend (no build step) + a minimal Express backend, with Stripe Checkout for payments.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Add your Stripe keys to `.env` (see `.env.example` for the format):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET` (optional, only needed if you add webhook handling)
3. Start the server:
   ```
   npm start
   ```
4. Open http://localhost:3000

## Notes

- Properties are stored in [data/properties.json](data/properties.json). Edit that file to add/remove listings.
- Booking "Pay with card" creates a Stripe Checkout Session and redirects to Stripe's hosted payment page — no card data ever touches this server.
- `.env` is gitignored; never commit real API keys.
