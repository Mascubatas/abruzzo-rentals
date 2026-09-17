# Abruzzo Rentals

A lightweight short-term rental site for properties in Parco Nazionale d'Abruzzo, Lazio e Molise. Plain HTML/CSS/JS frontend (no build step) + a minimal Express backend, with Stripe Checkout for payments.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Add your Stripe and Supabase keys to `.env` (see `.env.example` for the format):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Start the server:
   ```
   npm start
   ```
4. Open http://localhost:3000

## Notes

- Properties and bookings are stored in Supabase tables named `properties` and `bookings`.
- Booking "Pay with card" creates a Stripe Checkout Session and redirects to Stripe's hosted payment page — no card data ever touches this server.
- Configure a Stripe webhook for `/api/stripe-webhook` and set `STRIPE_WEBHOOK_SECRET` so completed test payments update bookings to `paid`.
- `.env` is gitignored; never commit real API keys.
