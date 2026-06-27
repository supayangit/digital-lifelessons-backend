import { isAdminOrCeo } from "../utils/roles.js";

/**
 * Requires verifySession to be called before this middleware.
 * Checks if req.user.role is admin or ceo.
 */
export function verifyAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  if (!isAdminOrCeo(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden. Admin access required." });
  }
  next();
}
