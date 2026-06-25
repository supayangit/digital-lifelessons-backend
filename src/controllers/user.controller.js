import * as UserService from "../services/user.service.js";
import { updateProfileSchema } from "../validations/user.validation.js";

export async function getProfile(req, res) {
  const result = await UserService.getUserProfile(req.user.id);
  res.json({ success: true, ...result });
}

export async function updateProfile(req, res) {
  const data = updateProfileSchema.parse(req.body);
  const user = await UserService.updateUserProfile(req.user.id, data);
  res.json({ success: true, user });
}
