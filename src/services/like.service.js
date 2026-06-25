import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

export async function saveLike(lessonId, userId) {
  const db = getDB();

  if (!ObjectId.isValid(lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const lesson = await db.collection("lessons").findOne({ _id: new ObjectId(lessonId) });
  if (!lesson) {
    const err = new Error("Lesson not found.");
    err.statusCode = 404;
    throw err;
  }

  const lessonOid = new ObjectId(lessonId);
  const userOid = new ObjectId(userId);
  const now = new Date();

  const existing = await db.collection("likes").findOne({ userId: userOid, lessonId: lessonOid });
  if (existing) {
    const err = new Error("Lesson is already liked.");
    err.statusCode = 409;
    throw err;
  }

  await db.collection("likes").insertOne({ userId: userOid, lessonId: lessonOid, createdAt: now });

  await db.collection("lessons").updateOne({ _id: lessonOid }, { $inc: { likesCount: 1 } });

  return { saved: true };
}

export async function removeLike(lessonId, userId) {
  const db = getDB();

  if (!ObjectId.isValid(lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const result = await db.collection("likes").deleteOne({
    userId: new ObjectId(userId),
    lessonId: new ObjectId(lessonId),
  });

  if (result.deletedCount === 0) {
    const err = new Error("Like not found.");
    err.statusCode = 404;
    throw err;
  }

  await db.collection("lessons").updateOne({ _id: new ObjectId(lessonId) }, { $inc: { likesCount: -1 } });

  return { removed: true };
}

export async function getMyLikes(userId, query) {
  const db = getDB();
  const { page, limit, skip } = parsePagination(query);
  const userOid = new ObjectId(userId);

  const lessonMatch = {};
  if (query.category) lessonMatch["lesson.category"] = query.category;
  if (query.tone) lessonMatch["lesson.tone"] = query.tone;

  const pipeline = [
    { $match: { userId: userOid } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "lessons",
        localField: "lessonId",
        foreignField: "_id",
        as: "lesson",
      },
    },
    { $unwind: "$lesson" },
    ...(Object.keys(lessonMatch).length > 0 ? [{ $match: lessonMatch }] : []),
    { $skip: skip },
    { $limit: limit },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$lesson", { likedAt: "$createdAt" }],
        },
      },
    },
  ];

  const countPipeline = [
    { $match: { userId: userOid } },
    {
      $lookup: {
        from: "lessons",
        localField: "lessonId",
        foreignField: "_id",
        as: "lesson",
      },
    },
    { $unwind: "$lesson" },
    ...(Object.keys(lessonMatch).length > 0 ? [{ $match: lessonMatch }] : []),
    { $count: "total" },
  ];

  const [likes, countResult] = await Promise.all([
    db.collection("likes").aggregate(pipeline).toArray(),
    db.collection("likes").aggregate(countPipeline).toArray(),
  ]);

  const total = countResult[0]?.total || 0;

  return { likes, pagination: buildPaginationMeta({ page, limit, total }) };
}

export async function toggleLike(lessonId, userId) {
  const db = getDB();

  if (!ObjectId.isValid(lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const lesson = await db.collection("lessons").findOne({ _id: new ObjectId(lessonId) });
  if (!lesson) {
    const err = new Error("Lesson not found.");
    err.statusCode = 404;
    throw err;
  }

  const like = await db.collection("likes").findOne({
    userId: new ObjectId(userId),
    lessonId: lesson._id,
  });

  if (like) {
    await db.collection("likes").deleteOne({ _id: like._id });
    await db.collection("lessons").updateOne({ _id: lesson._id }, { $inc: { likesCount: -1 } });
    const updatedLesson = await db.collection("lessons").findOne({ _id: lesson._id });
    return { liked: false, lesson: updatedLesson };
  }

  await db.collection("likes").insertOne({ userId: new ObjectId(userId), lessonId: lesson._id, createdAt: new Date() });
  await db.collection("lessons").updateOne({ _id: lesson._id }, { $inc: { likesCount: 1 } });
  const updatedLesson = await db.collection("lessons").findOne({ _id: lesson._id });
  return { liked: true, lesson: updatedLesson };
}
