import Stripe from 'stripe';
import { config } from './env';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});
