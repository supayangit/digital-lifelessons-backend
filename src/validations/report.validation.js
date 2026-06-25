import { z } from "zod";
import { REPORT_REASONS } from "../constants/index.js";

export const createReportSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  reason: z.enum(REPORT_REASONS),
});
