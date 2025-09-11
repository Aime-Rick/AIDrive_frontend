import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { HardDrive, Bot, Settings, LogOut, BrainCircuit } from "lucide-react";

const Sidebar = () => {
  const { user, signOut } = useAuth();

  const navItems = [
    { to: "/", icon: HardDrive, label: "Drive" },
    { to: "/assistant", icon: Bot, label: "AI Assistant" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col p-4">
      <div className="flex items-center gap-2 p-2 mb-4">
        <BrainCircuit className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold">AIDrive</h1>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <Separator className="my-4" />
        <div className="flex flex-col gap-2 text-sm">
            <p className="font-semibold text-foreground truncate">{user?.email}</p>
            <p className="text-muted-foreground">Welcome back</p>
        </div>
        <Button variant="ghost" className="w-full justify-start mt-4" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
