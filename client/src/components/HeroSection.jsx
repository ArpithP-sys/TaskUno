import { CheckCircle, Calendar, Users, Bell } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="mb-12 animate-fade-in">
      <h1 className="text-4xl font-extrabold mb-4">
        Welcome to <span className="text-gradient">TaskUno</span>
      </h1>

      <p className="text-muted-foreground max-w-2xl mb-6">
        A modern project & task management platform built for teams.
        Organize, collaborate, and deliver projects on time.
      </p>

      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Workspaces & Projects
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          Task assignments & priorities
        </li>
        <li className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Calendar scheduling
        </li>
        <li className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Real-time notifications
        </li>
      </ul>
    </section>
  );
};

export default HeroSection;
