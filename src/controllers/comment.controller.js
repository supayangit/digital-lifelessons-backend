import * as CommentService from "../services/comment.service.js";
import { createCommentSchema } from "../validations/comment.validation.js";

export async function createComment(req, res) {
  const data = createCommentSchema.parse(req.body);
  const comment = await CommentService.createComment(data, req.user);
  res.status(201).json({ success: true, comment });
}

export async function getCommentsByLesson(req, res) {
  const result = await CommentService.getCommentsByLesson(req.params.lessonId, req.query);
  res.json({ success: true, ...result });
}

export async function deleteComment(req, res) {
  await CommentService.deleteComment(req.params.id, req.user);
  res.json({ success: true, message: "Comment deleted." });
}
