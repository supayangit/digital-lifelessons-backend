import * as LikeService from "../services/like.service.js";

export async function getMyLikes(req, res) {
  const result = await LikeService.getMyLikes(req.user.id, req.query);
  res.json({ success: true, ...result });
}

export async function saveLike(req, res) {
  const { lessonId } = req.body;
  if (!lessonId) {
    return res.status(400).json({ success: false, message: "lessonId is required." });
  }
  const result = await LikeService.saveLike(lessonId, req.user.id);
  res.status(201).json({ success: true, ...result });
}

export async function removeLike(req, res) {
  const result = await LikeService.removeLike(req.params.lessonId, req.user.id);
  res.json({ success: true, ...result });
}
