import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";

const InvitePage = () => {
  const { token } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const joinWorkspace = async () => {
      try {
        const authToken = await getToken();

        const res = await fetch(
          `http://localhost:5000/api/workspaces/invite/${token}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data = await res.json();

        if (data.workspaceSlug) {
          setStatus("success");
          setMessage("You have successfully joined the workspace.");

          setTimeout(() => {
            navigate("/", {
              replace: true,
            });
          }, 1200);
        } else {
          setStatus("error");
          setMessage(data.error || "Invalid or expired invite link.");

          setTimeout(() => {
            navigate("/", { replace: true });
          }, 3000);
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong while joining the workspace.");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 3000);
      }
    };

    joinWorkspace();
  }, [token, getToken, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card max-w-md w-full p-10 text-center animate-scale-in">
        {status === "loading" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Joining Workspace</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your invitation…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome to the Team 🎉
            </h2>
            <p className="text-muted-foreground">{message}</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              Redirecting to home...
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Invitation Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="mt-6 text-sm text-muted-foreground">
              Redirecting to home…
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
