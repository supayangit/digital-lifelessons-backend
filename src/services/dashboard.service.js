import { ObjectId } from "mongodb";
import { getUserDashboardAnalytics } from "../utils/aggregation.js";

export async function getDashboardOverview(userId) {
  const oid = new ObjectId(userId);
  return getUserDashboardAnalytics(userId, oid);
}
