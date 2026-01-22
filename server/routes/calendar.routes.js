import express from "express";
import { getCalendarTasks } from "../controllers/calendar.controller.js";

const router = express.Router();

router.get("/", getCalendarTasks);

export default router;

// import express from "express";
// import { requireAuth } from "@clerk/express";
// import { getCalendarTasks } from "../controllers/calendar.controller.js";

// const router = express.Router();

// // ✅ PROTECTED ROUTE
// router.get("/", requireAuth, getCalendarTasks);

// export default router;

