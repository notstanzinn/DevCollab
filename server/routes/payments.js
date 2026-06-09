const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const stripeService = require('../services/stripe');

// POST /api/payments/create-checkout — Create Stripe checkout session
router.post('/create-checkout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripeService.createCheckoutSession(
      customerId,
      stripeService.PLANS.pro.priceId,
      user._id
    );

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/portal — Billing portal
router.post('/portal', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No billing account found' });
    }
    const session = await stripeService.createPortalSession(user.stripeCustomerId);
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('plan stripeSubscriptionId');
    res.json({ plan: user.plan, subscriptionId: user.stripeSubscriptionId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/webhook — Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeService.constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const subscriptionId = session.subscription;

        await User.findByIdAndUpdate(userId, {
          plan: 'pro',
          stripeSubscriptionId: subscriptionId,
        });

        await Notification.create({
          recipient: userId,
          type: 'payment',
          message: '🎉 Welcome to DevCollab Pro! Your subscription is now active.',
          link: '/profile',
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        if (user) {
          user.plan = 'free';
          user.stripeSubscriptionId = '';
          await user.save();

          await Notification.create({
            recipient: user._id,
            type: 'payment',
            message: 'Your Pro subscription has ended. You have been moved to the Free plan.',
            link: '/pricing',
          });
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

module.exports = router;
