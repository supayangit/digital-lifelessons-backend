import * as DashboardService from "../services/dashboard.service.js";

export async function getOverview(req, res) {
  const data = await DashboardService.getDashboardOverview(req.user.id);
  res.json({ success: true, ...data });
}
