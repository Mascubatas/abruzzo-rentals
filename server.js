require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

// Stripe is initialized lazily so the app still runs before a real key is added.
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/properties', async (req, res) => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('name');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data.map((property) => ({
    id: property.id,
    name: property.name,
    village: property.village,
    description: property.description,
    guests: property.guests,
    pricePerNight: Number(property.price_per_night),
    image: property.image
  })));
});

app.get('/api/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// Creates a Stripe Checkout session for a given property + number of nights.
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env.' });
  }

  const { propertyId, nights } = req.body;
  const nightsCount = Number(nights) || 1;

  if (!propertyId || nightsCount < 1) {
    return res.status(400).json({ error: 'A valid property and number of nights are required' });
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (propertyError || !property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  try {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        property_id: property.id,
        nights: nightsCount,
        status: 'pending'
      })
      .select('id')
      .single();

    if (bookingError) {
      throw bookingError;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(Number(property.price_per_night) * 100),
            product_data: {
              name: `${property.name} (${property.village})`,
              description: `${nightsCount} night(s) - Parco Nazionale d'Abruzzo`
            }
          },
          quantity: nightsCount
        }
      ],
      success_url: `${PUBLIC_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_URL}/index.html`,
      metadata: { bookingId: booking.id }
    });

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking.id);

    if (updateError) {
      throw updateError;
    }

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Abruzzo Rentals running at http://localhost:${PORT}`);
});
