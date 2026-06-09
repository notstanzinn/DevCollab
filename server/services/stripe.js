const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey && !stripeKey.startsWith('YOUR_') ? require('stripe')(stripeKey) : null;


const PLANS = {
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    amount: 999, // $9.99/month in cents
  },
};

const createCustomer = async (email, name) => {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.customers.create({ email, name });
};

const createCheckoutSession = async (customerId, priceId, userId) => {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.CLIENT_URL}/pricing?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/pricing?cancelled=true`,
    metadata: { userId: userId.toString() },
  });
};

const createPortalSession = async (customerId) => {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.CLIENT_URL}/profile`,
  });
};

const constructWebhookEvent = (payload, signature) => {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

const cancelSubscription = async (subscriptionId) => {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.subscriptions.cancel(subscriptionId);
};

module.exports = {
  PLANS,
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  cancelSubscription,
};
