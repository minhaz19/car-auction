import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51MockSecretKeyForDevelopmentOnly12345';

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
});

export const STRIPE_PUBLISHABLE_KEY =
  process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51MockPublishableKeyForDevelopmentOnly12345';
