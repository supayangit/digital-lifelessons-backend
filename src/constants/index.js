export const ROLES = Object.freeze({
  USER: "user",
  CONTRIBUTOR: "contributor",
  CURATOR: "curator",
  ADMIN: "admin",
  CEO: "ceo",
});

export const ACCESS_LEVELS = Object.freeze({
  FREE: "free",
  PREMIUM: "premium",
});

export const VISIBILITY = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
});

export const CATEGORIES = Object.freeze([
  'Career', 'Relationships', 'Finance', 'Health', 'Mindset',
  'Education', 'Parenting', 'Travel', 'Technology', 'Other',
]);

export const TONES = Object.freeze([
  "Inspiring",
  "Reflective",
  "Humorous",
  "Cautionary",
  "Motivational",
  "Grateful",
  "Sad",
  "Neutral",
]);

export const REPORT_REASONS = Object.freeze([
  "Spam",
  "Harassment",
  "Misleading",
  "Inappropriate",
  "Other",
]);

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
});

// Stripe amount in smallest currency unit (BDT paisa / cents)
export const PREMIUM_PRICE_BDT = 1500 * 100; // 1500 BDT in paisa
export const PREMIUM_CURRENCY = "bdt";
