import express from "express";
import {
  getCommentsByTask,
  addComment,
} from "../controllers/comment.controller.js";

const router = express.Router();

router.get("/task/:taskId", getCommentsByTask);
router.post("/task/:taskId", addComment);

export default router;
