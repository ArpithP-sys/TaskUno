// import { io } from "socket.io-client";

// const SOCKET_URL = "http://localhost:5000";

// let socket = null;

// /**
//  * Connect socket AFTER login
//  * getToken comes from Clerk useAuth()
//  */
// export const connectSocket = async (getToken) => {
//   if (socket) return socket;

//   const token = await getToken(); // 🔑 Clerk JWT

//   socket = io(SOCKET_URL, {
//     auth: {
//       token, // ✅ SEND JWT TO SERVER
//     },
//     transports: ["websocket"],
//   });

//   socket.on("connect", () => {
//     console.log("🔌 Socket connected:", socket.id);
//   });

//   socket.on("disconnect", () => {
//     console.log("❌ Socket disconnected");
//   });

//   socket.on("connect_error", (err) => {
//     console.error("❌ Socket error:", err.message);
//   });

//   return socket;
// };

// export const getSocket = () => socket;


import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";
let socket = null;

export const connectSocket = ({ userId } = {}) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });
  }

  if (userId) {
    console.log("📨 Joining user room:", userId);
    socket.emit("join-user", { userId });
  }

  return socket;
};

export const getSocket = () => socket;

