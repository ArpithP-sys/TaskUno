// import { verifyToken } from "@clerk/backend";

// export const requireAuth = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Missing auth token" });
//     }

//     const token = authHeader.split(" ")[1];

//     const payload = await verifyToken(token, {
//       secretKey: process.env.CLERK_SECRET_KEY,
//     });

//     req.auth = {
//       userId: payload.sub,
//     };

//     next();
//   } catch (error) {
//     console.error("Auth error:", error);
//     return res.status(401).json({ message: "Unauthorized" });
//   }
// };


import { requireAuth as ClerkExpressRequireAuth } from "@clerk/express";

export const requireAuth = ClerkExpressRequireAuth({
  onError: (err, req, res) => {
    console.error("Clerk auth error:", err);
    res.status(401).json({ message: "Unauthorized" });
  },
});
