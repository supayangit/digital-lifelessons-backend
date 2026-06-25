import { z } from "zod";

export const createCommentSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  comment: z.string().min(1, "Comment cannot be empty").max(2000, "Comment too long"),
});
