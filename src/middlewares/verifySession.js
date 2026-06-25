import { getAuth } from "../auth/auth.js";
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

/**
 * Verifies that a valid session exists and attaches user to req.user
 */
export async function verifySession(req, res, next) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    // Fetch fresh user data from DB to get role, isPremium, etc.
    const db = getDB();
    const user = await db
      .collection("user")
      .findOne({ _id: new ObjectId(session.user.id) });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role || "user",
      isPremium: user.isPremium || false,
      premiumSince: user.premiumSince || null,
    };

    next();
  } catch (err) {
    console.error("[v0] verifySession error:", err.message);
    return res.status(401).json({ success: false, message: "Invalid or expired session." });
  }
}
