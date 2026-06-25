import { z } from "zod";
import { CATEGORIES, TONES, ACCESS_LEVELS, VISIBILITY } from "../constants/index.js";

export const createLessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(10000),
  category: z.enum(CATEGORIES),
  tone: z.enum(TONES),
  visibility: z.enum([VISIBILITY.PUBLIC, VISIBILITY.PRIVATE]).default(VISIBILITY.PUBLIC),
  accessLevel: z.enum([ACCESS_LEVELS.FREE, ACCESS_LEVELS.PREMIUM]).default(ACCESS_LEVELS.FREE),
  image: z.string().url().optional(),
});

export const updateLessonSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(10000).optional(),
  category: z.enum(CATEGORIES).optional(),
  tone: z.enum(TONES).optional(),
  image: z.string().url().optional(),
});

export const visibilitySchema = z.object({
  visibility: z.enum([VISIBILITY.PUBLIC, VISIBILITY.PRIVATE]),
});

export const accessLevelSchema = z.object({
  accessLevel: z.enum([ACCESS_LEVELS.FREE, ACCESS_LEVELS.PREMIUM]),
});
