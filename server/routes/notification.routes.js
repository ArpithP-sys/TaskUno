import express from "express";
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);

export default router;
