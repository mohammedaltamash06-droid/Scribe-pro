import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, icon: Icon, description, trend, trendUp }: StatCardProps) {
  return (
    <Card className="rounded-xl border bg-card shadow-soft transition-all duration-200 hover:shadow-medium">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && (
          <div className="flex items-center mt-3 pt-2 border-t border-border/50">
            {trendUp ? (
              <TrendingUp className="h-3 w-3 text-medical-success mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive mr-1" />
            )}
            <Badge 
              variant="outline" 
              className={`text-xs font-medium ${
                trendUp 
                  ? 'text-medical-success border-medical-success/20 bg-medical-success/5' 
                  : 'text-destructive border-destructive/20 bg-destructive/5'
              }`}
            >
              {trend}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}