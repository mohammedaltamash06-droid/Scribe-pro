"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Users, BarChart3, LogIn } from "lucide-react";

const navigationItems = [
  {
    title: "Transcribe",
    href: "/transcribe",
    icon: Mic,
    description: "Audio to text conversion"
  },
  {
    title: "Doctor Profile",
    href: "/doctor",
    icon: Users,
    description: "Manage preferences"
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    description: "Analytics & reports"
  },
  {
    title: "Login",
    href: "/login",
    icon: LogIn,
    description: "Authentication"
  }
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <Card className="p-4 bg-gradient-secondary border-border/50 shadow-soft">
      <nav className="flex flex-wrap gap-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
              {isActive && (
                <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground">
                  Active
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </Card>
  );
}