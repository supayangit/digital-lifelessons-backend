import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { isAdminOrCeo } from "../utils/roles.js";

export async function createComment(data, user) {
  const db = getDB();

  if (!ObjectId.isValid(data.lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const lesson = await db
    .collection("lessons")
    .findOne({ _id: new ObjectId(data.lessonId) });

  if (!lesson) {
    const err = new Error("Lesson not found.");
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();
  const doc = {
    lessonId: new ObjectId(data.lessonId),
    userId: new ObjectId(user.id),
    userName: user.name,
    userPhoto: user.image || null,
    content: data.content,
    createdAt: now,
  };

  const result = await db.collection("comments").insertOne(doc);

  // Increment lesson commentsCount
  await db
    .collection("lessons")
    .updateOne({ _id: new ObjectId(data.lessonId) }, { $inc: { commentsCount: 1 } });

  return { ...doc, _id: result.insertedId };
}

async function enrichCommentsWithUser(db, comments) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return comments;
  }

  const userIds = [...new Set(
    comments
      .map((comment) => comment.userId)
      .filter(Boolean)
      .map((id) => id.toString())
  )];

  if (userIds.length === 0) {
    return comments;
  }

  const users = await db
    .collection("user")
    .find(
      { _id: { $in: userIds.map((id) => new ObjectId(id)) } },
      { projection: { name: 1, email: 1, image: 1 } }
    )
    .toArray();

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  return comments.map((comment) => {
    const author = userMap.get(comment.userId?.toString());
    return {
      ...comment,
      userName: author?.name || comment.userName || null,
      userPhoto: author?.image || comment.userPhoto || null,
    };
  });
}

export async function getCommentsByLesson(lessonId, query) {
  const db = getDB();

  if (!ObjectId.isValid(lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const { page, limit, skip } = parsePagination(query);
  const filter = { lessonId: new ObjectId(lessonId) };

  const [comments, total] = await Promise.all([
    db.collection("comments").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection("comments").countDocuments(filter),
  ]);

  const enrichedComments = await enrichCommentsWithUser(db, comments);
  return { comments: enrichedComments, pagination: buildPaginationMeta({ page, limit, total }) };
}

export async function deleteComment(commentId, user) {
  const db = getDB();

  if (!ObjectId.isValid(commentId)) {
    const err = new Error("Invalid comment ID.");
    err.statusCode = 400;
    throw err;
  }

  const comment = await db.collection("comments").findOne({ _id: new ObjectId(commentId) });

  if (!comment) {
    const err = new Error("Comment not found.");
    err.statusCode = 404;
    throw err;
  }

  const isOwner = comment.userId.toString() === user.id;
  const isAdmin = isAdminOrCeo(user.role);

  if (!isOwner && !isAdmin) {
    const err = new Error("Forbidden. You cannot delete this comment.");
    err.statusCode = 403;
    throw err;
  }

  await db.collection("comments").deleteOne({ _id: new ObjectId(commentId) });

  // Decrement commentsCount on the lesson
  await db
    .collection("lessons")
    .updateOne({ _id: comment.lessonId }, { $inc: { commentsCount: -1 } });

  return { deleted: true };
}
