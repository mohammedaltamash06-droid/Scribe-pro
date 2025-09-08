import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, Users, BarChart3, LogIn, Stethoscope } from "lucide-react";

const navigation = [
  { name: 'Transcribe', href: '/transcribe', icon: FileText },
  { name: 'Doctor', href: '/doctor', icon: Users },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="flex space-x-1 bg-card rounded-lg p-1 shadow-soft">
      <div className="flex items-center space-x-2 px-3 py-2">
        <Stethoscope className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg text-foreground">ScribePro</span>
      </div>
      
      <div className="flex space-x-1 ml-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        
        <Link
          to="/login"
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-all duration-200"
        >
          <LogIn className="h-4 w-4" />
          <span>Login</span>
        </Link>
      </div>
    </nav>
  );
}