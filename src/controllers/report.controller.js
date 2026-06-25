import * as ReportService from "../services/report.service.js";
import { createReportSchema } from "../validations/report.validation.js";

export async function createReport(req, res) {
  const data = createReportSchema.parse(req.body);
  const report = await ReportService.createReport(data, req.user);
  res.status(201).json({ success: true, report });
}
