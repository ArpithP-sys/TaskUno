// import app from "./app.js";
// import pool from "./config/db.js";
// import http from "http";
// import { initSocket } from "./socket.js";
// import { setIO } from "./utils/socketEmitter.js";

// const PORT = process.env.PORT || 5000;

// // Create HTTP server
// const httpServer = http.createServer(app);

// // 🔌 Initialize socket.io
// const io = initSocket(httpServer);

// // ✅ Store io globally for controllers
// setIO(io);

// // DB check
// pool.query("SELECT NOW()", (err, res) => {
//   if (err) {
//     console.error("❌ DB connection failed", err);
//   } else {
//     console.log("✅ DB connected at:", res.rows[0].now);
//   }
// });

// // Start server
// httpServer.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

import http from "http";
import app from "./app.js";
import pool from "./config/db.js";
import { initSocket } from "./socket.js";
import { setIO } from "./utils/socketEmitter.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

// 🔌 Init socket and store globally
const io = initSocket(httpServer);
setIO(io);

// DB check
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ DB connection failed", err);
  } else {
    console.log("✅ DB connected at:", res.rows[0].now);
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

