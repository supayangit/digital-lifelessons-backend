import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

export async function createReport(data, user) {
  const db = getDB();

  if (!ObjectId.isValid(data.lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const lessonOid = new ObjectId(data.lessonId);
  const reporterOid = new ObjectId(user.id);

  // Validate lesson exists
  const lesson = await db.collection("lessons").findOne({ _id: lessonOid });
  if (!lesson) {
    const err = new Error("Lesson not found.");
    err.statusCode = 404;
    throw err;
  }

  // Prevent duplicate reports from the same user
  const existing = await db.collection("lessonReports").findOne({
    lessonId: lessonOid,
    reporterId: reporterOid,
  });

  if (existing) {
    const err = new Error("You have already reported this lesson.");
    err.statusCode = 409;
    throw err;
  }

  const doc = {
    lessonId: lessonOid,
    reporterId: reporterOid,
    reporterEmail: user.email,
    reason: data.reason,
    createdAt: new Date(),
  };

  const result = await db.collection("lessonReports").insertOne(doc);

  await db.collection("lessons").updateOne(
    { _id: lessonOid },
    { $set: { isFlagged: true } }
  );

  return { ...doc, _id: result.insertedId };
}
