import * as FavoriteService from "../services/favorite.service.js";

export async function saveFavorite(req, res) {
  const { lessonId } = req.body;
  if (!lessonId) {
    return res.status(400).json({ success: false, message: "lessonId is required." });
  }
  const result = await FavoriteService.saveFavorite(lessonId, req.user.id);
  res.status(201).json({ success: true, ...result });
}

export async function removeFavorite(req, res) {
  const result = await FavoriteService.removeFavorite(req.params.lessonId, req.user.id);
  res.json({ success: true, ...result });
}

export async function getMyFavorites(req, res) {
  const result = await FavoriteService.getMyFavorites(req.user.id, req.query);
  res.json({ success: true, ...result });
}
