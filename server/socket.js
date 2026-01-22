// import { Server } from "socket.io";
// import { verifyToken } from "@clerk/backend";

// let io;

// export const initSocket = (httpServer) => {
//   io = new Server(httpServer, {
//     cors: {
//       origin: "http://localhost:5173",
//       credentials: true,
//     },
//   });

//   /**
//    * 🔐 AUTH MIDDLEWARE (VERY IMPORTANT)
//    * This runs BEFORE connection is accepted
//    */
//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth?.token;

//       if (!token) {
//         return next(new Error("No auth token"));
//       }

//       const payload = await verifyToken(token, {
//         secretKey: process.env.CLERK_SECRET_KEY,
//       });

//       // attach user to socket
//       socket.user = {
//         clerkUserId: payload.sub,
//       };

//       next();
//     } catch (err) {
//       console.error("❌ Socket auth failed:", err.message);
//       next(new Error("Authentication failed"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log("🔌 Socket connected:", socket.id);
//     console.log("👤 Clerk user:", socket.user.clerkUserId);

//     /**
//      * 🔔 Join personal notification room
//      */
//     socket.on("join-user", ({ userId }) => {
//       if (userId) {
//         socket.join(`user:${userId}`);
//       }
//     });

//     /**
//      * 🔄 Join workspace room
//      */
//     socket.on("join-workspace", ({ workspaceId }) => {
//       if (workspaceId) {
//         socket.join(`workspace:${workspaceId}`);
//       }
//     });

//     socket.on("disconnect", () => {
//       console.log("❌ Socket disconnected:", socket.id);
//     });
//   });

//   return io;
// };

// export const getIO = () => {
//   if (!io) {
//     throw new Error("❌ Socket.io not initialized");
//   }
//   return io;
// };


import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // 👤 Personal notifications
    socket.on("join-user", ({ userId }) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 Joined user room: user:${userId}`);
      }
    });

    // 🏢 Workspace realtime updates
    socket.on("join-workspace", ({ workspaceId }) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        console.log(`🏢 Joined workspace room: workspace:${workspaceId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("❌ Socket.io not initialized");
  }
  return io;
};
