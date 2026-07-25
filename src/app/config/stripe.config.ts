import Stripe from 'stripe';
import { config } from './env';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2026-06-24.dahlia',
});