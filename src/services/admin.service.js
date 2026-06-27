import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { getAdminAnalytics, getReportedLessonsAggregation } from "../utils/aggregation.js";

export async function getAdminOverview() {
  return getAdminAnalytics();
}

export async function listUsers(query) {
  const db = getDB();
  const { page, limit, skip } = parsePagination(query);

  const filter = {};
  if (query.search) {
    const regex = { $regex: query.search, $options: "i" };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    db
      .collection("user")
      .find(filter, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("user").countDocuments(filter),
  ]);

  // Add lessonsCount for each user
  const usersWithCounts = await Promise.all(
    users.map(async (user) => {
      const lessonsCount = await db.collection("lessons").countDocuments({ creatorId: user._id });
      return { ...user, lessonsCount };
    })
  );

  return { users: usersWithCounts, pagination: buildPaginationMeta({ page, limit, total }) };
}

export async function updateUserRole(userId, role, requesterRole) {
  const db = getDB();

  if (!ObjectId.isValid(userId)) {
    const err = new Error("Invalid user ID.");
    err.statusCode = 400;
    throw err;
  }

  const validRoles = ["user", "contributor", "curator", "admin", "ceo"];
  if (!validRoles.includes(role)) {
    const err = new Error("Invalid role. Must be 'user', 'contributor', 'curator', 'admin', or 'ceo'.");
    err.statusCode = 400;
    throw err;
  }

  // Fetch target user to check their current role
  const targetUser = await db.collection("user").findOne({ _id: new ObjectId(userId) });
  if (!targetUser) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  // Role hierarchy: ceo > admin > curator > contributor > user
  const roleHierarchy = { ceo: 5, admin: 4, curator: 3, contributor: 2, user: 1 };
  const requesterHierarchy = roleHierarchy[requesterRole] || 0;
  const targetHierarchy = roleHierarchy[targetUser.role] || 0;
  const newRoleHierarchy = roleHierarchy[role] || 0;

  // CEO can set any role except another CEO
  if (requesterRole === "ceo") {
    if (role === "ceo") {
      const err = new Error("CEO cannot assign CEO role to another user.");
      err.statusCode = 403;
      throw err;
    }
  }
  // Admin can only change users with lower hierarchy (curator, contributor, user)
  else if (requesterRole === "admin") {
    // Cannot change CEO or other admin
    if (targetHierarchy >= roleHierarchy["admin"]) {
      const err = new Error("Admin cannot change the role of a CEO or another Admin.");
      err.statusCode = 403;
      throw err;
    }
    // Cannot assign admin or CEO roles
    if (newRoleHierarchy >= roleHierarchy["admin"]) {
      const err = new Error("Admin can only assign curator, contributor, or user roles.");
      err.statusCode = 403;
      throw err;
    }
  }
  // Other roles cannot change roles
  else {
    const err = new Error("You do not have permission to change user roles.");
    err.statusCode = 403;
    throw err;
  }

  const result = await db.collection("user").findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: "after", projection: { password: 0 } }
  );

  return result;
}

export async function updateUserSubscription(userId, isPremium) {
  const db = getDB();

  if (!ObjectId.isValid(userId)) {
    const err = new Error("Invalid user ID.");
    err.statusCode = 400;
    throw err;
  }

  const updateData = { isPremium, updatedAt: new Date() };
  if (isPremium) {
    updateData.premiumSince = new Date();
  }

  const result = await db.collection("user").findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: updateData },
    { returnDocument: "after", projection: { password: 0 } }
  );

  if (!result) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return result;
}

export async function deleteUser(userId) {
  const db = getDB();

  if (!ObjectId.isValid(userId)) {
    const err = new Error("Invalid user ID.");
    err.statusCode = 400;
    throw err;
  }

  const oid = new ObjectId(userId);
  const user = await db.collection("user").findOne({ _id: oid }, { projection: { email: 1 } });

  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  await db.collection("deleted_user").insertOne({
    userId: oid,
    email: user.email,
    deletedAt: new Date(),
  });

  const result = await db.collection("user").deleteOne({ _id: oid });

  if (result.deletedCount === 0) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return { deleted: true };
}

export async function listAdminLessons(query) {
  const db = getDB();
  const { page, limit, skip } = parsePagination(query);

  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.visibility) filter.visibility = query.visibility;
  if (query.featured !== undefined) filter.featured = query.featured === "true";
  if (query.reviewed !== undefined) filter.reviewed = query.reviewed === "true";

  const [lessons, total] = await Promise.all([
    db.collection("lessons").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection("lessons").countDocuments(filter),
  ]);

  return { lessons, pagination: buildPaginationMeta({ page, limit, total }) };
}

export async function toggleFeature(lessonId) {
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

  const result = await db.collection("lessons").findOneAndUpdate(
    { _id: new ObjectId(lessonId) },
    { $set: { featured: !lesson.featured, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result;
}

export async function markReviewed(lessonId) {
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

  const result = await db.collection("lessons").findOneAndUpdate(
    { _id: new ObjectId(lessonId) },
    { $set: { reviewed: !lesson.reviewed, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result;
}

export async function adminDeleteLesson(lessonId) {
  const db = getDB();

  if (!ObjectId.isValid(lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const oid = new ObjectId(lessonId);
  const result = await db.collection("lessons").deleteOne({ _id: oid });

  if (result.deletedCount === 0) {
    const err = new Error("Lesson not found.");
    err.statusCode = 404;
    throw err;
  }

  await Promise.all([
    db.collection("comments").deleteMany({ lessonId: oid }),
    db.collection("favorites").deleteMany({ lessonId: oid }),
    db.collection("lessonReports").deleteMany({ lessonId: oid }),
  ]);

  return { deleted: true };
}

export async function getReportedLessons(query) {
  const { page, limit, skip } = parsePagination(query);
  const data = await getReportedLessonsAggregation({ skip, limit });
  return { data };
}

export async function ignoreReports(lessonId) {
  const db = getDB();

  if (!ObjectId.isValid(lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const oid = new ObjectId(lessonId);
  const result = await db.collection("lessonReports").deleteMany({ lessonId: oid });

  await db.collection("lessons").updateOne(
    { _id: oid },
    { $set: { isFlagged: false } }
  );

  return { removed: result.deletedCount };
}

export async function deleteReportedLesson(lessonId) {
  const db = getDB();

  if (!ObjectId.isValid(lessonId)) {
    const err = new Error("Invalid lesson ID.");
    err.statusCode = 400;
    throw err;
  }

  const oid = new ObjectId(lessonId);

  await Promise.all([
    db.collection("lessons").deleteOne({ _id: oid }),
    db.collection("lessonReports").deleteMany({ lessonId: oid }),
    db.collection("comments").deleteMany({ lessonId: oid }),
    db.collection("favorites").deleteMany({ lessonId: oid }),
  ]);

  return { deleted: true };
}
