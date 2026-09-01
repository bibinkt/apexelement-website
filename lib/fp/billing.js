// Stripe billing. Raw REST rather than the SDK — three endpoints do not justify
// the bundle, and this keeps the serverless cold start small.
//
// Everything degrades honestly when STRIPE_SECRET_KEY is absent: configured()
// returns false and the UI says billing is not switched on yet, rather than
// throwing a 500 at a shop owner trying to pay.

import { selectOne, update } from './db.js';
import { getSetting } from './settings.js';

const KEY = () => process.env.STRIPE_SECRET_KEY || '';

export function configured() {
  return !!KEY();
}

function site() {
  return process.env.FP_SITE_URL || 'https://frontlinepros.apexelement.ai';
}

async function stripe(path, { method = 'POST', form } = {}) {
  if (!configured()) throw new Error('STRIPE_SECRET_KEY not configured');
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const j = await res.json();
  if (!res.ok) {
    throw new Error(`stripe ${path}: ${j?.error?.message || res.status}`);
  }
  return j;
}

/** Reuse the customer if the shop already has one, so cards and history stay put. */
async function customerFor(shop) {
  if (shop.stripe_customer_id) return shop.stripe_customer_id;
  const c = await stripe('customers', {
    form: {
      phone: shop.owner_phone,
      name: shop.business_name,
      ...(shop.owner_email ? { email: shop.owner_email } : {}),
      'metadata[shop_id]': shop.id,
    },
  });
  await update('fp_shops', `id=eq.${shop.id}`, { stripe_customer_id: c.id });
  return c.id;
}

export async function startCheckout(shop) {
  const customer = await customerFor(shop);
  const pricing = await getSetting('pricing');

  // Inline price_data rather than a pre-created Stripe price. Same approach as
  // TasteMoji, and it means an admin can change the monthly figure in our own
  // settings without anyone touching the Stripe dashboard.
  const s = await stripe('checkout/sessions', {
    form: {
      mode: 'subscription',
      customer,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(Math.round(pricing.monthly_usd * 100)),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][price_data][product_data][name]': pricing.product_name,
      success_url: `${site()}/dashboard?welcome=1`,
      cancel_url: `${site()}/subscribe?cancelled=1`,
      allow_promotion_codes: 'true',
      'subscription_data[metadata][shop_id]': shop.id,
      'metadata[shop_id]': shop.id,
    },
  });
  return s.url;
}

/**
 * Cancel at period end rather than immediately — they have paid for the month
 * and taking the service away the same second is a bad way to be left.
 */
export async function cancelSubscription(shop) {
  if (!shop.stripe_subscription_id) return { ok: false, error: 'No active subscription.' };
  const s = await stripe(`subscriptions/${shop.stripe_subscription_id}`, {
    form: { cancel_at_period_end: 'true' },
  });
  await update('fp_shops', `id=eq.${shop.id}`, {
    subscription_status: 'cancelling',
    subscription_ends_at: s.current_period_end
      ? new Date(s.current_period_end * 1000).toISOString()
      : null,
  });
  return { ok: true, endsAt: s.current_period_end };
}

export async function resumeSubscription(shop) {
  if (!shop.stripe_subscription_id) return { ok: false, error: 'No subscription to resume.' };
  await stripe(`subscriptions/${shop.stripe_subscription_id}`, {
    form: { cancel_at_period_end: 'false' },
  });
  await update('fp_shops', `id=eq.${shop.id}`, {
    subscription_status: 'active',
    subscription_ends_at: null,
  });
  return { ok: true };
}

/** Billing portal, so card changes and invoices are Stripe's problem, not ours. */
export async function portalUrl(shop) {
  if (!shop.stripe_customer_id) return null;
  const p = await stripe('billing_portal/sessions', {
    form: { customer: shop.stripe_customer_id, return_url: `${site()}/dashboard` },
  });
  return p.url;
}

/** Verify a Stripe webhook signature. Same discipline as the Twilio webhooks. */
export async function verifyStripeSignature(rawBody, header) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  const parts = Object.fromEntries(
    String(header || '')
      .split(',')
      .map((p) => p.split('='))
      .filter((p) => p.length === 2)
  );
  if (!parts.t || !parts.v1) return false;

  // Reject anything older than five minutes, so a captured request cannot be replayed.
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;

  const crypto = await import('node:crypto');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

/** Apply a Stripe event to the shop record. */
export async function applyEvent(event) {
  const o = event?.data?.object || {};
  const shopId = o.metadata?.shop_id || o.subscription_details?.metadata?.shop_id;

  const findShop = async () => {
    if (shopId) return selectOne('fp_shops', `id=eq.${shopId}`);
    if (o.customer) return selectOne('fp_shops', `stripe_customer_id=eq.${o.customer}`);
    return null;
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const shop = await findShop();
      if (!shop) break;
      await update('fp_shops', `id=eq.${shop.id}`, {
        stripe_subscription_id: o.subscription || null,
        stripe_customer_id: o.customer || shop.stripe_customer_id,
        subscription_status: 'active',
        subscription_ends_at: null,
      });
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const shop = await findShop();
      if (!shop) break;
      const status = o.cancel_at_period_end ? 'cancelling' : o.status;
      await update('fp_shops', `id=eq.${shop.id}`, {
        stripe_subscription_id: o.id,
        subscription_status: status,
        subscription_ends_at: o.current_period_end
          ? new Date(o.current_period_end * 1000).toISOString()
          : null,
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const shop = await findShop();
      if (!shop) break;
      await update('fp_shops', `id=eq.${shop.id}`, {
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
      });
      break;
    }
    case 'invoice.payment_failed': {
      const shop = await findShop();
      if (!shop) break;
      await update('fp_shops', `id=eq.${shop.id}`, { subscription_status: 'past_due' });
      break;
    }
    default:
      break;
  }
}

/** Is this shop allowed to be answering calls? */
export function isSubscribed(shop) {
  return ['active', 'trialing', 'cancelling'].includes(shop?.subscription_status);
}
