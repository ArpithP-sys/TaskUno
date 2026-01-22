import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

import { connectSocket } from "./utils/socket";

import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import WorkspacePage from "./pages/WorkspacePage";
import ProjectPage from "./pages/ProjectPage";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashBoardPage";
import WorkspaceDashboardPage from "./pages/WorkspaceDashboardPage";
import SearchPage from "./pages/SearchPage";
import InvitePage from "./pages/InvitePage";

function App() {
  const { user } = useUser();

  /* ================= SOCKET INIT ================= */
  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
    }
  }, [user]);

  return (
    <Routes>
      {/* AUTH PAGE */}
      <Route
        path="/auth"
        element={
          <SignedOut>
            <AuthPage />
          </SignedOut>
        }
      />

      {/* HOME */}
      <Route
        path="/"
        element={
          <>
            <SignedIn>
              <Index />
            </SignedIn>

            <SignedOut>
              <Navigate to="/auth" replace />
            </SignedOut>
          </>
        }
      />

      {/* PROTECTED ROUTES */}
      <Route path="/workspace/:slug" element={<SignedIn><WorkspacePage /></SignedIn>} />
      <Route path="/workspace/:slug/project/:projectId" element={<SignedIn><ProjectPage /></SignedIn>} />
      <Route path="/workspace/:slug/dashboard" element={<SignedIn><WorkspaceDashboardPage /></SignedIn>} />
      <Route path="/calendar" element={<SignedIn><CalendarPage /></SignedIn>} />
      <Route path="/dashboard" element={<SignedIn><DashboardPage /></SignedIn>} />
      <Route path="/search" element={<SignedIn><SearchPage /></SignedIn>} />

      {/* INVITE */}
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
