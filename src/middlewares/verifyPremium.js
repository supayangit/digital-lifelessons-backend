import { isAdminOrCeo } from "../utils/roles.js";

/**
 * Requires verifySession to be called before this middleware.
 * Checks if req.user.isPremium === true OR req.user.role is admin/ceo.
 */
export function verifyPremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  if (!req.user.isPremium && !isAdminOrCeo(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Premium access required. Upgrade your plan to unlock this feature.",
    });
  }
  next();
}
