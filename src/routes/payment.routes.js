import { Router } from "express";
import express from "express";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { verifySession } from "../middlewares/verifySession.js";
import * as PaymentController from "../controllers/payment.controller.js";

const router = Router();

// Stripe webhook — must receive raw body for signature verification
// Note: The raw body middleware is applied BEFORE express.json() for this specific route in app.js
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(PaymentController.stripeWebhook)
);

// Create checkout session (protected)
router.post(
  "/create-checkout-session",
  verifySession,
  asyncHandler(PaymentController.createCheckoutSession)
);

export default router;
