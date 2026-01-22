// import { useEffect, useState } from "react";
// import { Bell } from "lucide-react";
// import { useAuth, useUser } from "@clerk/clerk-react";
// import { getSocket } from "../utils/socket";

// const NotificationBell = () => {
//   const { getToken } = useAuth();
//   const { user } = useUser();

//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

//   /* ================= FETCH UNREAD COUNT ================= */
//   const fetchUnreadCount = async () => {
//     try {
//       const token = await getToken();
//       const res = await fetch(
//         "http://localhost:5000/api/notifications/unread-count",
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       const data = await res.json();
//       setUnreadCount(data.count || 0);
//     } catch (err) {
//       console.error("Unread count error", err);
//     }
//   };

//   /* ================= FETCH NOTIFICATIONS ================= */
//   const fetchNotifications = async () => {
//     try {
//       setLoading(true);
//       const token = await getToken();
//       const res = await fetch(
//         "http://localhost:5000/api/notifications",
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setNotifications(await res.json());
//     } catch (err) {
//       console.error("Fetch notifications error", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= MARK AS READ ================= */
//   const markAsRead = async (id) => {
//     try {
//       const token = await getToken();
//       await fetch(
//         `http://localhost:5000/api/notifications/${id}/read`,
//         {
//           method: "PATCH",
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       setNotifications((prev) =>
//         prev.map((n) =>
//           n.id === id ? { ...n, is_read: true } : n
//         )
//       );

//       fetchUnreadCount();
//     } catch (err) {
//       console.error("Mark read error", err);
//     }
//   };

//   /* ================= REALTIME SOCKET ================= */
//   useEffect(() => {
//     if (!user?.id) return;

//     const socket = getSocket();
//     if (!socket) return;

//     socket.on("notification:new", (notification) => {
//       setNotifications((prev) => [notification, ...prev]);
//       setUnreadCount((count) => count + 1);
//     });

//     return () => {
//       socket.off("notification:new");
//     };
//   }, [user]);

//   /* ================= INIT ================= */
//   useEffect(() => {
//     fetchUnreadCount();
//   }, []);

//   return (
//     <div className="relative">
//       {/* Bell */}
//       <button
//         onClick={() => {
//           setOpen(!open);
//           fetchNotifications();
//           fetchUnreadCount();
//         }}
//         className="relative p-2 rounded-full hover:bg-secondary/50 transition"
//       >
//         <Bell className="w-6 h-6 text-warning" />

//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-destructive text-white text-xs font-bold rounded-full animate-pulse">
//             {unreadCount}
//           </span>
//         )}
//       </button>

//       {/* Dropdown */}
//       {open && (
//         <>
//           <div
//             className="fixed inset-0 z-40"
//             onClick={() => setOpen(false)}
//           />

//           <div className="absolute right-0 top-12 w-80 glass-card z-50 rounded-xl shadow-xl overflow-hidden animate-fade-in">
//             <div className="px-4 py-3 border-b border-border bg-secondary/30">
//               <h3 className="font-semibold">Notifications</h3>
//             </div>

//             <div className="max-h-80 overflow-y-auto">
//               {loading ? (
//                 <p className="p-4 text-center text-muted-foreground">
//                   Loading...
//                 </p>
//               ) : notifications.length === 0 ? (
//                 <p className="p-4 text-center text-muted-foreground">
//                   No notifications
//                 </p>
//               ) : (
//                 notifications.map((n) => (
//                   <div
//                     key={n.id}
//                     onClick={() => !n.is_read && markAsRead(n.id)}
//                     className={`px-4 py-3 cursor-pointer border-b border-border/50 hover:bg-secondary/30 ${
//                       n.is_read ? "bg-transparent" : "bg-primary/5"
//                     }`}
//                   >
//                     <div className="flex items-start gap-3">
//                       {!n.is_read && (
//                         <span className="w-2 h-2 mt-2 rounded-full bg-primary" />
//                       )}
//                       <p
//                         className={`text-sm ${
//                           n.is_read
//                             ? "text-muted-foreground"
//                             : "text-foreground"
//                         }`}
//                       >
//                         {n.message}
//                       </p>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>

//             <div className="px-4 py-3 border-t border-border bg-secondary/30 text-center">
//               <span className="text-sm text-muted-foreground">
//                 Latest 20 notifications
//               </span>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default NotificationBell;

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { connectSocket } from "../utils/socket";

const NotificationBell = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = async () => {
    const token = await getToken();
    const res = await fetch(
      "http://localhost:5000/api/notifications/unread-count",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setUnreadCount(data.count || 0);
  };

  const fetchNotifications = async () => {
    const token = await getToken();
    const res = await fetch("http://localhost:5000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(await res.json());
  };

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectSocket(user.id);

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("notification:new");
    };
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          fetchNotifications();
          fetchUnreadCount();
        }}
        className="relative p-2 rounded-full hover:bg-secondary/50"
      >
        <Bell className="w-6 h-6 text-warning" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-card z-50">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">
              No notifications
            </p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-3 border-b">
                <p className="text-sm">
  {n.message}
  {n.metadata?.projectName && (
    <span className="text-muted-foreground">
      {" "}in <b>{n.metadata.projectName}</b>
    </span>
  )}
  {n.metadata?.workspaceName && (
    <span className="text-muted-foreground">
      {" "}({n.metadata.workspaceName})
    </span>
  )}
</p>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
