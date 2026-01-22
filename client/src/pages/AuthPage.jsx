import { SignIn } from "@clerk/clerk-react";

const AuthPage = () => {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center relative overflow-hidden">

      {/* BACKGROUND GLOWS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/25 blur-[180px]" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[700px] h-[700px] rounded-full bg-accent/20 blur-[160px]" />
      </div>

      {/* CONTENT WRAPPER */}
      <div className="relative z-10 w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* LEFT BRAND PANEL */}
          <div className="hidden lg:flex flex-col justify-center animate-fade-in">
            <h1 className="text-6xl font-extrabold text-foreground leading-tight">
              Welcome to <span className="text-gradient">TaskUno</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              A modern project & task management platform built for
              high-performing teams.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "Workspaces & Projects",
                "Task assignments & priorities",
                "Calendar scheduling",
                "Real-time notifications",
              ].map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 rounded-full bg-secondary/60 border border-border text-sm text-foreground backdrop-blur"
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>

          {/* AUTH CARD */}
          <div className="flex justify-center animate-scale-in">
            <div className="w-[420px] max-w-full glass-card p-8 hover-lift glow-primary">
              <SignIn
                appearance={{
                  layout: {
                    socialButtonsPlacement: "top",
                    socialButtonsVariant: "iconButton",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none w-full",
                    headerTitle: "text-foreground text-xl",
                    headerSubtitle: "text-muted-foreground",
                    formFieldLabel: "text-muted-foreground",
                    formFieldInput:
                      "bg-secondary/60 border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent",
                    formButtonPrimary:
                      "w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition glow-primary",
                  },
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
