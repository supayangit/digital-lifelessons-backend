import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

/**
 * Verifies the authenticated user is the owner of the lesson,
 * or an admin. Attaches req.lesson to the request.
 * Requires verifySession to run first.
 */
export async function verifyLessonOwner(req, res, next) {
  try {
    const db = getDB();
    const lessonId = req.params.id;

    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({ success: false, message: "Invalid lesson ID." });
    }

    const lesson = await db
      .collection("lessons")
      .findOne({ _id: new ObjectId(lessonId) });

    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found." });
    }

    const isOwner = lesson.creatorId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You are not the owner of this lesson.",
      });
    }

    req.lesson = lesson;
    next();
  } catch (err) {
    console.error("[v0] verifyLessonOwner error:", err.message);
    next(err);
  }
}
